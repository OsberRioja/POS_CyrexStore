// scripts/migrate-sale-items.ts
import { prisma } from '../src/prismaClient';

async function migrateSaleItems() {
  console.log('Iniciando migración de items de venta...');
  
  // Obtener todos los items de venta que no tienen conversionRate
  const saleItems = await prisma.saleItem.findMany({
    where: {
      OR: [
        { conversionRate: null },
        { originalPrice: null },
        { originalCurrency: null }
      ]
    },
    include: {
      product: true,
      sale: true
    }
  });

  console.log(`Encontrados ${saleItems.length} items para migrar`);

  let migrated = 0;
  let errors = 0;

  for (const item of saleItems) {
    try {
      const product = item.product;
      const unitPrice = item.unitPrice;
      
      if (!product) continue;
      
      // Si el producto está en USD
      if (product.priceCurrency === 'USD') {
        // Intentar calcular la tasa basada en el precio de venta del producto
        const productSalePriceUSD = product.salePrice || 0;
        
        if (productSalePriceUSD > 0 && unitPrice > 0) {
          const conversionRate = unitPrice / productSalePriceUSD;
          
          await prisma.saleItem.update({
            where: { id: item.id },
            data: {
              originalPrice: productSalePriceUSD,
              originalCurrency: 'USD',
              conversionRate: conversionRate
            }
          });
          
          migrated++;
        } else {
          // Usar tasa por defecto
          await prisma.saleItem.update({
            where: { id: item.id },
            data: {
              originalPrice: product.costPrice || 0,
              originalCurrency: 'USD',
              conversionRate: 6.91 // Tasa promedio
            }
          });
          
          migrated++;
        }
      } else {
        // Productos en BOB
        await prisma.saleItem.update({
          where: { id: item.id },
          data: {
            originalPrice: unitPrice,
            originalCurrency: 'BOB',
            conversionRate: 1
          }
        });
        
        migrated++;
      }
    } catch (error) {
      console.error(`Error migrando item ${item.id}:`, error);
      errors++;
    }
  }

  console.log(`Migración completada: ${migrated} migrados, ${errors} errores`);
}

// Ejecutar la migración
migrateSaleItems()
  .catch(console.error)
  .finally(() => process.exit());