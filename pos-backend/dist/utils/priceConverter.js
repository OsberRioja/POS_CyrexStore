"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceConverter = void 0;
const exchangeRate_service_1 = require("../services/exchangeRate.service");
class PriceConverter {
    /**
     * Convierte el precio de un producto a la moneda deseada
     */
    static async convertProductPrice(product, toCurrency) {
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
        const rate = await exchangeRate_service_1.ExchangeRateService.getRate(originalCurrency, toCurrency);
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
    static async convertProductPrices(products, toCurrency) {
        return Promise.all(products.map(product => this.convertProductPrice(product, toCurrency)));
    }
}
exports.PriceConverter = PriceConverter;
