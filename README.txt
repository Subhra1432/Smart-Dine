================================================================================
DineSmart OS
Complete Multi-Tenant SaaS Restaurant Operating System
================================================================================

How It Works (Architecture)
--------------------------------------------------------------------------------
DineSmart operates on a monorepo structure with a central API and multiple 
specialized frontend applications:

1. Multi-Tenant Database: A single PostgreSQL database handles multiple 
   restaurants. Each restaurant has a unique slug and configuration.
2. Real-Time Synchronization: Uses Socket.io to sync orders instantly between 
   Customer, Kitchen, and Staff panels.
3. User Flows:
   - SuperAdmin: Manages the SaaS platform and onboards restaurants.
   - Staff/Kitchen: Manages orders, tables, and inventory.
   - Customer: Scans QR code, browses menu, and places orders.

Project Structure
--------------------------------------------------------------------------------
Dine_Smart/
├── apps/
│   ├── customer/       - PWA for Customers (Order via QR)
│   ├── staff/          - Dashboard for Restaurant Staff & Kitchen
│   ├── superadmin/     - Platform Management for the SaaS owner
│   └── desktop/        - Electron-based desktop app (optional)
├── packages/
│   ├── api/            - Express.js Backend with Prisma ORM
│   └── shared/         - Shared TypeScript types and utilities
├── docker-compose.yml  - Full-stack orchestration
└── package.json        - Root workspace configuration


How to Run the Project
--------------------------------------------------------------------------------

Method 1: Using Docker (Recommended & Easiest)
----------------------------------------------
1. Copy the example environment file:
   cp .env.example .env

2. Start all services:
   docker compose up --build

Access URLs:
- Customer App: http://localhost:5173
- Staff Panel: http://localhost:5174
- SuperAdmin Panel: http://localhost:5175
- API (Backend): http://localhost:4001


Method 2: Manual Local Setup
----------------------------
1. Install dependencies:
   npm install

2. Set up environment variables:
   cp .env.example .env
   cp .env.example packages/api/.env
   (Edit packages/api/.env with your actual database credentials)

3. Initialize the database:
   npm run db:push
   npm run db:seed

4. Run the services (In separate terminals):
   - Start API: npm run dev:api
   - Start Customer App: npm run dev:customer
   - Start Staff Panel: npm run dev:staff
   - Start SuperAdmin: npm run dev:superadmin


Full Commands Reference
--------------------------------------------------------------------------------

Setup & Installation:
- npm install : Installs dependencies for all apps and packages.
- cp .env.example .env : Creates the root environment file.

Development (Running Apps):
- npm run dev:api : Starts the backend API.
- npm run dev:customer : Starts the Customer PWA.
- npm run dev:staff : Starts the Staff Dashboard.
- npm run dev:superadmin : Starts the SuperAdmin Panel.

Building (Production):
- npm run build:all : Builds all packages and applications.
- npm run build:api : Builds only the API package.
- npm run build:customer : Builds only the Customer PWA.
- npm run build:staff : Builds only the Staff Panel.

Database Management (Prisma):
- npm run db:generate : Generates the Prisma client.
- npm run db:push : Pushes schema directly to the DB.
- npm run db:migrate : Creates or runs database migrations.
- npm run db:seed : Seeds the database with default accounts.

Docker Commands:
- docker compose up --build : Builds and starts all containers.
- docker compose down : Stops and removes all containers.
- docker compose logs -f api : Follow logs for the API service.


Default Credentials (After Seeding)
--------------------------------------------------------------------------------
- SuperAdmin: admin@dinesmart.app / password123
- Demo Restaurant Owner: owner@demo.com / password123

================================================================================
