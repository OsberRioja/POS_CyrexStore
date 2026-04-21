import { prisma } from "../prismaClient"; // ajusta la ruta si es otra
import type { Provider } from "@prisma/client";
import type { CreateProviderDTO } from "../dtos/createProvider.dto";
import type { UpdateProviderDTO } from "../dtos/updateProvider.dto";

export const providerRepository = {
  async create(dto: CreateProviderDTO): Promise<Provider> {
    return prisma.provider.create({
      data: {
        name: dto.name,
        countryCode: dto.countryCode,
        country: dto.country,
        phone: dto.phone,
      },
    });
  },

  async findAll(): Promise<Provider[]> {
    return prisma.provider.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: number): Promise<Provider | null> {
    return prisma.provider.findUnique({ where: { id_provider: id } });
  },

  async update(id: number, dto: UpdateProviderDTO): Promise<Provider | null> {
    const existing = await prisma.provider.findUnique({ where: { id_provider: id } });
    if (!existing) return null;

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.phone !== undefined) data.phone = dto.phone;

    return prisma.provider.update({
      where: { id_provider: id },
      data,
    });
  },

  async delete(id: number): Promise<Provider | null> {
    const existing = await prisma.provider.findUnique({ where: { id_provider: id } });
    if (!existing) return null;
    return prisma.provider.delete({ where: { id_provider: id } });
  },
};
