
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'subhrakantabehera691@gmail.com';
  const password = 'Subhra@1432';
  
  console.log('🚀 Custom Menu Setup');

  // 1. Ensure Restaurant exists
  let restaurant = await prisma.restaurant.findFirst({
    where: { users: { some: { email: email.toLowerCase() } } }
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'DineSmart Restaurant',
        slug: 'dinesmart-res-' + Date.now(),
        status: 'ACTIVE',
        plan: 'PREMIUM',
        isActive: true,
      }
    });
  }

  // 2. Ensure User exists
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash: hash, restaurantId: restaurant.id },
    create: {
      email: email.toLowerCase(),
      passwordHash: hash,
      restaurantId: restaurant.id,
      role: 'OWNER',
    }
  });

  // 3. Create Categories
  const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  const catMap = {};
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i];
    const cat = await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name } },
      update: { sortOrder: i + 1 },
      create: { restaurantId: restaurant.id, name, sortOrder: i + 1 }
    });
    catMap[name] = cat.id;
  }

  // 4. Add Items
  const items = [
    { cat: 'Starters', name: 'Paneer Tikka', price: 280, veg: true },
    { cat: 'Starters', name: 'Chicken 65', price: 320, veg: false },
    { cat: 'Main Course', name: 'Butter Chicken', price: 380, veg: false },
    { cat: 'Main Course', name: 'Dal Makhani', price: 260, veg: true },
    { cat: 'Desserts', name: 'Gulab Jamun', price: 120, veg: true },
    { cat: 'Beverages', name: 'Cold Coffee', price: 150, veg: true }
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: item.name } },
      update: { price: item.price, isVeg: item.veg, categoryId: catMap[item.cat] },
      create: {
        restaurantId: restaurant.id,
        categoryId: catMap[item.cat],
        name: item.name,
        price: item.price,
        isVeg: item.veg,
        preparationTimeMinutes: 15
      }
    });
  }

  console.log('✅ Setup successful');
}

main().catch(console.error).finally(() => prisma.$disconnect());
