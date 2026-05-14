
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'SUBHRAKANTABEHERA691@GMAIL.COM';
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive'
      }
    },
    include: {
      restaurant: true
    }
  });

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('User found:', user.email);
  console.log('Restaurant:', user.restaurant.name, '(', user.restaurantId, ')');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
