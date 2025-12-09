export interface BranchDashboardDTO {
  date: string;
  branchId: number;
  branchName: string;
  
  salesToday: {
    count: number;
    amount: number;
  };
  
  earningsToday: {
    grossEarnings: number;
    netEarnings?: number;
  };
  
  averageTicket: number;
  
  cashBoxStatus: {
    isOpen: boolean;
    currentAmount?: number;
    openedAt?: Date;
    openedBy?: string;
  };
  
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
  
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minThreshold: number;
  }>;
  
  recentSales: Array<{
    saleId: string;
    clientName?: string;
    total: number;
    createdAt: Date;
  }>;
  
  summary: {
    totalClients: number;
    totalProducts: number;
    totalUsers: number;
  };
}

export interface GeneralDashboardDTO {
  date: string;
  
  globalSummary: {
    totalBranches: number;
    activeBranches: number;
    totalSalesToday: number;
    totalAmountToday: number;
    activeUsersToday: number;
  };
  
  branchRanking: Array<{
    branchId: number;
    branchName: string;
    salesCount: number;
    totalAmount: number;
    averageTicket: number;
  }>;
  
  globalTopProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
    branches: string[];
  }>;
  
  salesEvolution: Array<{
    date: string;
    totalAmount: number;
    salesCount: number;
  }>;
  
  branchesWithAlerts: Array<{
    branchId: number;
    branchName: string;
    alerts: string[];
  }>;
}