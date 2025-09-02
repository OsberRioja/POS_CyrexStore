export interface CreateExpenseDTO {
  amount: number;
  concept: string;
  paymentMethodId: number;
  note?: string;
}
