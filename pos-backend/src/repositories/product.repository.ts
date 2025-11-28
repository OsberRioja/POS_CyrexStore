import { PrismaClient } from "@prisma/client";
import type { Product } from "@prisma/client";
import type { CreateProductDTO} from "../dtos/createProduct.dto";
import type { UpdateProductDTO } from "../dtos/updateProduct.dto";

const prisma = new PrismaClient();

export const productRepository = {
  async create(dto: CreateProductDTO, createdBy: string, branchId: number): Promise<Product> {
    return prisma.product.create({
      data: {
        createdBy,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,   
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        stock: dto.stock,
        category: dto.category,
        brand: dto.brand,
        imageUrl: dto.imageUrl,
        providerId: dto.providerId ? Number(dto.providerId) : null,
        branchId: branchId,
    },
      include: { user: true, provider: true, branch: { select: { name: true } } },
    });
  },

  findAll(includeInactive = false, branchId?: number) {
    return prisma.product.findMany({
      where: {
        ...(includeInactive ? undefined : { isActive: true }),
        ...(branchId ? { branchId } : {})
      },
      include: {
        user: { select: { name: true, userCode: true } },
        provider: true,
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findAllActive(branchId?: number) {
    return prisma.product.findMany({
      where: { 
        isActive: true,
        ...(branchId ? { branchId } : {})
      },
      include: {
        user: { select: { name: true, userCode: true } },
        provider: true,
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: { user: true, provider: true, branch: { select: { name: true } } },
    });
  },

  async update(id: string, data: UpdateProductDTO) {
    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl })
      },
      include: { user: true, provider: true, branch: { select: { name: true } } },
    });
  },

  async delete(id: string) {
    return await prisma.product.delete({ where: { id } });
  },
};
