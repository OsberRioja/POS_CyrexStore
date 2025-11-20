export interface CommissionReport {
  id: string;
  saleId: string;
  userId: string;
  amount: number;
  calculatedAt: string;
  month: number;
  year: number;
  user?: {
    id: string;
    name: string;
    userCode: number | null;
    email: string;
  };
  sale?: {
    id: string;
    total: number;
    createdAt: string;
    client?: {
      nombre: string;
    };
  };
}

export interface CommissionSummary {
  userId: string;
  userName: string;
  userCode: string | null;
  email: string;
  totalCommissions: number;
  totalSales: number;
}

export interface CommissionReportResponse {
  data: CommissionReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommissionSummaryResponse {
  data: CommissionSummary[];
}