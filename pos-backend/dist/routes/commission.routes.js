"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commission_controller_1 = require("../controllers/commission.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authMiddleware);
// Solo ADMIN puede gestionar configuraciones de comisiones
router.get("/active", commission_controller_1.CommissionController.getActive);
router.get("/", commission_controller_1.CommissionController.getAll);
router.get("/:id", commission_controller_1.CommissionController.getById);
router.post("/", commission_controller_1.CommissionController.create);
router.put("/:id", commission_controller_1.CommissionController.update);
router.patch("/:id/activate", commission_controller_1.CommissionController.activate);
router.delete("/:id", commission_controller_1.CommissionController.delete);
exports.default = router;
