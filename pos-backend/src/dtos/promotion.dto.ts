export interface PromotionDTO {
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  productIds: string[];
}
