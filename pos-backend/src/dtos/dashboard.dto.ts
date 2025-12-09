// Dashboard por sucursal
export interface BranchDashboardDTO {
  date: string;
  branchId: number;
  branchName: string;
  
  // Métricas principales
  salesToday: {
    count: number;
    amount: number;
  };
  
  earningsToday: {
    grossEarnings: number; // Ganancia bruta (ventas - costo)
    netEarnings?: number;  // Ganancia neta (después de gastos)
  };
  
  averageTicket: number;
  
  // Estado de caja
  cashBoxStatus: {
    isOpen: boolean;
    currentAmount?: number;
    openedAt?: Date;
    openedBy?: string;
  };
  
  // Rankings
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
  }>;
  
  topSellers: Array<{
    userId: string;
    userName: string;
    salesCount: number;
    amount: number;
  }>;
  
  // Alertas
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minThreshold: number;
  }>;
  
  // Últimas ventas
  recentSales: Array<{
    saleId: string;
    clientName?: string;
    total: number;
    createdAt: Date;
  }>;
  
  // Resumen del día
  summary: {
    totalClients: number;
    totalProducts: number;
    totalUsers: number;
  };
}

// Dashboard general (admin)
export interface GeneralDashboardDTO {
  date: string;
  
  // Resumen global
  globalSummary: {
    totalBranches: number;
    activeBranches: number;
    totalSalesToday: number;
    totalAmountToday: number;
    activeUsersToday: number;
  };
  
  // Ranking de sucursales
  branchRanking: Array<{
    branchId: number;
    branchName: string;
    salesCount: number;
    totalAmount: number;
    averageTicket: number;
  }>;
  
  // Productos más vendidos globalmente
  globalTopProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalAmount: number;
    branches: string[]; // Sucursales donde se vendió
  }>;
  
  // Evolución de ventas
  salesEvolution: Array<{
    date: string;
    totalAmount: number;
    salesCount: number;
  }>;
  
  // Sucursales con alertas
  branchesWithAlerts: Array<{
    branchId: number;
    branchName: string;
    alerts: string[];
  }>;
}