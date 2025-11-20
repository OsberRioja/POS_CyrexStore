import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCommissionConfig() {
  console.log('🌱 Iniciando seed de configuración de comisiones...');

  try {
    // Verificar si ya existe una configuración activa
    const existingActive = await prisma.commissionConfig.findFirst({
      where: { isActive: true }
    });

    if (existingActive) {
      console.log('✅ Ya existe una configuración activa de comisiones');
      return true;
    }

    // Crear configuración con rangos por defecto (sistema actual)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No se encontró usuario ADMIN para crear la configuración');
      console.log('💡 Ejecuta primero el seed principal para crear usuarios');
      return false;
    }

    const commissionConfig = await prisma.commissionConfig.create({
      data: {
        type: 'TIERED_RANGES',
        isActive: true,
        createdBy: adminUser.id,
        ranges: {
          create: [
            {
              minAmount: 0,
              maxAmount: 100,
              commissionValue: 5,
              commissionType: 'FIXED'
            },
            {
              minAmount: 101,
              maxAmount: 400,
              commissionValue: 10,
              commissionType: 'FIXED'
            },
            {
              minAmount: 401,
              maxAmount: null,
              commissionValue: 20,
              commissionType: 'FIXED'
            }
          ]
        }
      },
      include: { ranges: true }
    });

    console.log('✅ Configuración de comisiones creada con ID:', commissionConfig.id);
    console.log('📊 Rangos creados:');
    commissionConfig.ranges.forEach(range => {
      console.log(`   - ${range.minAmount} a ${range.maxAmount ?? '∞'}: ${range.commissionValue} Bs`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error en seed de comisiones:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedCommissionConfig();