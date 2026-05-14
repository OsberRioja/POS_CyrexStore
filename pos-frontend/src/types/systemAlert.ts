export type SystemAlertType = 'CASHBOX_REOPENED' | string;

export interface SystemAlertUser {
  id: string;
  name: string;
  userCode?: number | null;
}

export interface SystemAlertBranch {
  id: number;
  name: string;
}

export interface SystemAlert {
  id: number;
  type: SystemAlertType;
  title: string;
  message: string;
  referenceId?: number | null;
  branchId?: number | null;
  createdBy?: string | null;
  isRead: boolean;
  createdAt: string;
  user?: SystemAlertUser | null;
  branch?: SystemAlertBranch | null;
}

export interface SystemAlertListResponse {
  data: SystemAlert[];
  total: number;
  page: number;
  limit: number;
}
