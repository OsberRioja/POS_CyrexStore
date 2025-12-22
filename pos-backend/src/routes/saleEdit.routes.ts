import express from 'express';
import { SaleEditController } from '../controllers/saleEdit.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.put('/:id', authMiddleware, SaleEditController.update);

export default router;