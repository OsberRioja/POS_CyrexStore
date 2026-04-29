"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exchangeRate_controller_1 = require("../controllers/exchangeRate.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rutas públicas (requieren autenticación pero cualquier usuario)
router.get('/', auth_middleware_1.authMiddleware, exchangeRate_controller_1.ExchangeRateController.list);
router.get('/rate', auth_middleware_1.authMiddleware, exchangeRate_controller_1.ExchangeRateController.getRate);
router.post('/convert', auth_middleware_1.authMiddleware, exchangeRate_controller_1.ExchangeRateController.convert);
// Rutas administrativas (solo ADMIN puede modificar tasas)
router.post('/update-api', auth_middleware_1.authMiddleware, requireAdmin, exchangeRate_controller_1.ExchangeRateController.updateFromAPI);
router.post('/manual', auth_middleware_1.authMiddleware, requireAdmin, exchangeRate_controller_1.ExchangeRateController.updateManual);
router.post('/toggle', auth_middleware_1.authMiddleware, requireAdmin, exchangeRate_controller_1.ExchangeRateController.toggleManual);
// Middleware para verificar que sea admin
function requireAdmin(req, res, next) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
        return res.status(403).json({
            error: 'Solo administradores pueden modificar tasas de cambio'
        });
    }
    next();
}
exports.default = router;
