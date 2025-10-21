import { Request, Response } from 'express';
import { UserPreferenceRepository } from '../repositories/userPreference.repository';

export const UserPreferenceController = {
  /**
   * Obtener preferencias del usuario actual
   */
  async getMyPreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      let preference = await UserPreferenceRepository.findByUserId(userId);
      
      // Si no existe, crear con valores por defecto
      if (!preference) {
        preference = await UserPreferenceRepository.upsert(userId, 'BOB');
      }
      
      return res.json(preference);
    } catch (err: any) {
      console.error('GET /user-preferences:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  /**
   * Actualizar moneda preferida
   */
  async updateCurrency(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
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

      const updated = await UserPreferenceRepository.upsert(
        userId, 
        currency.toUpperCase()
      );
      
      return res.json(updated);
    } catch (err: any) {
      console.error('PUT /user-preferences/currency:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
};