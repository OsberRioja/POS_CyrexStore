import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/login - ESTO es lo único que necesitas
router.post("/login", AuthController.login);

// POST /api/auth/verify-token (para validar tokens)
router.post("/verify-token", AuthController.verifyToken);

// NO necesitas /register aquí - ya tienes /api/users (POST) funcionando

export default router;