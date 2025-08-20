export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  providerName?: string; // aceptamos nombre de proveedor (si no existe, lo creamos)
}
