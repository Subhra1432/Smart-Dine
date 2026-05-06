// ═══════════════════════════════════════════
// DineSmart OS — Analytics Module
// ═══════════════════════════════════════════

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { asyncHandler, authenticate, requireRole } from '../../middleware/index.js';
import { analyticsQuerySchema } from '@dinesmart/shared';

const router = Router();
router.use(authenticate);
router.use(requireRole(['OWNER', 'MANAGER']));

// Revenue analytics
router.get('/revenue', asyncHandler(async (req: Request, res: Response) => {
  const query = analyticsQuerySchema.parse(req.query);
  const restaurantId = req.user!.restaurantId;

  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();

  const where: Record<string, unknown> = {
    restaurantId,
    paymentStatus: 'PAID',
    createdAt: { gte: from, lte: to },
  };
  if (query.branchId) where['branchId'] = query.branchId;

  const orders = await prisma.order.findMany({
    where,
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    let key: string;
    if (query.granularity === 'monthly') {
      key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
    } else if (query.granularity === 'weekly') {
      const weekStart = new Date(order.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0]!;
    } else {
      key = order.createdAt.toISOString().split('T')[0]!;
    }
    const existing = grouped.get(key) || { revenue: 0, orders: 0 };
    existing.revenue += order.total;
    existing.orders += 1;
    grouped.set(key, existing);
  }

  const data = Array.from(grouped.entries()).map(([date, vals]) => ({
    date,
    revenue: Math.round(vals.revenue * 100) / 100,
    orders: vals.orders,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  res.json({
    success: true,
    data: {
      dataPoints: data,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
    },
  });
}));

// Order analytics
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const query = analyticsQuerySchema.parse(req.query);
  const restaurantId = req.user!.restaurantId;

  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();

  const where: Record<string, unknown> = { restaurantId, createdAt: { gte: from, lte: to } };
  if (query.branchId) where['branchId'] = query.branchId;

  const [total, completed, cancelled, pending] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.order.count({ where: { ...where, status: 'PENDING' } }),
  ]);

  res.json({
    success: true,
    data: { total, completed, cancelled, pending, completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0 },
  });
}));

// Menu performance
router.get('/menu-performance', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurantId;

  const items = await prisma.menuItem.findMany({
    where: { restaurantId },
    select: { id: true, name: true, price: true, orderCount: true },
    orderBy: { orderCount: 'desc' },
  });

  const bestSellers = items.slice(0, 10).map((item) => ({
    ...item,
    revenue: item.price * item.orderCount,
  }));

  const slowMoving = items.filter((i) => i.orderCount > 0).slice(-5).map((item) => ({
    ...item,
    revenue: item.price * item.orderCount,
  }));

  res.json({ success: true, data: { bestSellers, slowMoving } });
}));

// Peak hours
router.get('/peak-hours', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurantId;
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: { restaurantId, createdAt: { gte: from } },
    select: { createdAt: true },
  });

  const heatmap: Array<{ hour: number; dayOfWeek: number; orderCount: number }> = [];
  const counts = new Map<string, number>();

  for (const order of orders) {
    const hour = order.createdAt.getHours();
    const day = order.createdAt.getDay();
    const key = `${day}-${hour}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmap.push({
        hour,
        dayOfWeek: day,
        orderCount: counts.get(`${day}-${hour}`) || 0,
      });
    }
  }

  res.json({ success: true, data: heatmap });
}));

// Table performance
router.get('/table-performance', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurantId;

  const tables = await prisma.table.findMany({
    where: { restaurantId },
    include: {
      orders: {
        where: { paymentStatus: 'PAID' },
        select: { total: true, createdAt: true, updatedAt: true },
      },
    },
  });

  const data = tables.map((table) => {
    const totalRevenue = table.orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = table.orders.length;
    const avgRevenue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const sessionDurations = table.orders.map((o) =>
      (o.updatedAt.getTime() - o.createdAt.getTime()) / 60000
    );
    const avgSession = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    return {
      tableId: table.id,
      tableNumber: table.number,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgRevenue: Math.round(avgRevenue * 100) / 100,
      avgSessionMinutes: Math.round(avgSession),
    };
  });

  res.json({ success: true, data });
}));

// Customer analytics
router.get('/customers', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurantId;

  const [totalCustomers, customersWithMultipleOrders] = await Promise.all([
    prisma.customer.count({ where: { restaurantId } }),
    prisma.customer.count({
      where: {
        restaurantId,
        orders: { some: {} },
      },
    }),
  ]);

  const recentCustomers = await prisma.customer.findMany({
    where: { restaurantId },
    include: {
      _count: { select: { orders: true } },
      loyaltyAccount: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({
    success: true,
    data: {
      totalCustomers,
      returningCustomers: customersWithMultipleOrders,
      newCustomers: totalCustomers - customersWithMultipleOrders,
      recentCustomers,
    },
  });
}));

// Dashboard overview
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurantId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, todayRevenue, pendingPayments, totalTables, activeOrdersCount] = await Promise.all([
    prisma.order.count({
      where: { restaurantId, createdAt: { gte: today }, isArchived: false },
    }),
    prisma.order.aggregate({
      where: { restaurantId, createdAt: { gte: today }, paymentStatus: 'PAID', isArchived: false },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { restaurantId, paymentStatus: 'UNPAID', status: { notIn: ['CANCELLED'] }, isArchived: false },
    }),
    prisma.table.count({ where: { restaurantId } }),
    prisma.order.count({
      where: { restaurantId, status: { notIn: ['COMPLETED', 'CANCELLED'] }, isArchived: false },
    }),
  ]);

  const revenue = todayRevenue._sum.total || 0;
  const avgOrderValue = todayOrders > 0 ? revenue / todayOrders : 0;

  // Payment method split
  const paymentSplit = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where: { restaurantId, createdAt: { gte: today }, paymentStatus: 'PAID', isArchived: false },
    _count: true,
    _sum: { total: true },
  });

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    where: { 
      restaurantId, 
      isArchived: false,
      status: { notIn: ['COMPLETED', 'CANCELLED'] }
    },
    include: { table: true, items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json({
    success: true,
    data: {
      todayRevenue: Math.round(revenue * 100) / 100,
      totalOrders: todayOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      pendingPayments,
      tableTurnoverRate: totalTables > 0 ? Math.round((todayOrders / totalTables) * 100) / 100 : 0,
      activeOrdersCount,
      paymentSplit,
      recentOrders,
    },
  });
}));

export default router;
