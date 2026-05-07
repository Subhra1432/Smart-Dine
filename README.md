---
title: DineSmart
emoji: 🍽️
colorFrom: yellow
colorTo: orange
sdk: docker
pinned: false
---

# DineSmart: Multi-Tenant SaaS Restaurant Platform

DineSmart is a comprehensive, production-ready restaurant management ecosystem designed for the modern hospitality industry. It provides a multi-tenant SaaS architecture that enables restaurant owners to digitize their operations, from QR-based customer ordering to real-time kitchen management and platform-wide administrative control.

## Overview

The platform is designed to handle multiple independent restaurant tenants, each with their own branded interface, menu configuration, and staff management. Customers can order directly from their tables using a Progressive Web App (PWA) accessed via QR codes, while staff manage orders through a real-time Kitchen Display System (KDS) and billing interface.

## Core Modules

### 1. Customer PWA
A high-performance, mobile-first web application that allows customers to:
- Scan table-specific QR codes for instant menu access.
- Browse categories and search for specific items.
- Configure item variants, addons, and special instructions.
- Receive AI-powered recommendations for upselling.
- Authenticate via OTP for a seamless, passwordless experience.
- Track order status in real-time.

### 2. Staff Panel
A centralized management interface for restaurant employees:
- **Kitchen Display System (KDS)**: Real-time order tracking with audio alerts.
- **Order Management**: Full lifecycle control from acceptance to serving.
- **Table Management**: Live occupancy tracking and QR code generation.
- **Menu Management**: Dynamic control over categories, items, and inventory.
- **Analytics**: Detailed reporting on revenue, top-performing items, and peak hours.

### 3. Super Admin Panel
The platform's master control center for service providers:
- **Tenant Management**: Onboard new restaurants and manage existing accounts.
- **Subscription Control**: Manage service tiers and feature gating.
- **System Monitoring**: View platform-wide performance and growth metrics.
- **Global Settings**: Configure default branding and system-wide parameters.

### 4. Real-time Backend
A robust Express-based API powered by Socket.io:
- **Instant Synchronization**: All panels stay in sync with live order updates.
- **State Persistence**: Redis-backed session management and JWT rotation.
- **Type Safety**: Built with TypeScript across the entire stack.

## Technology Stack

### Frontend Layer
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: TanStack Query (Server State), Zustand (Local State)
- **Icons**: Lucide React

### Backend Layer
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching**: Redis
- **Real-time**: Socket.io

### Integration Layer
- **AI**: Google Gemini API for intelligent menu recommendations.
- **Image Hosting**: Cloudinary for high-performance asset delivery.
- **Payments**: Razorpay (Optional integration).

## Getting Started

### Prerequisites
- Node.js version 18 or higher.
- npm version 9 or higher.
- A PostgreSQL instance (Neon, Supabase, or local).
- A Redis instance (Upstash or local).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Subhra1432/Dine_Smart.git
   cd Dine_Smart
   ```

2. Install dependencies for the entire monorepo:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example environment file in the API package and fill in the required fields.
   ```bash
   cp packages/api/.env.example packages/api/.env
   ```

### Database Initialization

1. Navigate to the API package:
   ```bash
   cd packages/api
   ```

2. Run migrations and seed the initial data:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
   Note: The seeding process creates a default Super Admin account and a demo restaurant.

### Running the Application

Start all services simultaneously from the root directory:
```bash
npm run dev
```
Alternatively, start individual services:
- `npm run dev:api`: Backend API on port 4001.
- `npm run dev:customer`: Customer PWA on port 5173.
- `npm run dev:staff`: Staff Panel on port 5174.
- `npm run dev:superadmin`: Super Admin Panel on port 5175.

## Environment Variables

| Variable | Description |
|---|---|
| DATABASE_URL | Primary PostgreSQL connection string. |
| DIRECT_URL | Direct database URL for Prisma migrations. |
| REDIS_URL | Connection string for Redis session management. |
| JWT_ACCESS_SECRET | Secret key for signing access tokens. |
| JWT_REFRESH_SECRET | Secret key for signing refresh tokens. |
| JWT_SUPERADMIN_SECRET | Secret key for Super Admin specific tokens. |
| GEMINI_API_KEY | API key for Google Gemini AI features. |
| CLOUDINARY_URL | Configuration for image asset management. |
| CLIENT_URL | URL of the Customer PWA for CORS. |
| STAFF_URL | URL of the Staff Panel for CORS. |
| SUPERADMIN_URL | URL of the Super Admin Panel for CORS. |

## Feature Highlights

### Real-time Order Flow
DineSmart uses a sophisticated event-driven architecture to ensure that orders placed by customers are instantly visible to kitchen staff. The KDS includes audio notification support that is persisted across page reloads to prevent missed orders.

### Intelligent Upselling
The platform integrates with Google's Gemini AI to analyze customer carts and suggest complementary items, increasing the average order value for restaurant owners.

### Multi-tier Authentication
- **Customers**: OTP-based login for zero-friction entry.
- **Staff**: Role-based access control (RBAC) with JWT rotation.
- **Super Admin**: Enhanced security with mandatory Two-Factor Authentication (2FA) and dedicated session handling.

## Subscription Tiers

DineSmart offers a streamlined subscription model designed to scale with your business:

### 1. Starter Protocol (₹999/mo)
Designed for single-location establishments:
- **Branch Limit**: 1 Branch
- **Table Limit**: 20 Spatial Anchors
- **Core Features**: QR Ordering, real-time KDS, basic analytics, and staff management.

### 2. Premium Protocol (₹2,499/mo)
For scaling restaurant groups and luxury establishments:
- **Branch Limit**: Unlimited
- **Table Limit**: Unlimited
- **Advanced Features**: AI-powered upselling, inventory management, loyalty programs, white-label branding, and multi-branch analytics.

## Production Deployment

The platform is designed to be deployed on modern cloud infrastructure:
- **API**: Best suited for Render or AWS (requires Node.js environment).
- **Frontends**: Can be deployed as static sites on Vercel, Netlify, or Render.
- **Database**: Managed PostgreSQL like Neon or Supabase.
- **Cache**: Managed Redis like Upstash.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

Copyright (c) 2024-2026 DineSmart.
