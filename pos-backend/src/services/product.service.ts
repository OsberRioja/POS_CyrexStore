import { productRepository } from "../repositories/product.repository";
import { CreateProductDTO } from "../dtos/createProduct.dto";
import { UpdateProductDTO } from "../dtos/updateProduct.dto";
import { prisma } from "../prismaClient";

export const productService = {
  async createProduct(dto: CreateProductDTO, userId: string) {
    // validaciones mínimas
    if (!dto.sku || !dto.name || dto.salePrice == null || dto.costPrice == null) {
      throw { status: 400, message: "sku, name, costPrice y salePrice son requeridos" };
    }

    // Validar moneda
    const validCurrencies = ['BOB', 'USD', 'CNY'];
    const priceCurrency = dto.priceCurrency?.toUpperCase() || 'BOB';
    
    if (!validCurrencies.includes(priceCurrency)) {
      throw { status: 400, message: "priceCurrency debe ser BOB, USD o CNY" };
    }
    
    // ✅ Usar transacción para crear producto y registrar movimiento
    return prisma.$transaction(async (tx) => {
      // Crear el producto usando el repository pero dentro de la transacción
      const created = await tx.product.create({
        data: {
          sku: dto.sku.trim(),
          name: dto.name.trim(),
          description: dto.description?.trim(),
          costPrice: dto.costPrice,
          salePrice: dto.salePrice,
          priceCurrency: dto.priceCurrency,
          stock: dto.stock || 0,
          category: dto.category?.trim(),
          brand: dto.brand?.trim(),
          imageUrl: dto.imageUrl,
          createdBy: userId,
          providerId: dto.providerId ? Number(dto.providerId) : null,
        },
        include: {
          user: { select: { name: true, userCode: true } },
          provider: true,
        },
      });

      // ✅ Registrar movimiento de stock inicial si hay stock > 0
      if (created.stock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            movementType: 'PURCHASE',
            quantity: created.stock,
            previousStock: 0,
            newStock: created.stock,
            unitCost: created.costPrice,
            providerId: created.providerId,
            notes: 'Stock inicial al crear producto',
            createdBy: userId
          }
        });
      }

      return created;
    });
  },

  async getAllProducts(includeInactive = true) {
    return await productRepository.findAll(includeInactive);
  },

  async getProducts() {
    return await productRepository.findAllActive();
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

  async deactivateProduct(productId: string, userId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: userId
      }
    });
  },
  
  async activateProduct(productId: string, userId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        isActive: true,
        deactivatedAt: null,
        deactivatedBy: null
      }
    });
  },
};