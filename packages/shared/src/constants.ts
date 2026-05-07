// ═══════════════════════════════════════════
// DineSmart OS — Shared Constants
// ═══════════════════════════════════════════

export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  MANAGER: 3,
  CASHIER: 2,
  KITCHEN_STAFF: 1,
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_ITEM_STATUS = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
} as const;

export type OrderItemStatus = (typeof ORDER_ITEM_STATUS)[keyof typeof ORDER_ITEM_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const DISCOUNT_TYPE = {
  PERCENT: 'PERCENT',
  FLAT: 'FLAT',
} as const;

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export const PLAN = {
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  PREMIUM: 'PREMIUM',
} as const;

export type Plan = (typeof PLAN)[keyof typeof PLAN];

export const PLAN_LIMITS: Record<Plan, {
  maxBranches: number;
  maxTables: number;
  maxCoupons: number;
  aiRecommendations: boolean;
  aiDemandForecast: boolean;
  aiSmartPricing: boolean;
  inventory: boolean;
  analytics: boolean;
  whiteLabel: boolean;
  monthlyPrice: number;
}> = {
  STARTER: {
    maxBranches: 1,
    maxTables: 20,
    maxCoupons: 0,
    aiRecommendations: false,
    aiDemandForecast: false,
    aiSmartPricing: false,
    inventory: false,
    analytics: true,
    whiteLabel: false,
    monthlyPrice: 999,
  },
  GROWTH: {
    maxBranches: 3,
    maxTables: 100,
    maxCoupons: 5,
    aiRecommendations: false,
    aiDemandForecast: false,
    aiSmartPricing: false,
    inventory: true,
    analytics: true,
    whiteLabel: false,
    monthlyPrice: 1999,
  },
  PREMIUM: {
    maxBranches: -1,
    maxTables: -1,
    maxCoupons: -1,
    aiRecommendations: true,
    aiDemandForecast: true,
    aiSmartPricing: true,
    inventory: true,
    analytics: true,
    whiteLabel: true,
    monthlyPrice: 2499,
  },
};


export const NOTIFICATION_TYPES = {
  ORDER_NEW: 'ORDER_NEW',
  ORDER_STATUS: 'ORDER_STATUS',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  LOW_STOCK: 'LOW_STOCK',
  REVIEW_NEW: 'REVIEW_NEW',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const TAX_RATE = 0.05; // 5% GST
export const LOYALTY_POINTS_PER_RUPEE = 0.1; // 1 point per ₹10
export const LOYALTY_REDEMPTION_RATE = 0.1; // 100 points = ₹10
export const POPULAR_THRESHOLD = 50; // orders to be marked "popular"
