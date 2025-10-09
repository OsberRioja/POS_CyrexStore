export interface CreatePaymentMethodDTO {
  name: string;
  isCash?: boolean;
}
export interface UpdatePaymentMethodDTO {
  name?: string;
  isCash?: boolean;
}