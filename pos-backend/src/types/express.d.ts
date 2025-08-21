import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // lo que añadimos desde el middleware
      user?: string | JwtPayload; // si quieres guardar todo el payload
    }
  }
}
