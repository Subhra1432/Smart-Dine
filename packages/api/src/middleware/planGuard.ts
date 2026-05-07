// ═══════════════════════════════════════════
// DineSmart OS — Plan Guard Middleware
// ═══════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { PLAN_LIMITS } from '@dinesmart/shared';
import type { Plan } from '@dinesmart/shared';

type PlanFeature = 'aiRecommendations' | 'aiDemandForecast' | 'aiSmartPricing' | 'inventory' | 'analytics' | 'whiteLabel';

export function requirePlanFeature(feature: PlanFeature) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.user.restaurantId },
      select: { plan: true, planExpiresAt: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      res.status(403).json({ success: false, error: 'Restaurant is suspended' });
      return;
    }

    if (restaurant.planExpiresAt && new Date(restaurant.planExpiresAt) < new Date()) {
      res.status(403).json({
        success: false,
        error: 'PLAN_EXPIRED',
        upgradeUrl: '/billing',
      } as Record<string, unknown>);
      return;
    }

    const plan = restaurant.plan as Plan;
    const limits = PLAN_LIMITS[plan];

    if (!limits[feature]) {
      res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_EXCEEDED',
        upgradeUrl: '/billing',
      } as Record<string, unknown>);
      return;
    }

    next();
  };
}

export function requireBranchLimit() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.user.restaurantId },
      select: { plan: true, _count: { select: { branches: true } } },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const plan = restaurant.plan as Plan;
    const limits = PLAN_LIMITS[plan];

    if (limits.maxBranches !== -1 && restaurant._count.branches >= limits.maxBranches) {
      res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_EXCEEDED',
        upgradeUrl: '/billing',
      } as Record<string, unknown>);
      return;
    }

    next();
  };
}

export function requireTableLimit() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.user.restaurantId },
      select: { plan: true, _count: { select: { tables: true } } },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const plan = restaurant.plan as Plan;
    const limits = PLAN_LIMITS[plan];

    if (limits.maxTables !== -1 && restaurant._count.tables >= limits.maxTables) {
      res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_EXCEEDED',
        upgradeUrl: '/billing',
      } as Record<string, unknown>);
      return;
    }

    next();
  };
}
export function requireCouponLimit() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.user.restaurantId },
      select: { plan: true, _count: { select: { coupons: true } } },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const plan = restaurant.plan as Plan;
    const limits = PLAN_LIMITS[plan];

    if (limits.maxCoupons !== -1 && restaurant._count.coupons >= limits.maxCoupons) {
      res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_EXCEEDED',
        message: `Plan limit reached: ${limits.maxCoupons} coupons. Upgrade to Premium for more.`,
        upgradeUrl: '/billing',
      } as Record<string, unknown>);
      return;
    }

    next();
  };
}
