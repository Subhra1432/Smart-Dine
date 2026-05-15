
import { PrismaClient, Plan, RestaurantStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 FORCING RESTAURANT RENAME AND GLOBAL USER LINKAGE...');

  // 1. Get ALL restaurants
  const allRestaurants = await prisma.restaurant.findMany();
  
  if (allRestaurants.length === 0) {
    console.log('No restaurants found. Creating RAMAIAH...');
    const r = await prisma.restaurant.create({
      data: {
        name: 'RAMAIAH',
        slug: 'ramaiah-' + Math.random().toString(36).substring(7),
        status: RestaurantStatus.ACTIVE,
        plan: Plan.PREMIUM,
        isActive: true,
      }
    });
    allRestaurants.push(r);
  }

  const primaryRestaurantId = allRestaurants[0]!.id;

  // 2. Link EVERY user to this restaurant
  console.log(`Linking ALL users to primary restaurant ID: ${primaryRestaurantId}`);
  await prisma.user.updateMany({
    data: { restaurantId: primaryRestaurantId }
  });

  for (const restaurant of allRestaurants) {
    console.log(`Processing Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
    
    // RENAME IT TO RAMAIAH
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { 
        name: 'RAMAIAH', 
        status: RestaurantStatus.ACTIVE, 
        isActive: true 
      }
    });

    // 3. Create a Branch
    await prisma.branch.upsert({
      where: { id: (await prisma.branch.findFirst({ where: { restaurantId: restaurant.id } }))?.id || 'new-branch' },
      update: { name: 'RAMAIAH Main Branch' },
      create: {
        restaurantId: restaurant.id,
        name: 'RAMAIAH Main Branch',
        address: 'Bhubaneswar, Odisha',
        phone: '+918658809082',
      }
    });

    // 4. Add Menu Items
    const menuData = [
      {
        category: 'Starters',
        items: [
          { name: 'Crispy Chilli Baby Corn', price: 210, isVeg: true, desc: 'Tender baby corn fried and tossed in spicy chilli sauce.' },
          { name: 'Chicken Lollipop', price: 280, isVeg: false, desc: 'Classic chicken drumettes fried to perfection.' }
        ]
      },
      {
        category: 'Main Course',
        items: [
          { name: 'Mutton Rogan Josh', price: 450, isVeg: false, desc: 'Traditional Kashmiri style slow-cooked mutton.' },
          { name: 'Kadai Paneer', price: 320, isVeg: true, desc: 'Cottage cheese cubes with bell peppers in a spicy gravy.' }
        ]
      },
      {
        category: 'Biryani',
        items: [
          { name: 'Mutton Dum Biryani', price: 420, isVeg: false, desc: 'Aromatic basmati rice cooked with mutton and spices.' }
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
    console.log(`✅ Success for ${restaurant.id}`);
  }
}

main().finally(() => prisma.$disconnect());
