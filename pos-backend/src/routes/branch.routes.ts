import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { authMiddleware, requirePermission, requireRole } from '../middlewares/auth.middleware';
import { Permission } from '../types/permissions';

const router = Router();
const branchController = new BranchController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo administradores pueden gestionar sucursales
router.get('/', requirePermission(Permission.BRANCH_READ), branchController.getAllBranches);
router.get('/:id', requirePermission(Permission.BRANCH_READ), branchController.getBranchById);
router.post('/', requireRole('ADMIN'), branchController.createBranch);
router.put('/:id', requireRole('ADMIN'), branchController.updateBranch);
router.delete('/:id', requireRole('ADMIN'), branchController.deleteBranch);

export default router;