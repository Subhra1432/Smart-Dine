// ═══════════════════════════════════════════
// DineSmart OS — Super Admin Module
// ═══════════════════════════════════════════

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { asyncHandler, authenticateSuperAdmin } from '../../middleware/index.js';
import { updatePlanSchema, paginationSchema } from '@dinesmart/shared';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const router = Router();
router.use(authenticateSuperAdmin);

// Get all restaurants
router.get('/restaurants', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query);

  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      include: {
        _count: { select: { orders: true, branches: true, users: true } },
        users: { where: { role: 'OWNER' }, select: { name: true, email: true }, take: 1 },
        branches: { select: { phone: true }, take: 1 },
        subscriptionPayments: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.restaurant.count(),
  ]);

  // Calculate monthly revenue for each restaurant
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const revenues = await prisma.order.groupBy({
    by: ['restaurantId'],
    where: { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
    _sum: { total: true },
  });
  const revenueMap = new Map(revenues.map((r) => [r.restaurantId, r._sum.total || 0]));

  const enriched = items.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    status: r.status,
    address: r.address,
    panCard: r.panCard,
    panCardUrl: (r as any).panCardUrl,
    gstBill: r.gstBill,
    gstBillUrl: (r as any).gstBillUrl,
    registrationCertUrl: (r as any).registrationCertUrl,
    bannerText: r.bannerText,
    bannerImageUrl: r.bannerImageUrl,
    plan: r.plan,
    planExpiresAt: r.planExpiresAt,
    isActive: r.isActive,
    createdAt: r.createdAt,
    _count: r._count,
    monthlyRevenue: revenueMap.get(r.id) || 0,
    ownerName: r.users[0]?.name || r.users[0]?.email || 'N/A',
    phone: r.branches[0]?.phone || 'N/A',
    hasPaid: r.subscriptionPayments[0]?.status === 'COMPLETED'
  }));

  res.json({
    success: true,
    data: { items: enriched, page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

// Create new restaurant
router.post('/restaurants', asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, ownerEmail, ownerPassword } = req.body;
  if (!name || !slug || !ownerEmail || !ownerPassword) {
    throw new AppError(400, 'Name, slug, ownerEmail, and ownerPassword are required');
  }

  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) throw new AppError(400, 'Restaurant slug already exists');

  const bcrypt = await import('bcryptjs').catch(() => null);
  const hash = bcrypt ? await bcrypt.hash(ownerPassword, 10) : ownerPassword;

  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: { name, slug, plan: 'STARTER' }
    });

    const branch = await tx.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Main Branch',
        address: 'HQ',
        phone: '0000000000',
      }
    });

    const owner = await tx.user.create({
      data: {
        restaurantId: restaurant.id,
        branchId: branch.id,
        email: ownerEmail,
        passwordHash: hash,
        role: 'OWNER',
      }
    });

    return { restaurant, branch, owner };
  });

  res.status(201).json({ success: true, data: result.restaurant });
}));

// Update restaurant plan
router.put('/restaurants/:id/plan', asyncHandler(async (req: Request, res: Response) => {
  const { plan, planExpiresAt } = updatePlanSchema.parse(req.body);
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params['id']! } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  const updated = await prisma.restaurant.update({
    where: { id: req.params['id']! },
    data: {
      plan,
      planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ success: true, data: updated });
}));

// Suspend/unsuspend restaurant
router.put('/restaurants/:id/suspend', asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params['id']! } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  const updated = await prisma.restaurant.update({
    where: { id: req.params['id']! },
    data: { isActive: !restaurant.isActive },
  });

  res.json({
    success: true,
    data: { ...updated, action: updated.isActive ? 'unsuspended' : 'suspended' },
  });
}));

// Update restaurant details
router.put('/restaurants/:id', asyncHandler(async (req: Request, res: Response) => {
  const { name, notificationSoundUrl } = req.body;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params['id']! } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  const updated = await prisma.restaurant.update({
    where: { id: req.params['id']! },
    data: {
      name: name || restaurant.name,
      notificationSoundUrl
    },
  });

  res.json({ success: true, data: updated });
}));

// Platform stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalRestaurants, activeRestaurants, totalOrdersToday, monthlyRevenue] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
      _sum: { total: true },
    }),
  ]);

  // Calculate MRR from active plans
  const planCounts = await prisma.restaurant.groupBy({
    by: ['plan'],
    where: { isActive: true },
    _count: true,
  });

  const planPrices: Record<string, number> = {
    STARTER: 999,
    GROWTH: 1999,
    PREMIUM: 3999
  };
  const mrr = planCounts.reduce((sum, p) => sum + (planPrices[p.plan] || 0) * p._count, 0);

  const churnRate = totalRestaurants > 0
    ? ((totalRestaurants - activeRestaurants) / totalRestaurants * 100).toFixed(1)
    : '0';

  res.json({
    success: true,
    data: {
      mrr,
      totalRestaurants,
      activeRestaurants,
      totalOrdersToday,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      churnRate: parseFloat(churnRate),
    },
  });
}));

// Approve restaurant
router.put('/restaurants/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params['id']! } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  const updated = await prisma.restaurant.update({
    where: { id: req.params['id']! },
    data: {
      status: 'ACTIVE',
      isActive: true,
      // Wipe documents after verification as requested
      panCardUrl: null,
      gstBillUrl: null,
      registrationCertUrl: null
    },
  });

  res.json({
    success: true,
    data: updated,
  });
}));

// Delete restaurant
router.delete('/restaurants/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  await prisma.restaurant.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Restaurant and all associated data deleted successfully',
  });
}));

// Impersonate restaurant
router.post('/restaurants/:id/impersonate', asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params['id']! } });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  const owner = await prisma.user.findFirst({
    where: { restaurantId: restaurant.id, role: 'OWNER' },
  });
  if (!owner) throw new AppError(404, 'Restaurant owner not found');

  const impersonateToken = jwt.sign(
    {
      userId: owner.id,
      restaurantId: restaurant.id,
      role: 'OWNER',
      branchId: null,
      impersonatedBy: req.superAdmin!.superAdminId,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ success: true, data: { token: impersonateToken, restaurant } });
}));

export default router;
