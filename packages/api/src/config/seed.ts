import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

const prisma = new PrismaClient();

const SUPERADMIN_CREDENTIALS = [
  { email: 'admin@dinesmart.ai', password: 'superadmin123' },
  { email: 'ankitkar969275@gmail.com', password: 'Ankit@969275' },
  { email: 'subhrakantabehera691@gmail.com', password: 'Subhra@1432' },
];

export async function runDatabaseSeed() {
  try {
    logger.info('🌱 Checking if database needs seeding...');
    
    const adminCount = await prisma.superAdmin.count();
    
    // Seed if DB is empty or RESET_DB is true
    if (process.env.RESET_DB === 'true' || adminCount === 0) {
      logger.info('⚠️ Seeding required. Cleaning existing data...');
      
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
    }

    // Always upsert all SuperAdmin accounts on every startup
    for (const cred of SUPERADMIN_CREDENTIALS) {
      const hash = await bcrypt.hash(cred.password, 10);
      await prisma.superAdmin.upsert({
        where: { email: cred.email },
        update: { passwordHash: hash },
        create: { email: cred.email, passwordHash: hash },
      });
    }

    logger.info('✅ SuperAdmin accounts synced');
    logger.info('🎉 Database seed check complete!');
  } catch (err) {
    logger.error('❌ Database seeding failed', { error: err });
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}
