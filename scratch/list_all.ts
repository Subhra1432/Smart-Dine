import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdmins = await prisma.superAdmin.findMany();
  console.log('--- SuperAdmins ---');
  superAdmins.forEach(s => console.log(`- ${s.email}`));

  const users = await prisma.user.findMany({ include: { restaurant: true } });
  console.log('\n--- Restaurant Users ---');
  users.forEach(u => console.log(`- ${u.email} (Role: ${u.role}, Restaurant: ${u.restaurant?.name || 'NONE'})`));

  const restaurants = await prisma.restaurant.findMany({
    include: {
      _count: {
        select: { categories: true, menuItems: true }
      }
    }
  });
  console.log('\n--- Restaurants ---');
  restaurants.forEach(r => {
    console.log(`- ${r.name} (ID: ${r.id})`);
    console.log(`  Categories: ${r._count.categories}`);
    console.log(`  Menu Items: ${r._count.menuItems}`);
  });
}

main().finally(() => prisma.$disconnect());
