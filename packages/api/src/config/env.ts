// ═══════════════════════════════════════════
// DineSmart OS — Environment Configuration
// ═══════════════════════════════════════════

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  API_BASE_URL: z.string().url().default('http://localhost:4001'),
  FRONTEND_CUSTOMER_URL: z.string().default('http://localhost:5173'),
  FRONTEND_URL: z.string().default('http://localhost:5174'),
  FRONTEND_SUPERADMIN_URL: z.string().default('http://localhost:5175'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_SUPERADMIN_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  CSRF_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder'),
  STRIPE_PUBLISHABLE_KEY: z.string().default('pk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),
  CLOUDINARY_CLOUD_NAME: z.string().default('placeholder'),
  CLOUDINARY_API_KEY: z.string().default('placeholder'),
  CLOUDINARY_API_SECRET: z.string().default('placeholder'),
  RESEND_API_KEY: z.string().default('re_placeholder'),
  EMAIL_FROM: z.string().email().default('noreply@dinesmart.app'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  QR_BASE_URL: z.string().default('https://dinesmart.app'),
  LOG_LEVEL: z.string().default('debug'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
