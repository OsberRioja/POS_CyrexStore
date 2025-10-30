export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  priceCurrency?: string;
  stock: number; // cantidad de stock inicial
  category?: string; // opcional, si se quiere asociar a una categoría
  brand?: string; // opcional, si se quiere asociar a una marca
  providerId?: string; //porveedor asociado
}