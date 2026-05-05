# 🍽️ DineSmart — Multi-Tenant SaaS Restaurant Platform

> A production-ready, real-time restaurant management platform with AI-powered recommendations, a branded customer PWA, and a live Kitchen Display System (KDS).

---

## ✨ What is DineSmart?

DineSmart is a **multi-tenant SaaS** platform that lets any restaurant onboard, configure their menu, and immediately serve customers via a branded QR-code menu. It combines:

- **Customer PWA** — A stunning, mobile-first ordering experience.
- **Staff Panel** — Table management, KDS, orders, billing, coupons, and analytics.
- **Super Admin Panel** — Tenant onboarding, subscription tiers, and platform-wide control.
- **Real-time backend** — Socket.io for live order updates across all panels.
- **AI Recommendations** — Gemini-powered upselling at checkout.

---

## 🏗️ Monorepo Structure

```
Dine_Smart-main/
├── apps/
│   ├── customer/          # Customer-facing PWA (Vite + React, port 5173)
│   ├── staff/             # Staff & KDS panel  (Vite + React, port 5174)
│   └── superadmin/        # Super Admin panel  (Vite + React, port 5175)
│
└── packages/
    └── api/               # Express + TypeScript backend (port 4000)
        ├── src/
        │   ├── routes/    # All REST API routes
        │   ├── services/  # Business logic
        │   ├── socket/    # Socket.io event handlers
        │   └── config/    # env, prisma, redis
        └── prisma/
            └── schema.prisma
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, TailwindCSS, Lucide React |
| **State / Data** | TanStack Query, Zustand |
| **Backend** | Node.js, Express, TypeScript |
| **ORM / DB** | Prisma 5 + PostgreSQL (Neon / Supabase) |
| **Cache / Pub-Sub** | Redis (Upstash or local) |
| **Real-time** | Socket.io |
| **Auth** | JWT (access + refresh token rotation) |
| **AI** | Google Gemini API (recommendations) |
| **Payments** | Razorpay (optional) |
| **Deployment** | Render (API), Vercel / Netlify (frontends) |
| **Storage** | Cloudinary (menu images) |
| **Notifications** | Web Audio API (KDS sound alerts) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL database (or Neon / Supabase free tier)
- Redis instance (or Upstash free tier)

### 1. Clone & Install

```bash
git clone https://github.com/<your-org>/Dine_Smart.git
cd Dine_Smart-main
npm install
```

### 2. Configure Environment

```bash
cp packages/api/.env.example packages/api/.env
```

Fill in `packages/api/.env`:

```env
DATABASE_URL="postgresql://USER:PASS@HOST:5432/dinesmart?sslmode=require"
DIRECT_URL="postgresql://USER:PASS@HOST:5432/dinesmart?sslmode=require"

REDIS_URL="redis://localhost:6379"

JWT_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

GEMINI_API_KEY="your-gemini-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

PORT=4000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
STAFF_URL="http://localhost:5174"
SUPERADMIN_URL="http://localhost:5175"
```

### 3. Initialise the Database

```bash
cd packages/api
npx prisma migrate dev --name init
npx prisma db seed          # Creates super admin + demo restaurant
```

### 4. Start All Services

From the root (using separate terminals or a process manager):

```bash
npm run dev:api          # API on :4000
npm run dev:customer     # Customer PWA on :5173
npm run dev:staff        # Staff panel on :5174
npm run dev:superadmin   # Super Admin on :5175
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@dinesmart.com` | `superadmin123` |
| Restaurant Admin | Created during onboarding | Set on first login |

---

## 📡 API Reference (v1)

Base URL: `http://localhost:4000/api/v1`

### Public (no auth)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/menu/public/:slug?tableId=` | Fetch full menu for a table |
| POST | `/menu/public/:slug/send-otp` | Send OTP to customer phone |
| POST | `/menu/public/:slug/verify-otp` | Verify OTP, return session |
| POST | `/orders` | Place a new order |
| GET | `/orders/:sessionId` | Get order by session |
| POST | `/orders/reviews` | Submit a customer review |
| POST | `/coupons/validate` | Validate coupon at checkout |
| GET | `/coupons/active-for-customer` | List available coupons |
| GET | `/ai/recommendations` | AI-powered item suggestions |

### Staff (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders` | List orders (with filters) |
| PATCH | `/orders/:id/status` | Update order status |
| GET | `/menu` | Get full menu with admin fields |
| POST | `/menu/items` | Create menu item |
| PATCH | `/menu/items/:id` | Update menu item |
| DELETE | `/menu/items/:id` | Delete menu item |
| GET | `/orders/reviews` | View customer reviews |
| GET | `/analytics/summary` | Sales & trend analytics |
| GET | `/tables` | List tables + QR codes |

### Super Admin (JWT + SUPERADMIN role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/restaurants` | List all tenants |
| POST | `/admin/restaurants` | Onboard new restaurant |
| PATCH | `/admin/restaurants/:id` | Update restaurant settings |
| GET | `/admin/subscriptions` | Subscription overview |
| POST | `/admin/subscriptions` | Assign / change plan |

---

## 📱 Feature Highlights

### Customer PWA
- **QR-code menu** — Scan table QR → instant menu, no app install.
- **Chef's Special carousel** — Dynamic section featuring top-ordered, popular items.
- **Live ratings** — Star ratings computed from real order counts per item.
- **Smart cart** — Variants, addons, special instructions, coupon application.
- **AI upsell** — Gemini recommends complementary items before checkout.
- **OTP auth** — Phone-based customer identification (no passwords).
- **Order tracking** — Live status updates via Socket.io.
- **Loyalty history** — Previous orders tied to phone number.

### Staff Panel
- **Kitchen Display System (KDS)** — Live incoming orders, sound alerts (one-time unlock persisted per session).
- **Order lifecycle** — PENDING → ACCEPTED → PREPARING → READY → SERVED → BILLED.
- **Billing** — Generate bill, apply discounts, mark paid.
- **Menu manager** — CRUD for categories, items, variants, addons, images.
- **Coupon manager** — Percentage / flat discounts with expiry and usage limits.
- **Analytics dashboard** — Daily revenue, top items, peak hours, occupancy.
- **Feedback viewer** — Customer reviews with ratings and comments.
- **Table & QR manager** — Add tables, regenerate QR codes.

### Super Admin Panel
- **Multi-tenant onboarding** — Create restaurants, assign slugs, set branding.
- **Subscription tiers** — Free / Pro / Enterprise with feature gating.
- **Audio settings** — Enable/disable and configure custom KDS sounds per restaurant.
- **Global analytics** — Platform-wide revenue and usage.

---

## 🔔 Real-time Events (Socket.io)

| Event | Direction | Payload |
|---|---|---|
| `order:new` | Server → Staff | Full order object |
| `order:status_update` | Server → Customer | `{ orderId, status }` |
| `order:item_update` | Server → Customer | `{ orderId, items }` |
| `join:restaurant` | Client → Server | `{ restaurantId }` |
| `join:table` | Client → Server | `{ tableId }` |

---

## 🚢 Production Deployment (Render)

1. **API service** — Node.js, build cmd `npm run build`, start cmd `node dist/index.js`.
2. **Environment variables** — Set all vars from `.env` in the Render dashboard.
3. **Database** — Use Neon / Supabase Transaction Pooler URL for `DATABASE_URL` and Session Pooler URL for `DIRECT_URL`.
4. **Redis** — Use Upstash free tier; set `REDIS_URL`.
5. **Frontends** — Deploy each `apps/*` as a static site; set `VITE_API_URL` to the Render API URL.

### Build Commands

```bash
# API
cd packages/api && npm run build

# Customer
cd apps/customer && npm run build

# Staff
cd apps/staff && npm run build

# Super Admin
cd apps/superadmin && npm run build
```

---

## 🗂️ Key Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma connection string (pooled) |
| `DIRECT_URL` | ✅ | Direct DB URL for migrations |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `GEMINI_API_KEY` | ✅ | Google Gemini for AI recommendations |
| `CLOUDINARY_*` | ✅ | Image upload credentials |
| `PORT` | ✅ | API server port (default: 4000) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `CLIENT_URL` | ✅ | CORS: customer PWA origin |
| `STAFF_URL` | ✅ | CORS: staff panel origin |
| `SUPERADMIN_URL` | ✅ | CORS: super admin panel origin |
| `QR_BASE_URL` | ⚠️ | Base URL embedded in QR codes |
| `RAZORPAY_KEY_ID` | ⚠️ | Optional payment integration |

---

## 🛡️ Security Notes

- JWT tokens are rotated on every refresh; refresh tokens are stored server-side in Redis.
- OTP codes expire in 5 minutes and are single-use.
- All staff / admin routes are protected by role-based middleware (`RESTAURANT_ADMIN`, `KITCHEN_STAFF`, `BILLING_STAFF`, `SUPERADMIN`).
- Rate limiting is applied to OTP and order placement endpoints.

---

## 📄 License

MIT © 2024 DineSmart
