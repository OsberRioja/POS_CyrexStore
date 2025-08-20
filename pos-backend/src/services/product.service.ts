import { ProductRepository } from "../repositories/product.repository";
import { CreateProductDTO } from "../dtos/createProduct.dto";
import { Prisma } from "@prisma/client";

export const ProductService = {
  async createProduct(dto: CreateProductDTO) {
    // Validación mínima por el servicio (más reglas pueden ir aquí)
    if (!dto.sku || !dto.name || dto.purchasePrice == null || dto.salePrice == null) {
      throw { status: 400, message: "sku, name, purchasePrice y salePrice son requeridos" };
    }

    try {
      const created = await ProductRepository.create(dto);
      return created;
    } catch (err) {
      // Detectar error de unique constraint (SKU duplicado)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw { status: 409, message: "SKU ya existe" };
      }
      throw { status: 500, message: "Error interno al crear producto" };
    }
  },

  async listProducts() {
    return ProductRepository.findAll();
  },

  async getProductById(id: string) {
    const p = await ProductRepository.findById(id);
    if (!p) throw { status: 404, message: "Producto no encontrado" };
    return p;
  }
};
