import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../env";
import { getPermissionsForRole, Permission } from "../types/permissions";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        permissions?: Permission[];
        branchId?: number | null;
      };
      userId?: string;
    }
  }
}

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
    req.user = {
      ...decoded,
      permissions: getPermissionsForRole(decoded.role),
      branchId: decoded.branchId 
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Middleware para verificar permisos específicos
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: "No tienes permisos para esta acción" 
      });
    }

    next();
  };
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

// Middleware para verificar acceso a sucursal
export const requireBranchAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const userRole = (req.user as JwtPayload).role;
  const userBranchId = req.user.branchId;

  // Administradores globales (branchId = null) pueden acceder a todo
  if (userRole === 'ADMIN' && userBranchId === null) {
    return next();
  }

  // Para otros roles, deben tener un branchId asignado
  if (!userBranchId) {
    return res.status(403).json({ 
      message: 'Usuario no asignado a ninguna sucursal' 
    });
  }

  next();
};

// NUEVO: Middleware para extraer/validar branchId de parámetros o body
export const withBranchContext = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const userBranchId = req.user.branchId;
  const userRole = (req.user as JwtPayload).role;

  // Si es administrador global, puede especificar branchId en query/body
  if (userRole === 'ADMIN' && userBranchId === null) {
    // Permitir override de branchId para admins
    const branchIdFromQuery = req.query.branchId ? Number(req.query.branchId) : undefined;
    const branchIdFromBody = req.body.branchId ? Number(req.body.branchId) : undefined;
    
    if (branchIdFromQuery || branchIdFromBody) {
      req.user.branchId = branchIdFromQuery || branchIdFromBody;
    }
    // Si no se especifica, el admin opera en "modo global"
  }

  next();
};