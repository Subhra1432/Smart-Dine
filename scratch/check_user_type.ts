
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'SUBHRAKANTABEHERA691@GMAIL.COM';
  
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: email.toLowerCase() }
  });
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { restaurant: true }
  });

  console.log('SuperAdmin found:', !!superAdmin);
  console.log('Restaurant User found:', !!user);
  if (user) {
    console.log('Restaurant:', user.restaurant?.name);
  }
}

main().finally(() => prisma.$disconnect());
