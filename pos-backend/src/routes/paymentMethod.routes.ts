// src/routes/paymentMethod.routes.ts
import { Router } from "express";
import { PaymentMethodController } from "../controllers/paymentMethod.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// lectura pública/privada: aquí decidí proteger solo rutas de escritura.
// Si quieres proteger GET también, añade authMiddleware.
router.get("/", PaymentMethodController.list);
router.get("/:id", PaymentMethodController.getById);

// Mutaciones requieren autenticación
router.post("/", authMiddleware, PaymentMethodController.create);
router.put("/:id", authMiddleware, PaymentMethodController.update);
router.delete("/:id", authMiddleware, PaymentMethodController.remove);

// endpoint opcional para forzar creación de defaults (solo dev)
router.post("/__init_defaults", authMiddleware, PaymentMethodController.initDefaults);

export default router;
