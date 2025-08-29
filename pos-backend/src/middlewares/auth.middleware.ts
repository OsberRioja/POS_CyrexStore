import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../env"; // Usar el env validado

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token malformado" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Guardar información del usuario en el request
    req.userId = decoded.sub ?? decoded.id ?? decoded.userId as string;
    req.user = decoded;
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Middleware opcional para verificar roles específicos
export const requireRole = (...roles: ("ADMIN" | "SUPERVISOR" | "SELLER")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const userRole = (req.user as JwtPayload).role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: "No tienes permisos para esta acción" 
      });
    }

    next();
  };
};