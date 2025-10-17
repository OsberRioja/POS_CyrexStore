export interface ReturnPolicy {
  maxDaysForReturn: number;
  requiresApproval: boolean;
  allowPartialReturn: boolean;
  refundMethods: string[];
  requiresReason: boolean;
  returnToStock: boolean;
}

export const RETURN_POLICY: ReturnPolicy = {
  maxDaysForReturn: parseInt(process.env.RETURN_MAX_DAYS || '7'),
  requiresApproval: process.env.RETURN_REQUIRES_APPROVAL === 'true',
  allowPartialReturn: process.env.RETURN_ALLOW_PARTIAL === 'true',
  refundMethods: ['CASH', 'CREDIT_NOTE', 'EXCHANGE'],
  requiresReason: true,
  returnToStock: true,
};