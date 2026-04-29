"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const return_controller_1 = require("../controllers/return.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación y ser ADMIN o SUPERVISOR
router.use(auth_middleware_1.authMiddleware);
router.use(role_middleware_1.requireManagerForReturns);
router.post("/", return_controller_1.create);
router.get("/", return_controller_1.list);
router.get("/:id", return_controller_1.getById);
router.post("/:id/approve", return_controller_1.approve);
exports.default = router;
