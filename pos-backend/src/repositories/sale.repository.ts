import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const SaleRepository = {
  createFull: async (dto:any, sellerId:string, clientId?:number, cashBoxId?:number) => {
    //dto.items [{productId, quantity}] and dto.payments [{paymentMethodId, amount}]
    //build items with unitPrice from product.salePrice and subtotal
    const itemsData = await Promise.all(dto.items.map(async (it:any) => {
      const p = await prisma.product.findUnique({ where:{ id: it.productId }});
      const price = p?.salePrice ?? 0;
      return { productId: it.productId, quantity: it.quantity, unitPrice: price, subtotal: price * it.quantity };
    }));
    const total = itemsData.reduce((s:any,i:any) => s + i.subtotal, 0);

    // create sale with nested items and payments
    return prisma.sale.create({
      data: {
        sellerId,
        clientId: clientId ?? undefined,
        total,
        cashBoxId: cashBoxId ?? undefined,
        createdBy: dto.createdBy,
        items: { create: itemsData },
        payments: { create: dto.payments.map((p:any)=>({ paymentMethodId: p.paymentMethodId, amount: p.amount, cashBoxId: p.paymentMethodId /* placeholder */ })) }
      },
      include: { items: true, payments: true }
    });
  },

  findAll: (opts?:any) => prisma.sale.findMany({ include:{ items:true, payments:true, }, orderBy:{ createdAt: "desc" } }),
  findById: (id:string) => prisma.sale.findUnique({ where:{ id }, include:{ items: true, payments:true } }),
};
