import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { emailService } from '../services/email.service';
import { env } from '../env';

const router = Router();

// POST /api/auth/login - ESTO es lo único que necesitas
router.post("/login", AuthController.login);

// POST /api/auth/verify-token (para validar tokens)
router.post("/verify-token", AuthController.verifyToken);

// NO necesitas /register aquí - ya tienes /api/users (POST) funcionando

// Endpoint temporal para probar el email de invitación
router.post('/test-invitation-email', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const invitationData = {
      userName: name || 'Usuario de Prueba',
      userEmail: email || 'test@example.com',
      temporaryPassword: password || 'temp123456',
      loginUrl: env.frontendUrl,
      companyName: env.email.fromName || 'Nombre de la Empresa',
      adminName: 'Administrador del Sistema',
    };

    const success = await emailService.sendInvitationEmail(invitationData);
    
    if (success) {
      res.json({ 
        message: 'Email de invitación enviado correctamente',
        data: invitationData 
      });
    } else {
      res.status(500).json({ message: 'Error al enviar el email de invitación' });
    }
  } catch (error) {
    console.error('Error en test-invitation-email:', error);
    res.status(500).json({ message: 'Error interno del servidor', error });
  }
});
export default router;