
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'SUBHRAKANTABEHERA691@GMAIL.COM';
  
  // Find User
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { restaurant: true }
  });

  if (!user) {
    console.log('User not found by email:', email);
    // Check if SuperAdmin?
    const superAdmin = await prisma.superAdmin.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (superAdmin) {
      console.log('User is a SuperAdmin. SuperAdmins don\'t have restaurants directly.');
    }
    return;
  }

  const restaurant = user.restaurant;
  console.log('Found Restaurant:', restaurant.name, '(', restaurant.id, ')');

  // Categories
  const categories = [
    { name: 'Starters', sortOrder: 1 },
    { name: 'Main Course', sortOrder: 2 },
    { name: 'Biryani & Rice', sortOrder: 3 },
    { name: 'Breads', sortOrder: 4 },
    { name: 'Desserts', sortOrder: 5 },
    { name: 'Beverages', sortOrder: 6 }
  ];

  for (const catData of categories) {
    const category = await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: catData.name } },
      update: { sortOrder: catData.sortOrder },
      create: { ...catData, restaurantId: restaurant.id }
    });

    // Add items for each category
    if (catData.name === 'Starters') {
      await addItem(restaurant.id, category.id, 'Paneer Tikka', 'Classic marinated cottage cheese cubes grilled to perfection.', 280, true);
      await addItem(restaurant.id, category.id, 'Chicken 65', 'Spicy deep-fried chicken tempered with curry leaves.', 320, false);
      await addItem(restaurant.id, category.id, 'Crispy Corn', 'Corn kernels tossed with onions and spices.', 220, true);
    } else if (catData.name === 'Main Course') {
      await addItem(restaurant.id, category.id, 'Butter Chicken', 'Tender chicken in a rich, creamy tomato gravy.', 380, false);
      await addItem(restaurant.id, category.id, 'Dal Makhani', 'Slow-cooked black lentils with cream and butter.', 260, true);
      await addItem(restaurant.id, category.id, 'Paneer Butter Masala', 'Soft paneer cubes in a spicy tomato-butter sauce.', 340, true);
    } else if (catData.name === 'Biryani & Rice') {
      await addItem(restaurant.id, category.id, 'Hyderabadi Chicken Biryani', 'Aromatic basmati rice cooked with chicken and spices.', 350, false);
      await addItem(restaurant.id, category.id, 'Veg Dum Biryani', 'Garden fresh vegetables layered with flavored rice.', 300, true);
    } else if (catData.name === 'Desserts') {
      await addItem(restaurant.id, category.id, 'Gulab Jamun', 'Warm milk dumplings soaked in sugar syrup.', 120, true);
      await addItem(restaurant.id, category.id, 'Chocolate Brownie', 'Sizzling brownie with vanilla ice cream.', 180, true);
    }
  }

  console.log('Menu added successfully for', restaurant.name);
}

async function addItem(restaurantId: string, categoryId: string, name: string, description: string, price: number, isVeg: boolean) {
  await prisma.menuItem.upsert({
    where: { restaurantId_name: { restaurantId, name } },
    update: { description, price, isVeg, categoryId },
    create: {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      isVeg,
      preparationTimeMinutes: 20
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
