import { z } from 'zod';

export type SaleItemDTO = {
  productId: string;
  quantity: number;
  unitPrice?: number; // opcional, se puede tomar del producto
};

export type SalePaymentDTO = {
  paymentMethodId: number;
  amount: number;
};

export interface CreateSaleDTO {
  sellerUserCode?: number; // preferible: userCode para seleccionar vendedor rápido
  sellerId?: string; // alternativa id
  clientId?: number; // cliente si existe
  client?: { 
    id_cliente?: number; // si existe
    tipoCliente?: "PERSONA" | "EMPRESA"; 
    nombre?: string; 
    telefono?: string; 
    genero?: string; 
    fecha_nacimiento?: string 
  } // crear al vuelo o usar existente
  items: SaleItemDTO[];
  payments: SalePaymentDTO[]; // suma puede ser menor al total (anticipo)
  allowPartialPayment?: boolean; // NUEVO: indica si se permite pago parcial
  createdBy?: string; // quien registró
  note?: string; // opcional
  cashBoxId?: number | null; // opcional
  // NOTA: branchId se obtiene del usuario autenticado, no del DTO
}

// NUEVO: Schema de Zod para validación de pagos adicionales
export const addPaymentSchema = z.object({
  saleId: z.string().uuid('ID de venta inválido'),
  paymentMethodId: z.number().int().positive('ID de método de pago inválido'),
  amount: z.number().positive('El monto debe ser positivo'),
  cashBoxId: z.number().int().positive().optional(),
});

// NUEVO: DTO para completar pagos (derivado del schema)
export type AddPaymentDTO = z.infer<typeof addPaymentSchema>;

// Schema para crear venta (opcional, para validaciones futuras)
export const createSaleSchema = z.object({
  sellerUserCode: z.number().int().positive().optional(),
  sellerId: z.string().uuid().optional(),
  clientId: z.number().int().positive().optional(),
  client: z.object({
    id_cliente: z.number().int().positive().optional(),
    tipoCliente: z.enum(['PERSONA', 'EMPRESA']).optional(),
    nombre: z.string().min(1).optional(),
    telefono: z.string().optional(),
    genero: z.string().optional(),
    fecha_nacimiento: z.string().optional(),
  }).optional(),
  items: z.array(z.object({
    productId: z.string().uuid('ID de producto inválido'),
    quantity: z.number().int().positive('La cantidad debe ser positiva'),
    unitPrice: z.number().positive().optional(),
  })).min(1, 'Debe incluir al menos un producto'),
  payments: z.array(z.object({
    paymentMethodId: z.number().int().positive('ID de método de pago inválido'),
    amount: z.number().positive('El monto debe ser positivo'),
  })).min(1, 'Debe incluir al menos un pago'),
  allowPartialPayment: z.boolean().optional(),
  createdBy: z.string().uuid().optional(),
  note: z.string().optional(),
  cashBoxId: z.number().int().positive().optional(),
});