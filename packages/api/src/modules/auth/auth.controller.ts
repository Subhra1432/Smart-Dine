// ═══════════════════════════════════════════
// DineSmart OS — Auth Controller
// ═══════════════════════════════════════════

import type { Request, Response } from 'express';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@dinesmart/shared';
import * as authService from './auth.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await authService.registerRestaurant(data);

  if (result.tokens) {
    res.cookie('accessToken', result.tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  res.status(201).json({
    success: true,
    data: { user: result.user, restaurant: result.restaurant },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);

  res.cookie('accessToken', result.tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', result.tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { user: result.user, restaurant: result.restaurant },
  });
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken as string;
  if (!refreshToken) {
    res.status(401).json({ success: false, error: 'Refresh token required' });
    return;
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.cookie('accessToken', result.tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', result.tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: { message: 'Token refreshed' } });
}

export async function logout(req: Request, res: Response) {
  if (req.user) {
    await authService.logout(req.user.userId);
  }

  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  res.json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(email);
  res.json({ success: true, data: result });
}

export async function resetPassword(req: Request, res: Response) {
  const token = req.params['token'];
  if (!token) {
    res.status(400).json({ success: false, error: 'Token is required' });
    return;
  }
  const { password } = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(token, password);
  res.json({ success: true, data: result });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user?.userId) {
    throw new Error('Invalid session');
  }

  const [user, restaurant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, restaurantId: true, branchId: true, isActive: true }
    }),
    req.user.restaurantId ? prisma.restaurant.findUnique({
      where: { id: req.user.restaurantId },
      select: { id: true, name: true, slug: true, plan: true, notificationSoundUrl: true }
    }) : null
  ]);

  if (!user || !user.isActive) {
    throw new Error('User no longer exists or is inactive');
  }

  res.json({ success: true, data: { user, restaurant } });
}

export async function superAdminLogin(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.superAdminLogin(email, password) as any;

  if (result.token) {
    res.cookie('superAdminToken', result.token, {
      ...COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000,
    });
  }

  res.json({ success: true, data: result });
}

export async function superAdminGoogleLogin(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) throw new Error('Google token is required');

  const result = await authService.superAdminGoogleLogin(token) as any;

  if (result.token) {
    res.cookie('superAdminToken', result.token, {
      ...COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000,
    });
  }

  res.json({ success: true, data: result });
}

export async function getSuperAdminMe(req: Request, res: Response) {
  if (!req.superAdmin?.superAdminId) {
    throw new Error('Invalid superadmin session');
  }

  const admin = await prisma.superAdmin.findUnique({
    where: { id: req.superAdmin.superAdminId },
    select: { id: true, email: true }
  });

  if (!admin) {
    throw new Error('SuperAdmin no longer exists');
  }

  res.json({ success: true, data: { admin } });
}

export async function setupSuperAdmin2FA(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) throw new Error('Token is required');

  // Verify the temp token first
  const jwtModule = await import('jsonwebtoken');
  const jsonwebtoken = (jwtModule as any).default || jwtModule;
  const decoded = jsonwebtoken.verify(token, String(env.JWT_SUPERADMIN_SECRET)) as any;
  
  const admin = await prisma.superAdmin.findUnique({
    where: { id: decoded.superAdminId }
  });

  if (!admin) throw new Error('Admin not found');

  const result = await authService.generateSuperAdmin2FASecret(admin.id);
  res.json({ success: true, data: result });
}

export async function verifySuperAdmin2FA(req: Request, res: Response) {
  logger.info('📩 [Controller] Received 2FA verification request');
  const { token, code, isSetup } = req.body;
  
  if (!token || !code) {
    logger.warn('⚠️ Missing token or code in 2FA request');
    throw new Error('Token and code are required');
  }

  logger.info('⚙️ [Controller] Calling authService.verifySuperAdmin2FA...');
  const result = await authService.verifySuperAdmin2FA(token, code, !!isSetup) as any;
  logger.info('✅ [Controller] authService returned success');

  res.cookie('superAdminToken', result.token, {
    ...COOKIE_OPTIONS,
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: { admin: result.admin, token: result.token } });
}
