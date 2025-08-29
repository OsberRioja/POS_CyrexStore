const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    const p = u.password || '';
    if (!p.startsWith('$2')) { // no es bcrypt hash
      const hashed = await bcrypt.hash(p, 10);
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hashed },
      });
      console.log('Hashed password for', u.email);
    } else {
      console.log('Already hashed:', u.email);
    }
  }
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
