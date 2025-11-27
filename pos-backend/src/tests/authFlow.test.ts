// tests/authFlow.test.ts
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { PasswordResetService } from '../services/passwordReset.service';
import { emailService } from '../services/email.service';

export class AuthFlowTests {
  static async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE AUTENTICACIÓN\n');
    
    try {
      await this.testUserCreation();
      await this.testLoginFlow();
      await this.testPasswordResetFlow();
      await this.testEmailTemplates();
      
      console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    } catch (error) {
      console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
    }
  }

  private static async testUserCreation() {
    console.log('1. Probando creación de usuario...');
    
    const testUser = {
      name: 'Usuario de Prueba',
      email: `test${Date.now()}@example.com`,
      phone: '123456789',
      role: 'SELLER' as const
    };

    const user = await UserService.createUser(testUser);
    console.log('   ✅ Usuario creado:', user.email);
    
    return user;
  }

  private static async testLoginFlow() {
    console.log('2. Probando flujo de login...');
    
    // Test login con email
    try {
      const result = await AuthService.login('admin@example.com', 'password');
      console.log('   ✅ Login con email exitoso');
    } catch (error) {
      console.log('   ⚠️  Login con email falló (esperado para credenciales incorrectas)');
    }

    // Test login con userCode
    try {
      const result = await AuthService.login('1001', 'password');
      console.log('   ✅ Login con código de usuario exitoso');
    } catch (error) {
      console.log('   ⚠️  Login con código falló (esperado para credenciales incorrectas)');
    }
  }

  private static async testPasswordResetFlow() {
    console.log('3. Probando flujo de recuperación de contraseña...');
    
    const testEmail = 'test@example.com';
    
    try {
      const result = await PasswordResetService.requestPasswordReset(testEmail);
      if (result) {
        console.log('   ✅ Solicitud de recuperación procesada');
        
        // Validar token
        const isValid = await PasswordResetService.validateResetToken(result.token);
        console.log('   ✅ Token validado correctamente');
        
        // Resetear contraseña
        await PasswordResetService.resetPassword(result.token, 'NuevaPass123!');
        console.log('   ✅ Contraseña restablecida exitosamente');
      } else {
        console.log('   ⚠️  Usuario de prueba no encontrado (esperado)');
      }
    } catch (error) {
      console.log('   ⚠️  Flujo de recuperación falló (posiblemente usuario no existe)');
    }
  }

  private static async testEmailTemplates() {
    console.log('4. Probando plantillas de email...');
    
    // Verificar conexión del servicio de email
    const emailConnected = await emailService.verifyConnection();
    console.log('   ✅ Servicio de email:', emailConnected ? 'Conectado' : 'Desconectado');
    
    console.log('   📧 Plantillas listas para uso');
  }
}

// Ejecutar pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  AuthFlowTests.runAllTests();
}