import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminCredentials = [
    { email: 'admin@dinesmart.ai', password: 'superadmin123' },
    { email: 'ankitkar969275@gmail.com', password: 'Ankit@969275' },
    { email: 'subhrakantabehera691@gmail.com', password: 'Subhra@1432' }
  ];

  for (const cred of adminCredentials) {
    const hash = await bcrypt.hash(cred.password, 12);
    await prisma.superAdmin.upsert({
      where: { email: cred.email },
      update: { passwordHash: hash },
      create: {
        email: cred.email,
        passwordHash: hash,
      },
    });
    console.log(`Seeded ${cred.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
