// diagnostic-script.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  try {
    // Intenta crear un producto mínimo
    const testProduct = await prisma.product.create({
      data: {
        sku: 'TEST-SKU-123',
        name: 'Test Product',
        costPrice: 100,
        salePrice: 150,
        stock: 10,
        priceCurrency: 'BOB',
        createdBy: 'test-user-id', // usa un ID de usuario real
      },
    });
    console.log('✅ Producto creado exitosamente:', testProduct);
  } catch (error: any) {
    console.log('❌ Error al crear producto:', error.message);
    console.log('Detalles completos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();