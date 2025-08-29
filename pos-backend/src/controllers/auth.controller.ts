    import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email y contraseña son requeridos" 
        });
      }

      const result = await AuthService.login(email, password);
      return res.json({
        message: "Login exitoso",
        ...result
      });
    } catch (err: any) {
      const status = err?.status || 500;
      return res.status(status).json({ 
        message: err?.message || "Error interno del servidor" 
      });
    }
  },

  // NO necesitas register aquí - ya tienes UserController.create() funcionando

  async verifyToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token es requerido" });
      }

      const decoded = AuthService.verifyToken(token);
      return res.json({ 
        valid: true, 
        decoded 
      });
    } catch (err) {
      return res.status(401).json({ 
        valid: false, 
        message: "Token inválido" 
      });
    }
  }
};