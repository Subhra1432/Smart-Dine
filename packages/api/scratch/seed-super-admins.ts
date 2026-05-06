import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding super admins...');

  const admins = [
    {
      email: 'ankitkar969275@gmail.com',
      password: 'Ankit@969275',
    },
    {
      email: 'subhrakantabehera691@gmail.com',
      password: 'Subhra@1432',
    },
  ];

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    
    await prisma.superAdmin.upsert({
      where: { email: admin.email },
      update: {
        passwordHash,
      },
      create: {
        email: admin.email,
        passwordHash,
      },
    });
    
    console.log(`Upserted admin: ${admin.email}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
