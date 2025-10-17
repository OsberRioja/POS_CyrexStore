import { z } from 'zod';

export const CreateReturnItemDTO = z.object({
  productId: z.string().uuid(),
  quantityReturned: z.number().int().positive(),
  unitPrice: z.number().positive(),
  condition: z.enum(['NEW', 'USED', 'DAMAGED']).optional().default('NEW'),
});

export const CreateReturnDTO = z.object({
  saleId: z.string().uuid(),
  reason: z.string().min(1, "El motivo es requerido"),
  items: z.array(CreateReturnItemDTO).min(1, "Debe haber al menos un item a devolver"),
  refundMethod: z.enum(['CASH', 'CREDIT_NOTE', 'EXCHANGE']),
  notes: z.string().optional(),
});

export type CreateReturnDTO = z.infer<typeof CreateReturnDTO>;
export type CreateReturnItemDTO = z.infer<typeof CreateReturnItemDTO>;