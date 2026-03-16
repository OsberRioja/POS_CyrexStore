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
    
    // ✅ Crear producto maestro en todas las sucursales activas
    try {
      return prisma.$transaction(async (tx) => {
        const existingSku = await tx.product.findFirst({
          where: {
            sku: dto.sku.trim()
          }
        });

        if (existingSku) {
          throw { status: 400, message: `El SKU '${dto.sku}' ya existe.` };
        }

        const activeBranches = await tx.branch.findMany({
          where: { isActive: true },
          select: { id: true }
        });

        if (!activeBranches.length) {
          throw { status: 400, message: "No hay sucursales activas para crear el producto" };
        }

        const createdProducts = [];

        for (const branch of activeBranches) {
          const created = await tx.product.create({
            data: {
              sku: dto.sku.trim(),
              name: dto.name.trim(),
              description: dto.description?.trim(),
              costPrice: dto.costPrice,
              salePrice: dto.salePrice,
              priceCurrency: priceCurrency,
              stock: 0,
              category: dto.category?.trim(),
              brand: dto.brand?.trim(),
              imageUrl: dto.imageUrl,
              createdBy: userId,
              providerId: dto.providerId ? Number(dto.providerId) : null,
              branchId: branch.id
            },
            include: {
              user: { select: { name: true, userCode: true } },
              provider: true,
              branch: { select: { name: true } }
            },
          });

          await tx.priceHistory.create({
            data: {
              productId: created.id,
              oldPrice: 0,
              newPrice: created.costPrice,
              priceType: 'cost',
              changedBy: userId,
              notes: 'Precio de costo inicial al crear producto maestro'
            }
          });

          await tx.priceHistory.create({
            data: {
              productId: created.id,
              oldPrice: 0,
              newPrice: created.salePrice,
              priceType: 'sale',
              changedBy: userId,
              notes: 'Precio de venta inicial al crear producto maestro'
            }
          });

          createdProducts.push(created);
        }

        return createdProducts;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : '';

        throw {
          status: 400,
          message: target.includes('sku') || target.includes('Product_sku_key')
            ? "No se pudo crear el producto maestro porque la base aún tiene una restricción única de SKU global. Aplica la migración para usar unicidad por sucursal (sku, branchId), ejecuta prisma generate y reinicia el backend."
            : `No se pudo crear el producto por una restricción única (${target || 'desconocida'}).`
        };
      }
      throw error;
    }
  },

  async getAllProducts(includeInactive = true, branchId?: number) {
    return await productRepository.findAll(includeInactive, branchId);
  },

  async getProducts(branchId?: number) {
    return await productRepository.findAllActive(branchId);
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