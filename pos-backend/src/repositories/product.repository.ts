import { prisma } from "../prismaClient";
import { CreateProductDTO } from "../dtos/createProduct.dto";

export const ProductRepository = {
  async create(dto: CreateProductDTO, userId: string) {
    const product = await prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        stock: dto.stock,
        category: dto.category,
        brand: dto.brand,
        providerId: dto.providerId,
        createdBy: userId, // aquí guardamos el userId que viene del token
      },
    });

    return product;
  },

  async findAll() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { provider: true },
    });
  },

  async findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku } });
  },

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: { provider: true } });
  }
};
