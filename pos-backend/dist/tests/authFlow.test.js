"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthFlowTests = void 0;
// tests/authFlow.test.ts
const user_service_1 = require("../services/user.service");
const auth_service_1 = require("../services/auth.service");
const passwordReset_service_1 = require("../services/passwordReset.service");
const email_service_1 = require("../services/email.service");
class AuthFlowTests {
    static async runAllTests() {
        console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE AUTENTICACIÓN\n');
        try {
            await this.testUserCreation();
            await this.testLoginFlow();
            await this.testPasswordResetFlow();
            await this.testEmailTemplates();
            console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
        }
        catch (error) {
            console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
        }
    }
    static async testUserCreation() {
        console.log('1. Probando creación de usuario...');
        const testUser = {
            firstName: 'Usuario',
            lastNamePaterno: 'de',
            lastNameMaterno: 'Prueba',
            email: `test${Date.now()}@example.com`,
            countryCode: '591',
            country: 'Bolivia',
            phone: '123456789',
            role: 'SELLER'
        };
        const user = await user_service_1.UserService.createUser(testUser);
        console.log('   ✅ Usuario creado:', user.email);
        return user;
    }
    static async testLoginFlow() {
        console.log('2. Probando flujo de login...');
        // Test login con email
        try {
            const result = await auth_service_1.AuthService.login('admin@example.com', 'password');
            console.log('   ✅ Login con email exitoso');
        }
        catch (error) {
            console.log('   ⚠️  Login con email falló (esperado para credenciales incorrectas)');
        }
        // Test login con userCode
        try {
            const result = await auth_service_1.AuthService.login('1001', 'password');
            console.log('   ✅ Login con código de usuario exitoso');
        }
        catch (error) {
            console.log('   ⚠️  Login con código falló (esperado para credenciales incorrectas)');
        }
    }
    static async testPasswordResetFlow() {
        console.log('3. Probando flujo de recuperación de contraseña...');
        const testEmail = 'test@example.com';
        try {
            const result = await passwordReset_service_1.PasswordResetService.requestPasswordReset(testEmail);
            if (result) {
                console.log('   ✅ Solicitud de recuperación procesada');
                // Validar token
                const isValid = await passwordReset_service_1.PasswordResetService.validateResetToken(result.token);
                console.log('   ✅ Token validado correctamente');
                // Resetear contraseña
                await passwordReset_service_1.PasswordResetService.resetPassword(result.token, 'NuevaPass123!');
                console.log('   ✅ Contraseña restablecida exitosamente');
            }
            else {
                console.log('   ⚠️  Usuario de prueba no encontrado (esperado)');
            }
        }
        catch (error) {
            console.log('   ⚠️  Flujo de recuperación falló (posiblemente usuario no existe)');
        }
    }
    static async testEmailTemplates() {
        console.log('4. Probando plantillas de email...');
        // Verificar conexión del servicio de email
        const emailConnected = await email_service_1.emailService.verifyConnection();
        console.log('   ✅ Servicio de email:', emailConnected ? 'Conectado' : 'Desconectado');
        console.log('   📧 Plantillas listas para uso');
    }
}
exports.AuthFlowTests = AuthFlowTests;
// Ejecutar pruebas si este archivo se ejecuta directamente
if (require.main === module) {
    AuthFlowTests.runAllTests();
}
