// ═══════════════════════════════════════════
// DineSmart OS — Zod Validation Schemas
// ═══════════════════════════════════════════

import { z } from 'zod';

// ── Auth Schemas ─────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  restaurantName: z.string().min(2, 'Restaurant name is required').max(100),
  ownerName: z.string().min(2, 'Owner name is required').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  address: z.string().min(5, 'Address is required').max(500),
  panCard: z.string().min(5, 'PAN Card is required').max(100),
  panCardUrl: z.string().optional(),
  gstBill: z.string().min(5, 'GST Bill is required').max(100),
  gstBillUrl: z.string().optional(),
  registrationCertUrl: z.string().optional(),
  plan: z.enum(['STARTER', 'PREMIUM']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

// ── Restaurant Schemas ───────────────────

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  bannerText: z.string().max(200).optional().or(z.literal('')),
  bannerImageUrl: z.string().url().optional().or(z.literal('')),
});


export const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').max(100),
  address: z.string().min(5, 'Address is required').max(500),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  timezone: z.string().default('Asia/Kolkata'),
  requireOrderVerification: z.boolean().default(true),
  allowOnlinePayment: z.boolean().default(true),
  allowOrderModification: z.boolean().default(true),
  autoPreparation: z.boolean().default(true),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createTableSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  number: z.number().int().positive('Table number must be positive'),
  capacity: z.number().int().positive('Capacity must be positive').max(50),
});

export const updateTableSchema = z.object({
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().max(50).optional(),
  isOccupied: z.boolean().optional(),
});

// ── Category Schemas ─────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── Menu Item Schemas ────────────────────

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Item name is required').max(200),
  description: z.string().max(1000).default(''),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
  isVeg: z.boolean().default(false),
  preparationTimeMinutes: z.number().int().positive().default(15),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  variants: z.array(z.object({
    name: z.string().min(1),
    additionalPrice: z.number().min(0),
  })).default([]),
  addonIds: z.array(z.string().uuid()).default([]),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

// ── Addon Schemas ────────────────────────

export const createAddonSchema = z.object({
  name: z.string().min(1, 'Addon name is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
});

export const updateAddonSchema = createAddonSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

// ── Order Schemas ────────────────────────

export const createOrderSchema = z.object({
  tableId: z.string().uuid('Invalid table ID'),
  items: z.array(z.object({
    menuItemId: z.string().uuid('Invalid menu item ID'),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    addonIds: z.array(z.string().uuid()).default([]),
    specialInstructions: z.string().max(500).default(''),
  })).default([]),
  type: z.enum(['DINE_IN', 'TAKE_AWAY']).default('DINE_IN'),
  couponCode: z.string().optional(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  customerName: z.string().max(100).optional(),
  notes: z.string().max(500).default(''),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
});

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED']),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PAID', 'PARTIAL', 'REFUNDED']),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD']).optional(),
});

// ── Payment Schemas ──────────────────────

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number().positive().optional(),
  itemIds: z.array(z.string().uuid()).optional(),
});

export const razorpayWebhookSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// ── Billing Schemas ──────────────────────

export const orderFilterSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'PARTIAL', 'REFUNDED']).optional(),
  tableId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(20),
});

export const refundSchema = z.object({
  reason: z.string().min(5, 'Reason is required').max(500),
  amount: z.number().positive().optional(),
});

// ── Inventory Schemas ────────────────────

export const createInventoryCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
});

export const createInventoryItemSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  name: z.string().min(1, 'Item name is required').max(200),
  unit: z.string().min(1, 'Unit is required').max(50),
  currentStock: z.number().min(0).default(0),
  minThreshold: z.number().min(0).default(10),
  costPrice: z.number().min(0).default(0),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const updateStockSchema = z.object({
  quantity: z.number(),
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const menuItemInventorySchema = z.object({
  menuItemId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantityUsed: z.number().positive(),
});

// ── Coupon Schemas ───────────────────────

export const createCouponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20).transform(v => v.toUpperCase()),
  discountType: z.enum(['PERCENT', 'FLAT']),
  discountValue: z.coerce.number().positive('Discount value must be positive'),
  minOrderValue: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().positive().default(100),
  expiresAt: z.coerce.date().transform(d => d.toISOString()),
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().positive(),
});

// ── Loyalty Schemas ──────────────────────

export const redeemPointsSchema = z.object({
  customerId: z.string().uuid(),
  points: z.number().int().positive('Points must be positive'),
});

// ── Review Schemas ───────────────────────

export const createReviewSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(''),
  itemRatings: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
});

// ── User Management Schemas ──────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF']),
  branchId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF']).optional(),
  branchId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
});


// ── Analytics Schemas ────────────────────

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  branchId: z.string().uuid().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

// ── Super Admin Schemas ──────────────────

export const updatePlanSchema = z.object({
  plan: z.enum(['STARTER', 'PREMIUM']),
  planExpiresAt: z.string().datetime().optional(),
});

export const superAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Pagination Schema ────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── Type exports ─────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
