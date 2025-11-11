export interface OpenCashBoxDTO {
  openedBy: string; // user id
  initialAmount: number;
}

export interface CloseCashBoxDTO {
  realClosedAmount: number; // ← Monto real contado
  observations?: string;    // ← Observaciones del cierre
  cashCount?: any;             // ← Opcional: Desglose de billetes/monedas
}
export interface ClosePreviewResponse {
  box: {
    id: number;
    openedAt: Date;
    initialAmount: number;
    openedByUser: {
      name: string;
      userCode: number;
    };
  };
  report: {
    initialAmount: number;
    totalCashSales: number;
    totalCashExpenses: number;
    expectedClosedAmount: number;
    totalCardSales: number; // ← NUEVO: Para contexto completo
    totalOtherSales: number; // ← NUEVO: Para contexto completo
  };
}

export interface CloseCashBoxResponse {
  box: any; // El objeto CashBox actualizado
  report: {
    initialAmount: number;
    totalCashSales: number;
    totalCashExpenses: number;
    expectedAmount: number;
    realClosedAmount: number;
    difference: number;
    observations?: string;
    status: 'exact' | 'surplus' | 'shortage';
    statusText: string;
    cashCount?: any;
  };
}