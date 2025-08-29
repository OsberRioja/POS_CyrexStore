export interface CreateExpenseDTO {
  amount: number;
  concept: string;
  paymentMethodId: number;
  cashBoxId?: number | null;
  createdBy?: string;
}
