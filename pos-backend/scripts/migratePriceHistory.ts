import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function migrateExistingProducts() {
  console.log('🔄 Iniciando migración de historial de precios para productos existentes...');

  const products = await prisma.product.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  console.log(`📦 Encontrados ${products.length} productos para migrar`);

  let migratedCount = 0;

  for (const product of products) {
    try {
      // Verificar si ya tiene historial de precios
      const existingHistory = await prisma.priceHistory.findFirst({
        where: { productId: product.id }
      });

      if (!existingHistory) {
        // Crear registros de precio inicial
        await prisma.$transaction([
          // Precio de costo inicial
          prisma.priceHistory.create({
            data: {
              productId: product.id,
              oldPrice: 0,
              newPrice: product.costPrice,
              priceType: 'cost',
              changedBy: product.createdBy,
              notes: 'Migración: Precio de costo inicial'
            }
          }),
          // Precio de venta inicial
          prisma.priceHistory.create({
            data: {
              productId: product.id,
              oldPrice: 0,
              newPrice: product.salePrice,
              priceType: 'sale',
              changedBy: product.createdBy,
              notes: 'Migración: Precio de venta inicial'
            }
          })
        ]);

        migratedCount++;
        console.log(`✅ Migrado producto: ${product.name} (${product.sku})`);
      }
    } catch (error) {
      console.error(`❌ Error migrando producto ${product.name}:`, error);
    }
  }

  console.log(`🎉 Migración completada. ${migratedCount} productos migrados.`);
}

// Ejecutar la migración
migrateExistingProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());