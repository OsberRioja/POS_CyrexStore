"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/paymentMethod.routes.ts
const express_1 = require("express");
const paymentMethod_controller_1 = require("../controllers/paymentMethod.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// lectura pública/privada: aquí decidí proteger solo rutas de escritura.
// Si quieres proteger GET también, añade authMiddleware.
router.get("/summary", auth_middleware_1.authMiddleware, paymentMethod_controller_1.PaymentMethodController.summaryByBox);
router.get("/", paymentMethod_controller_1.PaymentMethodController.list);
router.post("/", auth_middleware_1.authMiddleware, paymentMethod_controller_1.PaymentMethodController.create);
router.get("/:id", paymentMethod_controller_1.PaymentMethodController.getById);
// Mutaciones requieren autenticación
router.put("/:id", auth_middleware_1.authMiddleware, paymentMethod_controller_1.PaymentMethodController.update);
router.delete("/:id", auth_middleware_1.authMiddleware, paymentMethod_controller_1.PaymentMethodController.remove);
// endpoint opcional para forzar creación de defaults (solo dev)
router.post("/__init_defaults", auth_middleware_1.authMiddleware, paymentMethod_controller_1.PaymentMethodController.initDefaults);
exports.default = router;
