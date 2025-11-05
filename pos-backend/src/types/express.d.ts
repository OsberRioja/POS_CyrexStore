// src/types/express.d.ts
import { Permission } from './permissions';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: string;
        email: string;
        name: string;
        userCode: number;
        permissions?: Permission[];
      };
      userId?: string;
    }
  }
}

export {};