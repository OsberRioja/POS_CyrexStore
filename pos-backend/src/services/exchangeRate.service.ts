import axios from 'axios';
import { prisma } from '../prismaClient';

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export const ExchangeRateService = {
  /**
   * Obtener tasa de cambio entre dos monedas
   */
  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    // Normalizar códigos de moneda
    from = from.toUpperCase();
    to = to.toUpperCase();

    // Buscar en BD
    const rate = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: { 
          fromCurrency: from, 
          toCurrency: to 
        }
      }
    });

    if (rate) {
      // Si hay tasa manual y está habilitada, usarla
      if (rate.useManual && rate.manualRate) {
        return rate.manualRate;
      }
      // Si no, usar la tasa normal (que puede venir de API)
      return rate.rate;
    }

    // Si no existe en BD, intentar obtener de la API
    try {
      return await this.fetchFromAPI(from, to);
    } catch (error) {
      console.error(`Error getting rate ${from} -> ${to}:`, error);
      throw { status: 500, message: `No se pudo obtener la tasa de cambio ${from} -> ${to}` };
    }
  },

  /**
   * Actualizar tasas desde la API
   */
  async updateFromAPI() {
    try {
      console.log('Fetching exchange rates from API...');
      const response = await axios.get(API_URL);
      const rates = response.data.rates;

      // Lista de monedas que nos interesan
      const currencies = ['BOB', 'CNY', 'EUR']; // Agrega más si necesitas

      // Actualizar USD -> cada moneda
      for (const currency of currencies) {
        if (rates[currency]) {
          await prisma.exchangeRate.upsert({
            where: {
              fromCurrency_toCurrency: { 
                fromCurrency: 'USD', 
                toCurrency: currency 
              }
            },
            update: {
              apiRate: rates[currency],
              rate: rates[currency],
              source: 'API',
              lastUpdated: new Date()
            },
            create: {
              fromCurrency: 'USD',
              toCurrency: currency,
              rate: rates[currency],
              apiRate: rates[currency],
              source: 'API'
            }
          });
        }
      }

      // Crear tasas inversas (BOB -> USD, CNY -> USD, etc.)
      for (const currency of currencies) {
        if (rates[currency]) {
          const inverseRate = 1 / rates[currency];
          await prisma.exchangeRate.upsert({
            where: {
              fromCurrency_toCurrency: { 
                fromCurrency: currency, 
                toCurrency: 'USD' 
              }
            },
            update: {
              apiRate: inverseRate,
              rate: inverseRate,
              source: 'API',
              lastUpdated: new Date()
            },
            create: {
              fromCurrency: currency,
              toCurrency: 'USD',
              rate: inverseRate,
              apiRate: inverseRate,
              source: 'API'
            }
          });
        }
      }

      console.log('✅ Exchange rates updated successfully');
      return { success: true, rates };
    } catch (error) {
      console.error('❌ Error updating exchange rates:', error);
      throw { status: 500, message: 'Error al actualizar tasas de cambio' };
    }
  },

  /**
   * Actualizar manualmente (para tasa paralelo)
   */
  async updateManualRate(
    from: string, 
    to: string, 
    rate: number, 
    userId: string,
    notes?: string
  ) {
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (rate <= 0) {
      throw { status: 400, message: 'La tasa debe ser mayor a 0' };
    }

    return prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to }
      },
      update: {
        manualRate: rate,
        rate: rate,
        useManual: true,
        source: 'MANUAL',
        lastUpdated: new Date(),
        updatedBy: userId,
        notes: notes || `Actualización manual de ${from} a ${to}`
      },
      create: {
        fromCurrency: from,
        toCurrency: to,
        rate: rate,
        manualRate: rate,
        useManual: true,
        source: 'MANUAL',
        updatedBy: userId,
        notes: notes || `Tasa manual ${from} a ${to}`
      }
    });
  },

  /**
   * Alternar entre tasa manual y automática
   */
  async toggleManualRate(from: string, to: string, useManual: boolean) {
    from = from.toUpperCase();
    to = to.toUpperCase();

    const rate = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to }
      }
    });

    if (!rate) {
      throw { status: 404, message: 'Tasa de cambio no encontrada' };
    }

    if (useManual && !rate.manualRate) {
      throw { status: 400, message: 'No hay tasa manual configurada' };
    }

    return prisma.exchangeRate.update({
      where: {
        fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to }
      },
      data: {
        useManual,
        rate: useManual ? rate.manualRate! : rate.apiRate!,
        lastUpdated: new Date()
      }
    });
  },

  /**
   * Convertir monto
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getRate(from, to);
    return amount * rate;
  },

  /**
   * Listar todas las tasas
   */
  async listAll() {
    return prisma.exchangeRate.findMany({
      orderBy: [
        { fromCurrency: 'asc' },
        { toCurrency: 'asc' }
      ]
    });
  },

  /**
   * Obtener de API directamente
   */
  async fetchFromAPI(from: string, to: string): Promise<number> {
    const response = await axios.get(API_URL);
    const rates = response.data.rates;
    
    if (from === 'USD') {
      if (!rates[to]) {
        throw new Error(`Moneda ${to} no soportada`);
      }
      return rates[to];
    }
    
    if (!rates[from] || !rates[to]) {
      throw new Error(`Monedas ${from} o ${to} no soportadas`);
    }
    
    // Conversión indirecta: from -> USD -> to
    const fromToUsd = 1 / rates[from];
    const usdToTarget = rates[to];
    return fromToUsd * usdToTarget;
  }
};