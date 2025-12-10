import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Reportes por caja (existentes)
router.get('/sales/:cashBoxId', reportController.downloadSalesReport);
router.get('/expenses/:cashBoxId', reportController.downloadExpensesReport);
router.get('/payment-methods/:cashBoxId', reportController.downloadPaymentMethodsReport);
router.get('/daily/:cashBoxId', reportController.downloadDailyReport);

// Nuevos endpoints para reportes por período
router.get('/monthly-sales/:year/:month', reportController.downloadMonthlySalesReport);
router.get('/period-sales', reportController.downloadPeriodSalesReport);
router.get('/period-expenses', reportController.downloadPeriodExpensesReport);
router.get('/combined-report', reportController.downloadCombinedReport);

export default router;