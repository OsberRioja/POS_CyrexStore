export interface OpenCashBoxDTO {
  openedBy: string; // user id
  initialAmount: number;
}
export interface CloseCashBoxDTO {
  closedBy: string;
  cashCount?: {
    denominations: { [key: number]: number };
    total: number;
    expectedTotal: number;
    difference: number;
    timestamp: string;
  };
  notes?: string;
}
