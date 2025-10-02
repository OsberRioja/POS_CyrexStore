import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const password = 'Admin123'; // Cambia esto
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@empresa.com',
      phone: '70000000',
      password: hashedPassword,
      role: 'ADMIN',
      userCode: 1000, // Código único
    }
  });

  console.log('Usuario creado:', {
    id: user.id,
    name: user.name,
    email: user.email,
    userCode: user.userCode
  });
}

createUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());