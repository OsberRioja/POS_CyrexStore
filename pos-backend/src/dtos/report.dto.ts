export interface PeriodReportFilters {
  startDate: Date;
  endDate: Date;
  branchId?: number;
  sellerId?: string;
  paymentMethodId?: number;
  reportType: 'sales' | 'expenses' | 'combined' | 'payment-methods';
}

export interface MonthlyReportFilters {
  year: number;
  month: number; // 1-12
  branchId?: number;
}

export interface SalesReportData {
  sales: Array<{
    id: string;
    date: Date;
    clientName?: string;
    sellerName: string;
    total: number;
    paidAmount: number;
    balance: number;
    paymentMethods: string[];
    itemsCount: number;
    totalQuantity: number;
  }>;
  summary: {
    totalSales: number;
    totalAmount: number;
    totalPaid: number;
    totalBalance: number;
    averageTicket: number;
    salesCount: number;
    itemsCount: number;
    totalQuantity: number;
  };
  byPaymentMethod: Array<{
    methodName: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
  }>;
  bySeller: Array<{
    sellerId: string;
    sellerName: string;
    salesCount: number;
    totalAmount: number;
    averageTicket: number;
  }>;
}