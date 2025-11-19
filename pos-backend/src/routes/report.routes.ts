import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/sales/:cashBoxId', reportController.downloadSalesReport);
router.get('/expenses/:cashBoxId', reportController.downloadExpensesReport);
router.get('/payment-methods/:cashBoxId', reportController.downloadPaymentMethodsReport);
router.get('/daily/:cashBoxId', reportController.downloadDailyReport);

export default router;