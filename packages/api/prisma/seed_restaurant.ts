
import { PrismaClient, Plan, RestaurantStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'subhrakantabehera691@gmail.com';
  const password = 'Subhra@1432';
  
  console.log('🚀 Starting custom menu setup for:', email);

  // 1. Find or Create Restaurant
  let restaurant = await prisma.restaurant.findFirst({
    where: { users: { some: { email } } }
  });

  if (!restaurant) {
    console.log('Creating new restaurant for user...');
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'DineSmart Premium Cafe',
        slug: 'dinesmart-premium-' + Math.random().toString(36).substring(7),
        status: RestaurantStatus.ACTIVE,
        plan: Plan.PREMIUM,
        isActive: true,
      }
    });
  }

  // 2. Find or Create User
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, restaurantId: restaurant.id },
    create: {
      email,
      passwordHash: hash,
      restaurantId: restaurant.id,
      role: Role.OWNER,
    }
  });

  // 3. Create a Branch if none exists
  let branch = await prisma.branch.findFirst({ where: { restaurantId: restaurant.id } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Main Branch',
        address: 'Bhubaneswar, Odisha',
        phone: '+918658809082',
      }
    });
  }

  // 4. Add Categories and Items
  const menuData = [
    {
      category: 'Starters',
      items: [
        { name: 'Crispy Chilli Baby Corn', price: 210, isVeg: true, desc: 'Tender baby corn fried and tossed in spicy chilli sauce.' },
        { name: 'Chicken Lollipop', price: 280, isVeg: false, desc: 'Classic chicken drumettes fried to perfection.' },
        { name: 'Mushroom Salt & Pepper', price: 230, isVeg: true, desc: 'Button mushrooms tossed with garlic and black pepper.' }
      ]
    },
    {
      category: 'Main Course',
      items: [
        { name: 'Mutton Rogan Josh', price: 450, isVeg: false, desc: 'Traditional Kashmiri style slow-cooked mutton.' },
        { name: 'Kadai Paneer', price: 320, isVeg: true, desc: 'Cottage cheese cubes with bell peppers in a spicy gravy.' },
        { name: 'Chicken Tikka Masala', price: 380, isVeg: false, desc: 'Grilled chicken in a rich, creamy tomato sauce.' }
      ]
    },
    {
      category: 'Biryani',
      items: [
        { name: 'Mutton Dum Biryani', price: 420, isVeg: false, desc: 'Aromatic basmati rice cooked with mutton and spices.' },
        { name: 'Veg Pulao', price: 180, isVeg: true, desc: 'Fragrant rice with garden fresh vegetables.' }
      ]
    },
    {
      category: 'Beverages',
      items: [
        { name: 'Cold Coffee with Ice Cream', price: 150, isVeg: true, desc: 'Creamy cold coffee topped with vanilla ice cream.' },
        { name: 'Fresh Lime Soda', price: 80, isVeg: true, desc: 'Refreshing lime drink with soda.' }
      ]
    }
  ];

  for (let i = 0; i < menuData.length; i++) {
    const group = menuData[i]!;
    const category = await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: group.category } },
      update: { sortOrder: i + 1 },
      create: { restaurantId: restaurant.id, name: group.category, sortOrder: i + 1 }
    });

    for (const item of group.items) {
      await prisma.menuItem.upsert({
        where: { restaurantId_name: { restaurantId: restaurant.id, name: item.name } },
        update: {
          price: item.price,
          description: item.desc,
          isVeg: item.isVeg,
          categoryId: category.id
        },
        create: {
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: item.name,
          price: item.price,
          description: item.desc,
          isVeg: item.isVeg,
          preparationTimeMinutes: 20
        }
      });
    }
  }

  console.log('✅ Menu setup complete for restaurant:', restaurant.name);
  console.log('   User:', user.email);
}

main().finally(() => prisma.$disconnect());
