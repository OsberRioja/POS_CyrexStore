"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_controller_1 = require("../controllers/branch.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permissions_1 = require("../types/permissions");
const router = (0, express_1.Router)();
const branchController = new branch_controller_1.BranchController();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authMiddleware);
// Solo administradores pueden gestionar sucursales
router.get('/', (0, auth_middleware_1.requirePermission)(permissions_1.Permission.BRANCH_READ), branchController.getAllBranches);
router.get('/:id', (0, auth_middleware_1.requirePermission)(permissions_1.Permission.BRANCH_READ), branchController.getBranchById);
router.post('/', (0, auth_middleware_1.requireRole)('ADMIN'), branchController.createBranch);
router.put('/:id', (0, auth_middleware_1.requireRole)('ADMIN'), branchController.updateBranch);
router.delete('/:id', (0, auth_middleware_1.requireRole)('ADMIN'), branchController.deleteBranch);
exports.default = router;
