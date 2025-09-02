export interface OpenCashBoxDTO {
  openedBy: string; // user id
  initialAmount: number;
}
export interface CloseCashBoxDTO {
  closedBy: string;
  cashCount?: Record<string, number>; // e.g. { "200": 1, "100": 0, ... }
}
