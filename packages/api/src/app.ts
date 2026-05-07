// ═══════════════════════════════════════════
// DineSmart OS — Main Application Entry Point
// ═══════════════════════════════════════════

import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocketServer } from './config/socket.js';
import { initWorkers } from './config/queue.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authenticatedRateLimiter } from './middleware/rateLimiter.js';
import { runDatabaseSeed } from './config/seed.js';

// Import route modules
import authRoutes from './modules/auth/auth.routes.js';
import restaurantRoutes from './modules/restaurant/restaurant.routes.js';
import { handleStripeWebhook } from './modules/restaurant/subscription.controller.js';
import menuRoutes from './modules/menu/menu.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import kitchenRoutes from './modules/kitchen/kitchen.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import couponRoutes from './modules/coupons/coupons.routes.js';
import loyaltyRoutes from './modules/loyalty/loyalty.routes.js';
import superadminRoutes from './modules/superadmin/superadmin.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';

const app = express();
const httpServer = createServer(app);

// Trust proxy for Render/Cloudflare (Rate Limiting)
app.set('trust proxy', 1);

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Global Middleware ────────────────────

app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? false : false,
}));

// Build CORS origins list
const corsOrigins = [
  env.FRONTEND_CUSTOMER_URL,
  env.FRONTEND_URL,
  env.FRONTEND_SUPERADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Stripe Webhook MUST be before express.json()
app.post('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// ── Health Check ─────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API Routes ───────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restaurant', authenticatedRateLimiter, restaurantRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/billing', authenticatedRateLimiter, billingRoutes);
app.use('/api/v1/kitchen', authenticatedRateLimiter, kitchenRoutes);
app.use('/api/v1/analytics', authenticatedRateLimiter, analyticsRoutes);
app.use('/api/v1/inventory', authenticatedRateLimiter, inventoryRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/loyalty', authenticatedRateLimiter, loyaltyRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/notifications', authenticatedRateLimiter, notificationRoutes);

// ── Serve Static Frontends (Production) ──

if (env.NODE_ENV === 'production') {
  // Resolve paths relative to monorepo root (packages/api/dist/app.js → ../../..)
  const monorepoRoot = path.resolve(__dirname, '..', '..', '..');

  const customerDist = path.join(monorepoRoot, 'apps', 'customer', 'dist');
  const staffDist = path.join(monorepoRoot, 'apps', 'staff', 'dist');
  const superadminDist = path.join(monorepoRoot, 'apps', 'superadmin', 'dist');

  // Staff panel — /staff/*
  app.use('/staff', express.static(staffDist));
  app.get('/staff/*', (_req, res) => {
    res.sendFile(path.join(staffDist, 'index.html'));
  });

  // SuperAdmin dashboard — /admin/*
  app.use('/admin', express.static(superadminDist));
  app.get('/admin/*', (_req, res) => {
    res.sendFile(path.join(superadminDist, 'index.html'));
  });

  // Customer app — / (must be last, it's the catch-all)
  app.use(express.static(customerDist));
  app.get('*', (req, res) => {
    // Don't serve index.html for API-like paths
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }
    res.sendFile(path.join(customerDist, 'index.html'));
  });

  logger.info('📦 Serving static frontends in production mode');
} else {
  // Development: API-only JSON response
  app.get('/', (_req, res) => {
    res.json({
      message: '🚀 DineSmart OS API is alive and kicking!',
      docs: 'https://docs.dinesmart.app',
      health: '/api/health',
      version: '1.0.0'
    });
  });

  // ── 404 Handler (dev only) ──────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });
}

// ── Global Error Handler ─────────────────

app.use(errorHandler);

// ── Start Server ─────────────────────────

logger.info('🚀 Starting DineSmart OS API...');

initSocketServer(httpServer);
logger.info('✅ Socket.io initialized');

try {
  initWorkers();
  logger.info('✅ Background workers initialized');
} catch (err) {
  logger.warn('⚠️ Workers initialization skipped (Redis issue)', { error: err });
}

httpServer.listen(env.PORT, async () => {
  logger.info(`🚀 DineSmart OS API running on port ${env.PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 API URL: ${env.API_BASE_URL}`);

  // Always sync SuperAdmin accounts on startup
  try {
    logger.info('🌱 Running database seed check...');
    await runDatabaseSeed();
    logger.info('✅ Database seed check completed');
  } catch (err) {
    logger.error('❌ Database seeding failed', { error: err });
  }
});

export default app;
