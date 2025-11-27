import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  // Primero crear la sucursal principal
  const mainBranch = await prisma.branch.upsert({
    where: { name: 'Sucursal Principal' },
    update: {},
    create: {
      name: 'Sucursal Principal',
      address: 'Dirección principal',
      phone: '0000-0000',
    },
  });

  console.log('✅ Sucursal principal creada:', mainBranch.name);

  // Crear usuario administrador (sin branchId - administrador global)
  const password = 'Admin123*';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: 'osberriojalopez@gmail.com' },
    update: {},
    create: {
      name: 'Osber Rioja',
      email: 'osberriojalopez@gmail.com',
      phone: '60733137',
      password: hashedPassword,
      role: 'ADMIN',
      userCode: 1000, // Código único
      // branchId: undefined -> será null (administrador global)
    },
  });

  console.log('✅ Usuario administrador creado:', {
    id: user.id,
    name: user.name,
    email: user.email,
    userCode: user.userCode,
    branchId: user.branchId // Debería ser null
  });
}

createUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());