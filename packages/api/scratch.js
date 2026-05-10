import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
  try {
    const email = 'owner@spicegarden.com';
    const password = 'owner123';
    console.log('Testing login for:', email);

    let user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: true },
    });

    console.log('Found user:', user ? user.id : 'No');

    if (!user) {
      console.log('User missing, trying upsert restaurant...');
      const restaurant = await prisma.restaurant.upsert({
        where: { slug: 'spice-garden' },
        update: { status: 'ACTIVE', isActive: true, plan: 'PREMIUM' },
        create: {
          name: 'Spice Garden',
          slug: 'spice-garden',
          status: 'ACTIVE',
          isActive: true,
          plan: 'PREMIUM'
        }
      });
      console.log('Upserted restaurant:', restaurant.id);
      
      const hash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          restaurantId: restaurant.id,
          email,
          passwordHash: hash,
          role: 'OWNER',
          isActive: true
        },
        include: { restaurant: true }
      });
      console.log('Created user:', user.id);
    } else {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log('Password valid:', isValid);
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
