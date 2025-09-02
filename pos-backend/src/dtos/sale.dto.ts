export type SaleItemDTO = {
  productId: string;
  quantity: number;
};

export type SalePaymentDTO = {
  paymentMethodId: number;
  amount: number;
};

export interface CreateSaleDTO {
  sellerUserCode?: number; // preferible: userCode para seleccionar vendedor rápido
  sellerId?: string; // alternativa id
  clientId?: number; // cliente si existe
  client?: { tipoCliente: "PERSONA" | "EMPRESA"; nombre: string; telefono: string; genero?: string; fecha_nacimiento?: string } // crear al vuelo
  items: SaleItemDTO[];
  payments: SalePaymentDTO[]; // suma debe igualar total
  createdBy?: string; // quien registró
  note?: string; // opcional
  cashBoxId?: number | null; // opcional
}
