// ═══════════════════════════════════════════
// DineSmart OS — Database Seed
// ═══════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Seeding database...');

  // Safety Check: On Render Free Tier, the app restarts frequently.
  // We only want to wipe the DB if it's currently empty, or if you explicitly ask for a RESET.
  const adminCount = await prisma.superAdmin.count();
  const shouldReset = process.env.RESET_DB === 'true' || adminCount === 0;

  if (shouldReset) {
    console.log('⚠️ RESET_DB = true or empty DB detected. Cleaning existing data...');
    await prisma.$transaction([
      prisma.stockHistory.deleteMany(),
      prisma.menuItemInventory.deleteMany(),
      prisma.menuItemAddon.deleteMany(),
      prisma.menuItemVariant.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.review.deleteMany(),
      prisma.order.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.loyaltyAccount.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.coupon.deleteMany(),
      prisma.inventoryItem.deleteMany(),
      prisma.addon.deleteMany(),
      prisma.menuItem.deleteMany(),
      prisma.category.deleteMany(),
      prisma.table.deleteMany(),
      prisma.user.deleteMany(),
      prisma.branch.deleteMany(),
      prisma.restaurant.deleteMany(),
      prisma.superAdmin.deleteMany(),
    ]);
  } else {
    console.log('ℹ️ Database already contains data. Skipping cleanup. (Set RESET_DB=true to force cleanup)');
  }

  // Create Super Admins
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
  }
  console.log('✅ Super Admins seeded');

  // ── CUSTOM RESTAURANT SETUP FOR USER ───────────────────────────
  const userEmail = 'subhrakantabehera691@gmail.com';
  const userPass = 'Subhra@1432';

  let customRestaurant = await prisma.restaurant.findUnique({ where: { slug: 'dinesmart-premium' } });
  if (!customRestaurant) {
    customRestaurant = await prisma.restaurant.create({
      data: {
        name: 'DineSmart Premium Restaurant',
        slug: 'dinesmart-premium',
        status: 'ACTIVE',
        plan: 'PREMIUM',
        isActive: true,
      },
    });
  }

  const customBranch = await prisma.branch.upsert({
    where: { id: 'custom-branch-id' }, // We'll just use a stable ID or find it
    update: {},
    create: {
      id: 'custom-branch-id',
      restaurantId: customRestaurant.id,
      name: 'DineSmart Main Branch',
      address: 'Bhubaneswar, Odisha',
      phone: '+918658809082',
    },
  });

  const userHash = await bcrypt.hash(userPass, 12);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: { passwordHash: userHash, restaurantId: customRestaurant.id, role: 'OWNER' },
    create: {
      email: userEmail,
      passwordHash: userHash,
      restaurantId: customRestaurant.id,
      role: 'OWNER',
    },
  });

  // Categories and Items for Custom Restaurant
  const customCategoriesData = [
    { name: 'Starters', sortOrder: 1, items: [
      { name: 'Crispy Baby Corn', price: 210, isVeg: true, desc: 'Golden fried baby corn in spicy sauce' },
      { name: 'Chicken 65', price: 280, isVeg: false, desc: 'Classic spicy fried chicken' }
    ]},
    { name: 'Main Course', sortOrder: 2, items: [
      { name: 'Butter Paneer', price: 320, isVeg: true, desc: 'Paneer cubes in creamy tomato gravy' },
      { name: 'Mutton Rogan Josh', price: 450, isVeg: false, desc: 'Aromatic mutton curry' }
    ]},
    { name: 'Biryani', sortOrder: 3, items: [
      { name: 'Chicken Dum Biryani', price: 350, isVeg: false, desc: 'Authentic Hyderabadi biryani' }
    ]},
    { name: 'Beverages', sortOrder: 4, items: [
      { name: 'Cold Coffee', price: 120, isVeg: true, desc: 'Rich and creamy cold coffee' }
    ]}
  ];

  for (const catData of customCategoriesData) {
    const category = await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId: customRestaurant.id, name: catData.name } },
      update: { sortOrder: catData.sortOrder },
      create: { restaurantId: customRestaurant.id, name: catData.name, sortOrder: catData.sortOrder }
    });

    for (const item of catData.items) {
      await prisma.menuItem.upsert({
        where: { restaurantId_name: { restaurantId: customRestaurant.id, name: item.name } },
        update: { price: item.price, description: item.desc, isVeg: item.isVeg, categoryId: category.id },
        create: {
          restaurantId: customRestaurant.id,
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
  console.log('✅ Custom Restaurant and Menu seeded for', userEmail);

  // ── DEMO RESTAURANT SETUP ─────────────────────────────────────
  // (Keep the existing demo setup but maybe wrap in a check or just let it run)
  
  // Create Demo Restaurant
  const demoSlug = 'spice-garden';
  let restaurant = await prisma.restaurant.findUnique({ where: { slug: demoSlug } });
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Spice Garden',
        slug: demoSlug,
        status: 'ACTIVE',
        plan: 'PREMIUM',
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  }

  // Rest of the existing seed logic...
  // (I will truncate the rest for brevity in the tool call, but I'll ensure it stays consistent)

  // Create 3 Branches
  const branches = await Promise.all([
    prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Spice Garden - Downtown',
        address: '123 Main Street, Bangalore 560001',
        phone: '+919876543210',
        timezone: 'Asia/Kolkata',
      },
    }),
    prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Spice Garden - Koramangala',
        address: '456 80 Feet Road, Koramangala, Bangalore 560034',
        phone: '+919876543211',
        timezone: 'Asia/Kolkata',
      },
    }),
    prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Spice Garden - Indiranagar',
        address: '789 12th Main, Indiranagar, Bangalore 560038',
        phone: '+919876543212',
        timezone: 'Asia/Kolkata',
      },
    }),
  ]);

  console.log(`✅ 3 Branches created`);

  // Create Users
  const ownerHash = await bcrypt.hash('owner123', 12);
  const managerHash = await bcrypt.hash('manager123', 12);
  const cashierHash = await bcrypt.hash('cashier123', 12);
  const kitchenHash = await bcrypt.hash('kitchen123', 12);

  await Promise.all([
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: 'owner@spicegarden.com',
        passwordHash: ownerHash,
        role: 'OWNER',
      },
    }),
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: 'manager@spicegarden.com',
        passwordHash: managerHash,
        role: 'MANAGER',
        branchId: branches[0]!.id,
      },
    }),
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: 'cashier@spicegarden.com',
        passwordHash: cashierHash,
        role: 'CASHIER',
        branchId: branches[0]!.id,
      },
    }),
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: 'kitchen@spicegarden.com',
        passwordHash: kitchenHash,
        role: 'KITCHEN_STAFF',
        branchId: branches[0]!.id,
      },
    }),
  ]);

  console.log('✅ Users created:');
  console.log('   Owner: owner@spicegarden.com / owner123');
  console.log('   Manager: manager@spicegarden.com / manager123');
  console.log('   Cashier: cashier@spicegarden.com / cashier123');
  console.log('   Kitchen: kitchen@spicegarden.com / kitchen123');

  // Create 10 Tables (spread across branches)
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const branchIndex = i <= 4 ? 0 : i <= 7 ? 1 : 2;
    const table = await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        branchId: branches[branchIndex]!.id,
        number: i,
        capacity: i <= 3 ? 2 : i <= 7 ? 4 : 6,
        qrCodeUrl: `http://localhost:5173/menu?restaurant=spice-garden&table=TABLE_ID`,
      },
    });
    tables.push(table);
  }

  // Update QR URLs with actual IDs
  for (const table of tables) {
    await prisma.table.update({
      where: { id: table.id },
      data: { qrCodeUrl: `http://localhost:5173/menu?restaurant=spice-garden&table=${table.id}` },
    });
  }

  console.log(`✅ 10 Tables created`);

  // Create 5 Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { restaurantId: restaurant.id, name: 'Starters', sortOrder: 1 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: 'Main Course', sortOrder: 2 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: 'Breads', sortOrder: 3 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: 'Beverages', sortOrder: 4 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: 'Desserts', sortOrder: 5 } }),
  ]);

  console.log(`✅ 5 Categories created`);

  // Create Addons
  const addons = await Promise.all([
    prisma.addon.create({ data: { restaurantId: restaurant.id, name: 'Extra Cheese', price: 30 } }),
    prisma.addon.create({ data: { restaurantId: restaurant.id, name: 'Extra Spicy', price: 0 } }),
    prisma.addon.create({ data: { restaurantId: restaurant.id, name: 'Extra Butter', price: 20 } }),
    prisma.addon.create({ data: { restaurantId: restaurant.id, name: 'Raita', price: 40 } }),
    prisma.addon.create({ data: { restaurantId: restaurant.id, name: 'Papad', price: 25 } }),
  ]);

  // Create 20 Menu Items
  const menuItemsData = [
    // Starters (4 items)
    { categoryId: categories[0]!.id, name: 'Paneer Tikka', price: 249, isVeg: true, prepTime: 15, tags: ['bestseller', 'spicy'], desc: 'Marinated cottage cheese grilled in tandoor with bell peppers' },
    { categoryId: categories[0]!.id, name: 'Chicken 65', price: 279, isVeg: false, prepTime: 12, tags: ['spicy', 'crispy'], desc: 'Deep fried chicken marinated in red chili and spices' },
    { categoryId: categories[0]!.id, name: 'Hara Bhara Kebab', price: 199, isVeg: true, prepTime: 10, tags: ['healthy'], desc: 'Green peas and spinach kebabs served with mint chutney' },
    { categoryId: categories[0]!.id, name: 'Tandoori Wings', price: 299, isVeg: false, prepTime: 18, tags: ['grilled'], desc: 'Smoky grilled chicken wings with tandoori masala' },
    // Main Course (6 items)
    { categoryId: categories[1]!.id, name: 'Butter Chicken', price: 349, isVeg: false, prepTime: 20, tags: ['bestseller', 'creamy'], desc: 'Tender chicken in rich tomato-butter gravy' },
    { categoryId: categories[1]!.id, name: 'Dal Makhani', price: 249, isVeg: true, prepTime: 25, tags: ['bestseller', 'creamy'], desc: 'Black lentils slow-cooked overnight with butter and cream' },
    { categoryId: categories[1]!.id, name: 'Paneer Butter Masala', price: 299, isVeg: true, prepTime: 18, tags: ['creamy'], desc: 'Soft paneer cubes in velvety tomato gravy' },
    { categoryId: categories[1]!.id, name: 'Chicken Biryani', price: 379, isVeg: false, prepTime: 30, tags: ['bestseller', 'aromatic'], desc: 'Fragrant basmati rice layered with spiced chicken' },
    { categoryId: categories[1]!.id, name: 'Veg Biryani', price: 299, isVeg: true, prepTime: 25, tags: ['aromatic'], desc: 'Aromatic basmati rice with mixed vegetables and saffron' },
    { categoryId: categories[1]!.id, name: 'Fish Curry', price: 399, isVeg: false, prepTime: 22, tags: ['coastal'], desc: 'Fresh fish in coconut-based coastal curry' },
    // Breads (4 items)
    { categoryId: categories[2]!.id, name: 'Butter Naan', price: 59, isVeg: true, prepTime: 5, tags: [], desc: 'Soft leavened bread brushed with butter' },
    { categoryId: categories[2]!.id, name: 'Garlic Naan', price: 69, isVeg: true, prepTime: 5, tags: ['garlic'], desc: 'Naan topped with garlic and coriander' },
    { categoryId: categories[2]!.id, name: 'Tandoori Roti', price: 39, isVeg: true, prepTime: 5, tags: ['healthy'], desc: 'Whole wheat bread baked in tandoor' },
    { categoryId: categories[2]!.id, name: 'Cheese Naan', price: 89, isVeg: true, prepTime: 7, tags: ['cheesy'], desc: 'Naan stuffed with melted mozzarella' },
    // Beverages (3 items)
    { categoryId: categories[3]!.id, name: 'Mango Lassi', price: 129, isVeg: true, prepTime: 3, tags: ['refreshing'], desc: 'Creamy mango yogurt drink' },
    { categoryId: categories[3]!.id, name: 'Masala Chai', price: 49, isVeg: true, prepTime: 5, tags: ['hot'], desc: 'Traditional Indian spiced tea' },
    { categoryId: categories[3]!.id, name: 'Fresh Lime Soda', price: 79, isVeg: true, prepTime: 2, tags: ['refreshing'], desc: 'Tangy lime with soda water' },
    // Desserts (3 items)
    { categoryId: categories[4]!.id, name: 'Gulab Jamun', price: 99, isVeg: true, prepTime: 5, tags: ['sweet'], desc: 'Deep-fried milk dumplings in rose-flavored syrup' },
    { categoryId: categories[4]!.id, name: 'Rasmalai', price: 129, isVeg: true, prepTime: 5, tags: ['sweet', 'creamy'], desc: 'Soft paneer balls soaked in sweetened saffron milk' },
    { categoryId: categories[4]!.id, name: 'Kulfi', price: 89, isVeg: true, prepTime: 2, tags: ['frozen'], desc: 'Traditional Indian ice cream with pistachios' },
  ];

  const createdItems = [];
  for (let i = 0; i < menuItemsData.length; i++) {
    const data = menuItemsData[i]!;
    const item = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: data.categoryId,
        name: data.name,
        description: data.desc,
        price: data.price,
        isVeg: data.isVeg,
        preparationTimeMinutes: data.prepTime,
        tags: data.tags,
        sortOrder: i,
        orderCount: Math.floor(Math.random() * 100),
      },
    });
    createdItems.push(item);
  }

  // Create variants for Biryani and some items
  const biryani = createdItems.find(i => i.name === 'Chicken Biryani');
  if (biryani) {
    await prisma.menuItemVariant.createMany({
      data: [
        { menuItemId: biryani.id, name: 'Half', additionalPrice: -100 },
        { menuItemId: biryani.id, name: 'Full', additionalPrice: 0 },
        { menuItemId: biryani.id, name: 'Family Pack', additionalPrice: 200 },
      ],
    });
  }

  const paneerTikka = createdItems.find(i => i.name === 'Paneer Tikka');
  if (paneerTikka) {
    await prisma.menuItemVariant.createMany({
      data: [
        { menuItemId: paneerTikka.id, name: 'Half', additionalPrice: -50 },
        { menuItemId: paneerTikka.id, name: 'Full', additionalPrice: 0 },
      ],
    });
  }

  // Link addons to menu items
  for (const item of createdItems.slice(0, 10)) {
    await prisma.menuItemAddon.createMany({
      data: [
        { menuItemId: item.id, addonId: addons[1]!.id }, // Extra Spicy
        { menuItemId: item.id, addonId: addons[3]!.id }, // Raita
      ],
    });
  }

  console.log(`✅ 20 Menu Items created with variants and addons`);

  console.log(`✅ 20 Menu Items created with variants and addons`);

  console.log('');
  console.log('🎉 Database seeded successfully with a clean environment (Menu Only)!');
  console.log('');
  console.log('Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Super Admin:  admin@dinesmart.ai / superadmin123');
  console.log('Owner:        owner@spicegarden.com / owner123');
  console.log('Manager:      manager@spicegarden.com / manager123');
  console.log('Cashier:      cashier@spicegarden.com / cashier123');
  console.log('Kitchen:      kitchen@spicegarden.com / kitchen123');
}

// Only run automatically if this file is executed directly
const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
