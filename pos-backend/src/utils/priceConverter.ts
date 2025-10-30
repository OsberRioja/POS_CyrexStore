import { ExchangeRateService } from '../services/exchangeRate.service';

export interface ProductPrice {
  originalPrice: number;
  originalCurrency: string;
  displayPrice: number;
  displayCurrency: string;
  exchangeRate?: number;
}

export class PriceConverter {
  /**
   * Convierte el precio de un producto a la moneda deseada
   */
  static async convertProductPrice(
    product: {
      salePrice: number;
      priceCurrency: string;
    },
    toCurrency: string
  ): Promise<ProductPrice> {
    const originalPrice = product.salePrice;
    const originalCurrency = product.priceCurrency;

    // Si la moneda es la misma, no convertir
    if (originalCurrency === toCurrency) {
      return {
        originalPrice,
        originalCurrency,
        displayPrice: originalPrice,
        displayCurrency: toCurrency
      };
    }

    // Convertir usando el servicio de tasas
    const rate = await ExchangeRateService.getRate(originalCurrency, toCurrency);
    const displayPrice = originalPrice * rate;

    return {
      originalPrice,
      originalCurrency,
      displayPrice,
      displayCurrency: toCurrency,
      exchangeRate: rate
    };
  }

  /**
   * Convierte múltiples productos
   */
  static async convertProductPrices(
    products: Array<{ salePrice: number; priceCurrency: string }>,
    toCurrency: string
  ): Promise<ProductPrice[]> {
    return Promise.all(
      products.map(product => this.convertProductPrice(product, toCurrency))
    );
  }
}