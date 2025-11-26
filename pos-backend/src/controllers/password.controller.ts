import { Request, Response } from "express";
import { PasswordService } from "../services/password.service";

export const PasswordController = {
  async changePassword(req: Request, res: Response) {
    try {
      const { newPassword } = req.body;
      const userId = (req as any).user?.sub; // Asumiendo que el middleware de autenticación agrega el usuario

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!newPassword) {
        return res.status(400).json({ message: "La nueva contraseña es requerida" });
      }

      const result = await PasswordService.changePassword(userId, newPassword);
      return res.json({ message: "Contraseña cambiada exitosamente", ...result });
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ 
        message: err?.message || "Error interno del servidor" 
      });
    }
  },
};