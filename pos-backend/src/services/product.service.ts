import { productRepository } from "../repositories/product.repository";
import { CreateProductDTO,} from "../dtos/createProduct.dto";
import { UpdateProductDTO } from "../dtos/updateProduct.dto";

export const productService = {
  async createProduct(dto: CreateProductDTO, userId: string) {
    return await productRepository.create(dto, userId);
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
