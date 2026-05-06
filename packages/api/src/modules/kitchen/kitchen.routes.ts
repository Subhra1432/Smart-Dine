// ═══════════════════════════════════════════
// DineSmart OS — Kitchen Module
// ═══════════════════════════════════════════

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { asyncHandler, authenticate, requireRole } from '../../middleware/index.js';
import { updateOrderItemStatusSchema } from '@dinesmart/shared';
import { getRestaurantNamespace } from '../../config/socket.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '@dinesmart/shared';
import { logger } from '../../config/logger.js';

const router = Router();
router.use(authenticate);
router.use(requireRole(['KITCHEN_STAFF', 'MANAGER', 'OWNER']));

// Get active orders for kitchen display
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const isOversightRole = req.user!.role === 'MANAGER' || req.user!.role === 'OWNER';
  const queryBranchId = req.query['branchId'] as string;
  
  const where: Record<string, unknown> = {
    restaurantId: req.user!.restaurantId,
    status: { in: ['CONFIRMED', 'PREPARING'] },
    isArchived: false,
  };
  
  // If a specific branch is requested, use it.
  // Otherwise, only filter by branch if the user is regular staff (non-oversight).
  // Managers/Owners see EVERYTHING by default.
  if (queryBranchId) {
    where['branchId'] = queryBranchId;
  } else if (!isOversightRole && req.user!.branchId) {
    where['branchId'] = req.user!.branchId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        where: { status: { in: ['PENDING', 'PREPARING'] } },
        include: { menuItem: true, variant: true },
      },
      table: true,
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Only return orders that have active items
  const activeOrders = orders.filter((o) => o.items.length > 0);

  res.json({ success: true, data: activeOrders });
}));

// Update individual item status
router.put('/order-items/:itemId/status', requireRole(['KITCHEN_STAFF', 'MANAGER', 'OWNER']), asyncHandler(async (req: Request, res: Response) => {
  const { status } = updateOrderItemStatusSchema.parse(req.body);
  const itemId = req.params['itemId']!;

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true },
  });

  if (!item) {
    res.status(404).json({ success: false, error: 'Order item not found' });
    return;
  }

  // Verify restaurant ownership
  if (item.order.restaurantId !== req.user!.restaurantId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: { status: status as 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' },
    include: { menuItem: true, order: { include: { table: true } } },
  });

  // If item is marked PREPARING, update order status too
  let orderStatusChanged = false;
  let newOrderStatus = '';

  if (status === 'PREPARING') {
    const order = await prisma.order.findUnique({ where: { id: item.orderId } });
    if (order && order.status !== 'PREPARING') {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: 'PREPARING' },
      });
      orderStatusChanged = true;
      newOrderStatus = 'PREPARING';
    }
  }

  // If all items are READY, mark order as READY
  if (status === 'READY') {
    const allItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });
    const allReady = allItems.every((i) => i.status === 'READY' || i.status === 'SERVED');
    if (allReady) {
      const order = await prisma.order.findUnique({ where: { id: item.orderId } });
      if (order && order.status !== 'READY') {
        await prisma.order.update({
          where: { id: item.orderId },
          data: { status: 'READY' },
        });
        orderStatusChanged = true;
        newOrderStatus = 'READY';
      }
    }
  }

  // Emit socket events
  try {
    const ns = getRestaurantNamespace();
    ns.to(SOCKET_ROOMS.kitchen(item.order.branchId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, updated);
    ns.to(SOCKET_ROOMS.billing(item.order.branchId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, updated);
    ns.to(SOCKET_ROOMS.table(item.order.tableId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, updated);
    
    if (orderStatusChanged) {
      ns.to(SOCKET_ROOMS.table(item.order.tableId)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, { id: item.orderId, status: newOrderStatus });
      ns.to(SOCKET_ROOMS.billing(item.order.branchId)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, { id: item.orderId, status: newOrderStatus });
    }
  } catch (err) {
    logger.warn('Socket emit failed for item status', { error: err });
  }

  res.json({ success: true, data: updated });
}));

export default router;
