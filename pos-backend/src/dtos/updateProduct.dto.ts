export interface UpdateProductDTO {
  name?: string;
  description?: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  category?: string;
  brand?: string;
  providerId?: number;
  imageUrl?: string; // URL de la imagen del producto
}