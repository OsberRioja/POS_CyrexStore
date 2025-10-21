import { Request, Response } from 'express';
import { ExchangeRateService } from '../services/exchangeRate.service';
import type { UpdateManualRateDTO, ToggleManualRateDTO, ConvertDTO } from '../dtos/exchangeRate.dto';

export const ExchangeRateController = {
  /**
   * Listar todas las tasas
   */
  async list(req: Request, res: Response) {
    try {
      const rates = await ExchangeRateService.listAll();
      return res.json(rates);
    } catch (err: any) {
      console.error('GET /exchange-rates:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  },

  /**
   * Obtener tasa específica
   */
  async getRate(req: Request, res: Response) {
    try {
      const { from, to } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ error: 'from y to son requeridos' });
      }

      const rate = await ExchangeRateService.getRate(
        String(from), 
        String(to)
      );
      
      return res.json({ 
        from, 
        to, 
        rate,
        timestamp: new Date()
      });
    } catch (err: any) {
      console.error('GET /exchange-rates/rate:', err);
      return res.status(err?.status || 500).json({ 
        error: err?.message || 'Error interno' 
      });
    }
  },

  /**
   * Convertir monto
   */
  async convert(req: Request, res: Response) {
    try {
      const { amount, fromCurrency, toCurrency } = req.body as ConvertDTO;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({ 
          error: 'amount, fromCurrency y toCurrency son requeridos' 
        });
      }

      const converted = await ExchangeRateService.convert(
        amount, 
        fromCurrency, 
        toCurrency
      );
      
      return res.json({ 
        original: amount,
        fromCurrency,
        toCurrency,
        converted,
        timestamp: new Date()
      });
    } catch (err: any) {
      console.error('POST /exchange-rates/convert:', err);
      return res.status(err?.status || 500).json({ 
        error: err?.message || 'Error interno' 
      });
    }
  },

  /**
   * Actualizar desde API
   */
  async updateFromAPI(req: Request, res: Response) {
    try {
      const result = await ExchangeRateService.updateFromAPI();
      return res.json(result);
    } catch (err: any) {
      console.error('POST /exchange-rates/update-api:', err);
      return res.status(err?.status || 500).json({ 
        error: err?.message || 'Error interno' 
      });
    }
  },

  /**
   * Actualizar tasa manual
   */
  async updateManual(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { fromCurrency, toCurrency, rate, notes } = req.body as UpdateManualRateDTO;
      
      if (!fromCurrency || !toCurrency || !rate) {
        return res.status(400).json({ 
          error: 'fromCurrency, toCurrency y rate son requeridos' 
        });
      }

      const updated = await ExchangeRateService.updateManualRate(
        fromCurrency,
        toCurrency,
        rate,
        userId,
        notes
      );
      
      return res.json(updated);
    } catch (err: any) {
      console.error('POST /exchange-rates/manual:', err);
      return res.status(err?.status || 500).json({ 
        error: err?.message || 'Error interno' 
      });
    }
  },

  /**
   * Alternar tasa manual/automática
   */
  async toggleManual(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency, useManual } = req.body as ToggleManualRateDTO;
      
      if (!fromCurrency || !toCurrency || useManual === undefined) {
        return res.status(400).json({ 
          error: 'fromCurrency, toCurrency y useManual son requeridos' 
        });
      }

      const updated = await ExchangeRateService.toggleManualRate(
        fromCurrency,
        toCurrency,
        useManual
      );
      
      return res.json(updated);
    } catch (err: any) {
      console.error('POST /exchange-rates/toggle:', err);
      return res.status(err?.status || 500).json({ 
        error: err?.message || 'Error interno' 
      });
    }
  }
};