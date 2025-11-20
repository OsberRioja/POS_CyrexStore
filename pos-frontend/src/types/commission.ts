export interface CommissionRange {
  id?: number;
  minAmount: number;
  maxAmount: number | null;
  commissionValue: number;
  commissionType: 'FIXED' | 'PERCENTAGE';
}

export interface CommissionConfig {
  id: string;
  type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'TIERED_RANGES';
  isActive: boolean;
  fixedAmount: number | null;
  percentage: number | null;
  ranges: CommissionRange[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  user?: {
    id: string;
    name: string;
    userCode: number | null;
  };
}

export interface CreateCommissionConfigDTO {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'TIERED_RANGES';
  isActive: boolean;
  fixedAmount?: number | null;
  percentage?: number | null;
  ranges?: CommissionRange[];
}

export interface UpdateCommissionConfigDTO {
  type?: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'TIERED_RANGES';
  isActive?: boolean;
  fixedAmount?: number | null;
  percentage?: number | null;
  ranges?: CommissionRange[];
}