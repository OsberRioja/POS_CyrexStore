import { MovementType } from "@prisma/client";

export interface CreateStockMovementDTO {
  productId: string;
  movementType: MovementType;
  quantity: number;
  unitCost?: number;
  providerId?: number;
  saleId?: string;
  notes?: string;
  reason?: string;
  serialNumbers?: string[];
}

export interface UpdateProductPriceDTO {
  costPrice?: number;
  salePrice?: number;
  notes?: string;
}

export interface StockMovementFilters {
  productId?: string;
  movementType?: MovementType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateAdjustmentDTO {
  productId: string;
  quantity: number; // Puede ser positivo o negativo
  reason: string; // Justificación obligatoria
  notes?: string;
}

export interface CreateInternalUseDTO {
  productId: string;
  quantity: number;
  reason: string; // Para qué se usa (evento, taller, etc.)
  destination?: string; // Opcional: lugar/evento específico
  expectedReturnDate?: string; // Fecha esperada de retorno
  notes?: string;
}

export interface ReturnInternalUseDTO {
  internalUseMovementId: number;
  notes?: string;
  condition?: string; // Estado en que regresa
}