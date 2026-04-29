"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateController = void 0;
const exchangeRate_service_1 = require("../services/exchangeRate.service");
exports.ExchangeRateController = {
    /**
     * Listar todas las tasas
     */
    async list(req, res) {
        try {
            const rates = await exchangeRate_service_1.ExchangeRateService.listAll();
            return res.json(rates);
        }
        catch (err) {
            console.error('GET /exchange-rates:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    /**
     * Obtener tasa específica
     */
    async getRate(req, res) {
        try {
            const { from, to } = req.query;
            if (!from || !to) {
                return res.status(400).json({ error: 'from y to son requeridos' });
            }
            const rate = await exchangeRate_service_1.ExchangeRateService.getRate(String(from), String(to));
            return res.json({
                from,
                to,
                rate,
                timestamp: new Date()
            });
        }
        catch (err) {
            console.error('GET /exchange-rates/rate:', err);
            return res.status(err?.status || 500).json({
                error: err?.message || 'Error interno'
            });
        }
    },
    /**
     * Convertir monto
     */
    async convert(req, res) {
        try {
            const { amount, fromCurrency, toCurrency } = req.body;
            if (!amount || !fromCurrency || !toCurrency) {
                return res.status(400).json({
                    error: 'amount, fromCurrency y toCurrency son requeridos'
                });
            }
            const converted = await exchangeRate_service_1.ExchangeRateService.convert(amount, fromCurrency, toCurrency);
            return res.json({
                original: amount,
                fromCurrency,
                toCurrency,
                converted,
                timestamp: new Date()
            });
        }
        catch (err) {
            console.error('POST /exchange-rates/convert:', err);
            return res.status(err?.status || 500).json({
                error: err?.message || 'Error interno'
            });
        }
    },
    /**
     * Actualizar desde API
     */
    async updateFromAPI(req, res) {
        try {
            const result = await exchangeRate_service_1.ExchangeRateService.updateFromAPI();
            return res.json(result);
        }
        catch (err) {
            console.error('POST /exchange-rates/update-api:', err);
            return res.status(err?.status || 500).json({
                error: err?.message || 'Error interno'
            });
        }
    },
    /**
     * Actualizar tasa manual
     */
    async updateManual(req, res) {
        try {
            const userId = req.userId;
            const { fromCurrency, toCurrency, rate, notes } = req.body;
            if (!fromCurrency || !toCurrency || !rate) {
                return res.status(400).json({
                    error: 'fromCurrency, toCurrency y rate son requeridos'
                });
            }
            const updated = await exchangeRate_service_1.ExchangeRateService.updateManualRate(fromCurrency, toCurrency, rate, userId, notes);
            return res.json(updated);
        }
        catch (err) {
            console.error('POST /exchange-rates/manual:', err);
            return res.status(err?.status || 500).json({
                error: err?.message || 'Error interno'
            });
        }
    },
    /**
     * Alternar tasa manual/automática
     */
    async toggleManual(req, res) {
        try {
            const { fromCurrency, toCurrency, useManual } = req.body;
            if (!fromCurrency || !toCurrency || useManual === undefined) {
                return res.status(400).json({
                    error: 'fromCurrency, toCurrency y useManual son requeridos'
                });
            }
            const updated = await exchangeRate_service_1.ExchangeRateService.toggleManualRate(fromCurrency, toCurrency, useManual);
            return res.json(updated);
        }
        catch (err) {
            console.error('POST /exchange-rates/toggle:', err);
            return res.status(err?.status || 500).json({
                error: err?.message || 'Error interno'
            });
        }
    }
};
