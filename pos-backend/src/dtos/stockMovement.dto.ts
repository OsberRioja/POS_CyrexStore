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