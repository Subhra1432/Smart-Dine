// ═══════════════════════════════════════════
// DineSmart OS — Auth Service
// ═══════════════════════════════════════════

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { JwtAccessPayload, JwtRefreshPayload } from '@dinesmart/shared';
import { seedDemoMenu } from '../../utils/demoSeeder.js';
const BCRYPT_ROUNDS = 10;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + crypto.randomBytes(3).toString('hex');
}

export async function registerRestaurant(data: {
  email: string;
  password: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  address?: string;
  panCard?: string;
  panCardUrl?: string;
  gstBill?: string;
  gstBillUrl?: string;
  registrationCertUrl?: string;
  plan: 'STARTER' | 'GROWTH' | 'PREMIUM';
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const slug = generateSlug(data.restaurantName);

  const planPricing = {
    STARTER: 999,
    PREMIUM: 2499,
  };

  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: data.restaurantName,
        slug,
        address: data.address,
        panCard: data.panCard,
        panCardUrl: data.panCardUrl,
        gstBill: data.gstBill,
        gstBillUrl: data.gstBillUrl,
        registrationCertUrl: data.registrationCertUrl,
        status: 'PENDING_VERIFICATION',
        plan: data.plan,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial/initial period
      },
    });

    const user = await tx.user.create({
      data: {
        restaurantId: restaurant.id,
        name: data.ownerName,
        email: data.email,
        passwordHash,
        role: 'OWNER',
      },
    });

    // Create a default branch
    const branch = await tx.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Main Branch',
        address: data.address || 'Please update your address',
        phone: data.phone,
      },
    });

    // Record the initial subscription payment
    await tx.subscriptionPayment.create({
      data: {
        restaurantId: restaurant.id,
        plan: data.plan,
        amount: planPricing[data.plan],
        method: 'UPI', // Default for simulation
        status: 'COMPLETED',
      }
    });

    return { restaurant, user, branch };
  });

  logger.info('Restaurant registered with plan', { 
    restaurantId: result.restaurant.id, 
    email: data.email,
    plan: data.plan 
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
    restaurant: {
      id: result.restaurant.id,
      name: result.restaurant.name,
      slug: result.restaurant.slug,
      status: result.restaurant.status,
      notificationSoundUrl: result.restaurant.notificationSoundUrl,
    },
    tokens: null,
  };
}

export async function login(email: string, password: string) {
  let user = await prisma.user.findUnique({
    where: { email },
    include: { restaurant: true },
  });

  // Emergency Auto-Seed: If it's a demo account and user missing or needs sync
  if (email.includes('@spicegarden.com') || email === 'admin@dinesmart.ai') {
    const isDemoPassword = ['superadmin123', 'owner123', 'manager123', 'cashier123', 'kitchen123'].includes(password);
    
    if (!user || (isDemoPassword && !(await bcrypt.compare(password, user.passwordHash)))) {
      logger.warn('⚠️ Demo user missing or password mismatch. Syncing demo credentials...', { email });
      try {
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

        const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              restaurantId: restaurant.id,
              email,
              passwordHash: hash,
              role: email === 'admin@dinesmart.ai' ? 'OWNER' : (email.split('@')[0].toUpperCase() as any),
              isActive: true
            },
            include: { restaurant: true }
          });
          logger.info('✅ Emergency demo user created', { email });
        } else if (isDemoPassword) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hash, isActive: true },
            include: { restaurant: true }
          });
          logger.info('✅ Emergency demo password synced', { email });
        }
        
        // Seed menu items too
        await seedDemoMenu(restaurant.id);

        // Ensure at least one branch and some tables exist
        let branch = await prisma.branch.findFirst({ where: { restaurantId: restaurant.id } });
        if (!branch) {
          branch = await prisma.branch.create({
            data: {
              restaurantId: restaurant.id,
              name: 'Main Branch',
              address: 'Spice Garden, City Center',
              phone: '9876543210',
              isActive: true,
            }
          });
        }

        const tableCount = await prisma.table.count({ where: { branchId: branch.id } });
        if (tableCount === 0) {
          await prisma.table.createMany({
            data: Array.from({ length: 10 }).map((_, i) => ({
              branchId: branch.id,
              restaurantId: restaurant.id,
              number: i + 1,
              capacity: 4,
              status: 'AVAILABLE'
            }))
          });
          logger.info('✅ Default tables created for demo branch');
        }
      } catch (err) {
        logger.error('❌ Emergency auto-seed failed', { email, error: err });
      }
    }
  }

  if (!user) {
    logger.warn('Login failure: User not found', { email });
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    logger.warn('Login failure: User inactive', { email });
    throw new AppError(401, 'Your account has been deactivated');
  }

  if (!user.restaurant.isActive) {
    logger.warn('Login failure: Restaurant inactive', { email });
    throw new AppError(403, 'Restaurant account is suspended');
  }

  if (user.restaurant.status === 'PENDING_VERIFICATION') {
    throw new AppError(403, 'Restaurant is pending verification. Please wait up to 24 hours for approval.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    logger.warn('Login failure: Password mismatch', { email });
    throw new AppError(401, 'Invalid email or password');
  }

  // Downgrade bcrypt rounds to 10 to improve performance (bcryptjs is very slow at 12)
  if (user.passwordHash.includes('$12$')) {
    const optimizedHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: optimizedHash },
    });
    logger.info('Optimized password hash rounds', { userId: user.id });
  }

  const tokens = generateTokens(
    user.id,
    user.restaurantId,
    user.role,
    user.branchId,
    user.tokenVersion
  );

  logger.info('User logged in', { userId: user.id, email });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      branchId: user.branchId,
    },
    restaurant: {
      id: user.restaurant.id,
      name: user.restaurant.name,
      slug: user.restaurant.slug,
      plan: user.restaurant.plan,
      notificationSoundUrl: user.restaurant.notificationSoundUrl,
    },
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const decoded = jwt.verify(refreshToken, String(env.JWT_REFRESH_SECRET)) as JwtRefreshPayload;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { restaurant: true },
  });

  if (!user || !user.isActive || user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const tokens = generateTokens(
    user.id,
    user.restaurantId,
    user.role,
    user.branchId,
    user.tokenVersion
  );

  return { tokens };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether email exists
    return { message: 'If an account exists, a reset link will be sent' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Store in Redis with 1 hour expiry
  const { redis } = await import('../../config/redis.js');
  await redis.set(`reset:${resetTokenHash}`, user.id, 'EX', 3600);

  logger.info('Password reset requested', { userId: user.id, email });

  // In production, send email with resetToken
  return { message: 'If an account exists, a reset link will be sent', resetToken };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { redis } = await import('../../config/redis.js');
  const userId = await redis.get(`reset:${tokenHash}`);

  if (!userId) {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  await redis.del(`reset:${tokenHash}`);

  logger.info('Password reset completed', { userId });

  return { message: 'Password reset successfully' };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

function generateTokens(
  userId: string,
  restaurantId: string,
  role: string,
  branchId: string | null,
  tokenVersion: number
) {
  const accessPayload: JwtAccessPayload = {
    userId,
    restaurantId,
    role: role as JwtAccessPayload['role'],
    branchId,
  };

  const refreshPayload: JwtRefreshPayload = {
    userId,
    tokenVersion,
  };

  const accessToken = jwt.sign(accessPayload, String(env.JWT_ACCESS_SECRET), {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });

  const refreshToken = jwt.sign(refreshPayload, String(env.JWT_REFRESH_SECRET), {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
}

// Super Admin auth
export async function superAdminLogin(email: string, password: string) {
  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { superAdminId: admin.id, scope: 'superadmin' },
    env.JWT_SUPERADMIN_SECRET,
    { expiresIn: '8h' }
  );

  return { token, admin: { id: admin.id, email: admin.email } };
}

export async function superAdminGoogleLogin(googleToken: string) {
  // In a real implementation, you would verify the token with Google
  // For now, we simulate a successful login for the main admin email
  // if the "token" looks like a valid JWT or placeholder
  
  const admin = await prisma.superAdmin.findFirst(); // Just get the first admin for demo
  if (!admin) {
    throw new AppError(401, 'No superadmin account found');
  }

  const token = jwt.sign(
    { superAdminId: admin.id, scope: 'superadmin' },
    env.JWT_SUPERADMIN_SECRET,
    { expiresIn: '8h' }
  );

  return { token, admin: { id: admin.id, email: admin.email } };
}
