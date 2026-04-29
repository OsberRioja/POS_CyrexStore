"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreferenceController = void 0;
const userPreference_repository_1 = require("../repositories/userPreference.repository");
exports.UserPreferenceController = {
    /**
     * Obtener preferencias del usuario actual
     */
    async getMyPreferences(req, res) {
        try {
            const userId = req.userId;
            let preference = await userPreference_repository_1.UserPreferenceRepository.findByUserId(userId);
            // Si no existe, crear con valores por defecto
            if (!preference) {
                preference = await userPreference_repository_1.UserPreferenceRepository.upsert(userId, 'BOB');
            }
            return res.json(preference);
        }
        catch (err) {
            console.error('GET /user-preferences:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    },
    /**
     * Actualizar moneda preferida
     */
    async updateCurrency(req, res) {
        try {
            const userId = req.userId;
            const { currency } = req.body;
            if (!currency) {
                return res.status(400).json({ error: 'currency es requerido' });
            }
            // Validar que sea una moneda válida
            const validCurrencies = ['BOB', 'USD', 'CNY'];
            if (!validCurrencies.includes(currency.toUpperCase())) {
                return res.status(400).json({
                    error: `Moneda inválida. Debe ser una de: ${validCurrencies.join(', ')}`
                });
            }
            const updated = await userPreference_repository_1.UserPreferenceRepository.upsert(userId, currency.toUpperCase());
            return res.json(updated);
        }
        catch (err) {
            console.error('PUT /user-preferences/currency:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    }
};
