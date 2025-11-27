import { Request, Response } from "express";
import { PasswordResetService } from "../services/passwordReset.service";
import { emailService } from "../services/email.service";
import { EmailTemplates } from "../templates/emailTemplates";
import { env } from "../env";

export const PasswordResetController = {
  async requestReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "El email es requerido" });
      }

      const result = await PasswordResetService.requestPasswordReset(email);

      // Si el usuario existe, enviar email
      if (result) {
        const emailSent = await emailService.sendEmail(
          result.user.email,
          "Restablecer tu contraseña - Sistema POS",
          EmailTemplates.generatePasswordResetEmail({
            userName: result.user.name,
            resetLink: result.resetLink,
            companyName: env.email.fromName ?? "CYREX STORE",
          })
        );

        if (emailSent) {
          console.log(`📧 Email de recuperación enviado a: ${result.user.email}`);
        }
      }

      // Por seguridad, siempre devolvemos el mismo mensaje
      res.json({
        message: "Si el email existe, se ha enviado un enlace para restablecer la contraseña",
      });
    } catch (error: any) {
      console.error("Error en requestReset:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async validateToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token es requerido" });
      }

      await PasswordResetService.validateResetToken(token);
      
      res.json({ valid: true, message: "Token válido" });
    } catch (error: any) {
      res.status(400).json({ valid: false, message: error.message });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ 
          message: "Token y nueva contraseña son requeridos" 
        });
      }

      const result = await PasswordResetService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Error interno del servidor";
      res.status(status).json({ message });
    }
  },
};