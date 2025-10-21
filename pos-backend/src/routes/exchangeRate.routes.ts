import { Router } from 'express';
import { ExchangeRateController } from '../controllers/exchangeRate.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (requieren autenticación pero cualquier usuario)
router.get('/', authMiddleware, ExchangeRateController.list);
router.get('/rate', authMiddleware, ExchangeRateController.getRate);
router.post('/convert', authMiddleware, ExchangeRateController.convert);

// Rutas administrativas (solo ADMIN puede modificar tasas)
router.post('/update-api', authMiddleware, requireAdmin, ExchangeRateController.updateFromAPI);
router.post('/manual', authMiddleware, requireAdmin, ExchangeRateController.updateManual);
router.post('/toggle', authMiddleware, requireAdmin, ExchangeRateController.toggleManual);

// Middleware para verificar que sea admin
function requireAdmin(req: any, res: any, next: any) {
  const user = req.user;
  
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Solo administradores pueden modificar tasas de cambio' 
    });
  }
  
  next();
}

export default router;