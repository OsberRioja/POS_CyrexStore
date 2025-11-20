import { CommissionRepository } from "../repositories/commission.repository";

export const CommissionCalculationService = {
  /**
   * Calcular la comisión para una venta basada en la configuración activa
   */
  async calculateCommission(saleTotal: number): Promise<number> {
    const activeConfig = await CommissionRepository.findActive();
    
    // Si no hay configuración activa, retornar 0
    if (!activeConfig || !activeConfig.isActive) {
      return 0;
    }

    let commission = 0;

    switch (activeConfig.type) {
      case 'FIXED_AMOUNT':
        commission = activeConfig.fixedAmount || 0;
        break;

      case 'PERCENTAGE':
        commission = saleTotal * (activeConfig.percentage || 0) / 100;
        break;

      case 'TIERED_RANGES':
        // Buscar el rango que corresponda al total de la venta
        const applicableRange = activeConfig.ranges.find(range => {
          const meetsMin = saleTotal >= range.minAmount;
          const meetsMax = range.maxAmount ? saleTotal <= range.maxAmount : true;
          return meetsMin && meetsMax;
        });

        if (applicableRange) {
          if (applicableRange.commissionType === 'FIXED') {
            commission = applicableRange.commissionValue;
          } else {
            commission = saleTotal * applicableRange.commissionValue / 100;
          }
        }
        break;

      default:
        commission = 0;
    }

    return Number(commission.toFixed(2));
  },

  /**
   * Calcular comisión basada en el sistema actual (0-100: 5bs, 101-400: 10bs, 401+: 20bs)
   * Esta función es para mantener compatibilidad mientras se migra al nuevo sistema
   */
  calculateLegacyCommission(saleTotal: number): number {
    if (saleTotal <= 100) return 5;
    if (saleTotal <= 400) return 10;
    return 20;
  }
};