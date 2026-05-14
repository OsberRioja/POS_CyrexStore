import { productRepository } from "../repositories/product.repository";
import { CreateProductDTO } from "../dtos/createProduct.dto";
import { UpdateProductDTO } from "../dtos/updateProduct.dto";
import { prisma } from "../prismaClient";
import { normalizeTextField } from "../utils/normalizeTextField";

export type GlobalStockBranch = {
  branchId: number;
  branchName: string;
  stock: number;
};

export type GlobalStockProduct = {
  codigoInterno: string;
  sku: string | null;
  name: string;
  category: string | null;
  brand: string | null;
  branches: GlobalStockBranch[];
  totalStock: number;
};

export type GlobalStockParams = {
  q?: string;
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "sku" | "codigoInterno" | "category" | "brand" | "totalStock";
  sortDir?: "asc" | "desc";
};

export type GlobalStockResponse = {
  data: GlobalStockProduct[];
  branches: { id: number; name: string }[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  metadata: { categories: string[]; brands: string[] };
};

export const productService = {
  async generateUniqueCodigoInterno(tx: typeof prisma) {
    for (let i = 0; i < 20; i++) {
      const codigo = String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0");
      const exists = await tx.product.findFirst({ where: { codigoInterno: codigo }, select: { id: true } });
      if (!exists) return codigo;
    }
    throw { status: 500, message: "No se pudo generar un código interno único" };
  },

  async createProduct(dto: CreateProductDTO, userId: string) {
    // validaciones mínimas
    if (!dto.name || dto.salePrice == null || dto.costPrice == null) {
      throw { status: 400, message: "name, costPrice y salePrice son requeridos" };
    }

    let codigoInterno = dto.codigoInterno?.trim();

    // Si NO viene código → generar correlativo
    if (!codigoInterno) {
    
      // Buscar el último código registrado
      const lastProduct = await prisma.product.findFirst({
        orderBy: {
          codigoInterno: 'desc'
        },
        select: {
          codigoInterno: true
        }
      });
    
      // Obtener número actual
      const lastNumber = lastProduct?.codigoInterno
        ? parseInt(lastProduct.codigoInterno, 10)
        : 0;
    
      // Siguiente número
      const nextNumber = lastNumber + 1;
    
      // Convertir a 7 dígitos
      codigoInterno = nextNumber.toString().padStart(7, '0');
    }

    // Validar formato final
    if (!/^\d{7}$/.test(codigoInterno)) {
      throw {
        status: 400,
        message: "codigoInterno debe tener exactamente 7 dígitos numéricos"
      };
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
        const normalizedCategory = normalizeTextField(dto.category);
        const normalizedBrand = normalizeTextField(dto.brand);
        const normalizedSku = dto.sku?.trim() || null;

        if (normalizedSku) {
          const existingSku = await tx.product.findFirst({
            where: {
              sku: normalizedSku
            }
          });

          if (existingSku) {
            throw { status: 400, message: `El SKU '${normalizedSku}' ya existe.` };
          }
        }

        const existingCodigoInterno = await tx.product.findFirst({
          where: { codigoInterno }
        });

        if (existingCodigoInterno) {
          throw { status: 400, message: `El código interno '${codigoInterno}' ya existe.` };
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
              sku: normalizedSku,
              codigoInterno,
              name: dto.name.trim(),
              description: dto.description?.trim(),
              costPrice: dto.costPrice,
              salePrice: dto.salePrice,
              priceCurrency: priceCurrency,
              stock: 0,
              category: normalizedCategory,
              brand: normalizedBrand,
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

  async getAllProducts(includeInactive = true, branchId?: number, onlyInStock = false) {
    return await productRepository.findAll(includeInactive, branchId, onlyInStock);
  },

  async getProducts(branchId?: number, onlyInStock = false) {
    return await productRepository.findAllActive(branchId, onlyInStock);
  },

  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new Error("Producto no encontrado");
    return product;
  },

  async getGlobalStock(params: GlobalStockParams = {}): Promise<GlobalStockResponse> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const sortBy = params.sortBy ?? "name";
    const sortDir = params.sortDir ?? "asc";
    const query = params.q?.trim();
    const category = normalizeTextField(params.category);
    const brand = normalizeTextField(params.brand);

    const activeBranches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        branch: { isActive: true },
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { sku: { contains: query, mode: "insensitive" } },
                { codigoInterno: { contains: query, mode: "insensitive" } }
              ]
            }
          : {})
      },
      select: {
        codigoInterno: true,
        sku: true,
        name: true,
        category: true,
        brand: true,
        stock: true,
        branchId: true,
        createdAt: true
      },
      orderBy: [{ codigoInterno: "asc" }, { sku: "asc" }, { createdAt: "asc" }]
    });

    const grouped = new Map<string, GlobalStockProduct>();

    for (const product of products) {
      const groupKey = product.codigoInterno || product.sku || product.name;
      const existing = grouped.get(groupKey);

      if (!existing) {
        grouped.set(groupKey, {
          codigoInterno: product.codigoInterno,
          sku: product.sku,
          name: product.name,
          category: product.category,
          brand: product.brand,
          branches: activeBranches.map((branch) => ({
            branchId: branch.id,
            branchName: branch.name,
            stock: branch.id === product.branchId ? product.stock : 0
          })),
          totalStock: product.stock
        });
        continue;
      }

      const branchStock = existing.branches.find((branch) => branch.branchId === product.branchId);
      if (branchStock) {
        branchStock.stock += product.stock;
      }
      existing.totalStock += product.stock;
      existing.sku = existing.sku ?? product.sku;
      existing.category = existing.category ?? product.category;
      existing.brand = existing.brand ?? product.brand;
    }

    const allItems = Array.from(grouped.values());
    const categories = Array.from(new Set(allItems.map((item) => normalizeTextField(item.category)).filter(Boolean))) as string[];
    const brands = Array.from(new Set(allItems.map((item) => normalizeTextField(item.brand)).filter(Boolean))) as string[];

    allItems.sort((a, b) => {
      const multiplier = sortDir === "desc" ? -1 : 1;

      if (sortBy === "totalStock") {
        return (a.totalStock - b.totalStock) * multiplier;
      }

      const left = String(a[sortBy] ?? "");
      const right = String(b[sortBy] ?? "");
      return left.localeCompare(right, "es-BO", { numeric: true, sensitivity: "base" }) * multiplier;
    });

    const totalItems = allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const data = allItems.slice((safePage - 1) * limit, safePage * limit);

    return {
      data,
      branches: activeBranches,
      pagination: { page: safePage, limit, totalItems, totalPages },
      metadata: {
        categories: categories.sort((a, b) => a.localeCompare(b, "es-BO")),
        brands: brands.sort((a, b) => a.localeCompare(b, "es-BO"))
      }
    };
  },

  async updateProduct(id: string, dto: UpdateProductDTO) {
    const { applyToAllBranches = false } = dto;
    const normalizedDto: UpdateProductDTO = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.costPrice !== undefined ? { costPrice: dto.costPrice } : {}),
      ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
      ...(dto.priceCurrency !== undefined ? { priceCurrency: dto.priceCurrency } : {}),
      ...(dto.category !== undefined ? { category: normalizeTextField(dto.category) } : {}),
      ...(dto.brand !== undefined ? { brand: normalizeTextField(dto.brand) } : {}),
      ...(dto.providerId !== undefined ? { providerId: dto.providerId } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
    };

    if (!applyToAllBranches) {
      return await productRepository.update(id, normalizedDto);
    }

    return prisma.$transaction(async (tx) => {
      const sourceProduct = await tx.product.findUnique({
        where: { id },
        select: { id: true, codigoInterno: true, sku: true }
      });

      if (!sourceProduct) {
        throw new Error("Producto no encontrado");
      }

      const whereByFamily = sourceProduct.codigoInterno
        ? { codigoInterno: sourceProduct.codigoInterno }
        : sourceProduct.sku
          ? { sku: sourceProduct.sku }
          : null;

      if (!whereByFamily) {
        throw new Error("No se pudo identificar la familia del producto para actualización global");
      }

      await tx.product.updateMany({
        where: whereByFamily,
        data: normalizedDto,
      });

      return tx.product.findUnique({
        where: { id },
        include: { user: true, provider: true, branch: { select: { name: true } } },
      });
    });
  },

  async getProductMetadata(branchId?: number) {
    const products = await prisma.product.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        isActive: true
      },
      select: { category: true, brand: true }
    });

    const categories = Array.from(new Set(products.map((p) => normalizeTextField(p.category)).filter(Boolean))) as string[];
    const brands = Array.from(new Set(products.map((p) => normalizeTextField(p.brand)).filter(Boolean))) as string[];

    return {
      categories: categories.sort((a, b) => a.localeCompare(b, "es-BO")),
      brands: brands.sort((a, b) => a.localeCompare(b, "es-BO"))
    };
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

  async getNextCodigoInterno() {
    // Buscar el producto con el código interno más alto
    const lastProduct = await prisma.product.findFirst({
      orderBy: {
        codigoInterno: 'desc'
      },
      select: {
        codigoInterno: true
      }
    });

    // Si no existe ninguno, empezar desde 1
    if (!lastProduct?.codigoInterno) {
      return "0000001";
    }

    // Convertir a número
    const lastNumber = parseInt(lastProduct.codigoInterno, 10);

    // Incrementar
    const nextNumber = lastNumber + 1;

    // Formatear a 7 dígitos
    return String(nextNumber).padStart(7, '0');
  },
};
