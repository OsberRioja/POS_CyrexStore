import express from 'express';
import { ExpenseEditController } from '../controllers/expenseEdit.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.put('/:id', authMiddleware, ExpenseEditController.update);

export default router;