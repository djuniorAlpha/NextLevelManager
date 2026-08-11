import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme';
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrador';

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    console.log(`AdminUser "${username}" já existe, seed ignorado.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.create({
    data: { name, username, passwordHash, role: 'owner' },
  });

  console.log(`AdminUser "${username}" criado (role: owner).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
