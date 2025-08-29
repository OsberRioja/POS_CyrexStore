import { productRepository } from "../repositories/product.repository";
import { CreateProductDTO,} from "../dtos/createProduct.dto";
import { UpdateProductDTO } from "../dtos/updateProduct.dto";

export const productService = {
  async createProduct(dto: CreateProductDTO, userId: string) {
    // validaciones mínimas
    if (!dto.sku || !dto.name || dto.salePrice == null || dto.costPrice == null) {
      throw { status: 400, message: "sku, name, costPrice y salePrice son requeridos" };
    }
    // delegar repository (que espera createdBy)
    return productRepository.create(dto, userId);
  },

  async getProducts() {
    return await productRepository.findAll();
  },

  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new Error("Producto no encontrado");
    return product;
  },

  async updateProduct(id: string, dto: UpdateProductDTO) {
    return await productRepository.update(id, dto);
  },

  async deleteProduct(id: string) {
    return await productRepository.delete(id);
  },
};
