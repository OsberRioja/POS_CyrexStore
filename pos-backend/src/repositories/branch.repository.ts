import { Branch, Prisma } from '@prisma/client';
import { prisma } from '../prismaClient';

const normalizeSku = (sku?: string | null): string | null => {
  const normalized = sku?.trim();
  return normalized ? normalized : null;
};

type CreateBranchResult = Branch & {
  syncedProductsCount?: number;
  syncedClientsCount?: number;
  syncedProvidersCount?: number;
};

export class BranchRepository {
  async findAll(): Promise<Branch[]> {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: number): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { id, isActive: true }
    });
  }

  async create(data: { name: string; address?: string; phone?: string }, createdBy: string): Promise<CreateBranchResult> {
    return prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          ...data,
          isActive: true
        }
      });

      const syncedProductsCount = await this.syncGlobalProductsToBranch(tx, branch.id, createdBy);
      const syncedClientsCount = await tx.cliente.count();
      const syncedProvidersCount = await tx.provider.count();

      return {
        ...branch,
        syncedProductsCount,
        syncedClientsCount,
        syncedProvidersCount,
      };
    });
  }

  async update(id: number, data: { name?: string; address?: string; phone?: string; isActive?: boolean }): Promise<Branch> {
    return prisma.branch.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<Branch> {
    return prisma.branch.update({
      where: { id },
      data: { isActive: false }
    });
  }

  private async syncGlobalProductsToBranch(
    tx: Prisma.TransactionClient,
    branchId: number,
    createdBy: string
  ): Promise<number> {
    const sourceProducts = await tx.product.findMany({
      where: {
        isActive: true,
        branchId: { not: branchId },
      },
      distinct: ['codigoInterno'],
      orderBy: [{ codigoInterno: 'asc' }, { createdAt: 'asc' }],
      select: {
        sku: true,
        codigoInterno: true,
        name: true,
        salePrice: true,
        costPrice: true,
        description: true,
        brand: true,
        category: true,
        providerId: true,
        imageUrl: true,
        imagePublicId: true,
        priceCurrency: true,
      }
    });

    const productsWithSkuInBranch = await tx.product.findMany({
      where: {
        branchId,
        sku: { not: null },
      },
      select: { sku: true }
    });
    const usedSkus = new Set(
      productsWithSkuInBranch
        .map((product) => normalizeSku(product.sku))
        .filter((sku): sku is string => Boolean(sku))
    );
    let syncedProductsCount = 0;

    for (const product of sourceProducts) {
      const existingInBranch = await tx.product.findFirst({
        where: {
          branchId,
          codigoInterno: product.codigoInterno,
        },
        select: { id: true }
      });

      if (existingInBranch) continue;

      const normalizedSku = normalizeSku(product.sku);
      const sku = normalizedSku && !usedSkus.has(normalizedSku) ? normalizedSku : null;

      const createdProduct = await tx.product.create({
        data: {
          sku,
          codigoInterno: product.codigoInterno,
          name: product.name,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          description: product.description,
          brand: product.brand,
          category: product.category,
          stock: 0,
          createdBy,
          providerId: product.providerId,
          imageUrl: product.imageUrl,
          imagePublicId: product.imagePublicId,
          priceCurrency: product.priceCurrency,
          branchId,
          isActive: true,
        }
      });

      if (sku) {
        usedSkus.add(sku);
      }

      await tx.priceHistory.createMany({
        data: [
          {
            productId: createdProduct.id,
            oldPrice: 0,
            newPrice: createdProduct.costPrice,
            priceType: 'cost',
            changedBy: createdBy,
            notes: 'Precio de costo inicial al sincronizar producto en nueva sucursal'
          },
          {
            productId: createdProduct.id,
            oldPrice: 0,
            newPrice: createdProduct.salePrice,
            priceType: 'sale',
            changedBy: createdBy,
            notes: 'Precio de venta inicial al sincronizar producto en nueva sucursal'
          }
        ]
      });

      syncedProductsCount += 1;
    }

    return syncedProductsCount;
  }
}
