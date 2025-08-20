import { prisma } from "../prismaClient";
import { CreateProductDTO } from "../dtos/createProduct.dto";

export const ProductRepository = {
  async create(dto: CreateProductDTO) {
    // Si viene providerName, buscamos o creamos provider primero
    let providerId = undefined;
    if (dto.providerName) {
      const provider = await prisma.provider.upsert({
        where: { name: dto.providerName },
        update: {},
        create: { name: dto.providerName },
      });
      providerId = provider.id;
    }

    const product = await prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        costPrice: dto.purchasePrice,
        salePrice: dto.salePrice,
        providerId,
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
