import { Request, Response, NextFunction } from "express";

export const requireManagerForReturns = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
    return res.status(403).json({ 
      error: 'Solo administradores y supervisores pueden procesar devoluciones' 
    });
  }
  
  next();
};