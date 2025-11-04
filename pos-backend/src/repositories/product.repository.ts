import { PrismaClient } from "@prisma/client";
import type { Product } from "@prisma/client";
import type { CreateProductDTO} from "../dtos/createProduct.dto";
import type { UpdateProductDTO } from "../dtos/updateProduct.dto";

const prisma = new PrismaClient();

export const productRepository = {
  async create(dto: CreateProductDTO, createdBy: string): Promise<Product> {
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
        providerId: dto.providerId ? Number(dto.providerId) : null, // 👈 convertir a númer
    },
      include: { user: true, provider: true },
    });
  },

  findAll(includeInactive = false) {
    return prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        user: { select: { name: true, userCode: true } },
        provider: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findAllActive() {
    return prisma.product.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, userCode: true } },
        provider: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: { user: true, provider: true },
    });
  },

  async update(id: string, data: UpdateProductDTO) {
    return await prisma.product.update({
      where: { id },
      data,
      include: { user: true, provider: true },
    });
  },

  async delete(id: string) {
    return await prisma.product.delete({ where: { id } });
  },
};
