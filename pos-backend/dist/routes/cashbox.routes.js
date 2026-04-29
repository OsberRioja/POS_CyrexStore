"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cashbox.routes.ts
const express_1 = require("express");
const cashbox_controller_1 = require("../controllers/cashbox.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permissions_1 = require("../types/permissions");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_READ_ALL), cashbox_controller_1.CashBoxController.list);
router.post("/open", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_OPEN_CLOSE), cashbox_controller_1.CashBoxController.open);
router.get("/open", auth_middleware_1.authMiddleware, cashbox_controller_1.CashBoxController.getOpen);
router.get("/:id/close-preview", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_READ), cashbox_controller_1.CashBoxController.getClosePreview);
router.post("/:id/close", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_OPEN_CLOSE), cashbox_controller_1.CashBoxController.close);
router.get("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_READ), cashbox_controller_1.CashBoxController.getById);
router.post('/:id/reopen', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_OPEN_CLOSE), cashbox_controller_1.CashBoxController.reopen);
router.post('/:id/close-reopened', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.Permission.CASHBOX_OPEN_CLOSE), cashbox_controller_1.CashBoxController.closeReopened);
exports.default = router;
