# KPI Profit Tracker

## Overview

KPI Profit Tracker is a full-stack e-commerce KPI and profit tracking application. It allows users to manage countries and products, analyze profitability across different markets, run COD (Cash on Delivery) profitability simulations, and view dashboard summaries. The app features user authentication, persistent data storage, and a clean spreadsheet-like UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: Zustand store (`client/src/lib/store.ts`) for local app state, with TanStack React Query for server state/caching
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming, using `@tailwindcss/vite` plugin
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Build Tool**: Vite with path aliases (`@/` → `client/src/`, `@shared/` → `shared/`)
- **Fonts**: Inter (sans-serif) and JetBrains Mono (monospace)
- **Additional Features**: Drag-and-drop (dnd-kit), CSV parsing (papaparse), Excel export (xlsx), PDF generation (jsPDF), image capture (html-to-image)

### Pages

- **Dashboard** (`/`) — Overview with KPI summary cards, filterable by country
- **Analyse** (`/analyse`) — Spreadsheet-like analysis table with draggable columns, export options (Excel, PDF, image)
- **Daily Ads** (`/daily-ads`) — Daily Facebook Ads spend tracker per product with date range filters
- **Simulation** (`/simulation`) — COD profitability simulator with input parameters and calculated results, save/history feature
- **Products** (`/products`) — CRUD for products with CSV import, bulk operations, country assignment
- **Countries** (`/countries`) — CRUD for countries with shipping/COD/return defaults
- **Auth** (`/auth`) — Login and registration page

### Backend

- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via `tsx`
- **Authentication**: Passport.js with local strategy (username/password), express-session with PostgreSQL session store (connect-pg-simple)
- **Password Security**: scrypt hashing with random salt
- **API Pattern**: RESTful JSON API under `/api/` prefix, all data endpoints require authentication via `ensureAuthenticated` middleware
- **Build**: esbuild bundles server code to `dist/index.cjs` for production; Vite builds client to `dist/public/`

### API Routes

- `GET/POST /api/countries` — List/create countries
- `PUT/DELETE /api/countries/:id` — Update/delete country
- `GET/POST /api/products` — List/create products
- `PUT/DELETE /api/products/:id` — Update/delete product
- `GET /api/analysis` — Get analysis data
- `PUT /api/analysis` — Update analysis entry (by countryId + productId)
- `GET/POST /api/simulations` — List/create simulations
- `DELETE /api/simulations/:id` — Delete simulation
- `GET /api/daily-ads?startDate=&endDate=` — Get daily ads (filtered by date range)
- `POST /api/daily-ads` — Bulk save daily ads entries
- `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/user` — Auth endpoints

### Data Storage

- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Schema Location**: `shared/schema.ts` — shared between client and server
- **Migrations**: Generated via `drizzle-kit push` (output to `./migrations/`)
- **Connection**: `pg.Pool` in `server/db.ts`

### Database Schema

- **users** — `id` (serial PK), `username` (unique), `password` (hashed)
- **countries** — `id` (text PK), `userId` (FK→users), `name`, `currency`, `code`, `defaultShipping`, `defaultCod`, `defaultReturn`
- **products** — `id` (text PK), `userId` (FK→users), `sku`, `name`, `status`, `cost`, `price`, `image`, `countryIds` (jsonb array)
- **analysis** — `id` (serial PK), `userId` (FK→users), `countryId`, `productId`, revenue/ads/fees/orders fields
- **daily_ads** — `id` (serial PK), `userId` (FK→users), `productId`, `date` (YYYY-MM-DD), `amount` (daily ads spend)
- **simulations** — `id` (text PK), `userId` (FK→users), plus simulation input/output data

### Key Design Decisions

1. **Shared schema**: The `shared/` directory contains Drizzle schema and Zod validation schemas used by both client and server, ensuring type safety across the stack.
2. **Text IDs for entities**: Countries, products, and simulations use UUID text IDs (generated client-side via `uuid`), while users use auto-increment serial IDs.
3. **User isolation**: All data queries are scoped by `userId`, ensuring multi-tenant data separation.
4. **Dev/Prod split**: In development, Vite dev server runs as Express middleware with HMR. In production, pre-built static files are served from `dist/public/`.

## External Dependencies

- **PostgreSQL** — Primary database (connection via `DATABASE_URL` env var). Required for both application data and session storage.
- **No external APIs** — Currency conversion is static (e.g., 1 USD = 130 KES hint text). No third-party API calls for core functionality.
- **Replit-specific plugins** — `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev only), custom `vite-plugin-meta-images` for OpenGraph tags.

## Recent Changes

- **2026-02-08**: Swapped Dashboard and History pages. Analysis History page is now the main Dashboard at `/`. Old Dashboard page removed from routes. Sidebar nav updated accordingly. Product edit dialog now includes country assignment checkboxes.

- **2026-02-07**: Added SaaS admin functionality. Users table now has `role` field (admin/user). Admin panel page at `/admin` allows managing user accounts (create, delete, reset password, change role). Public registration disabled — only admin can create accounts. Admin API routes protected by `ensureAdmin` middleware. Password hashes no longer exposed in API responses. Login page simplified (no register tab). Admin credentials: username `admin`, password `admin123`.
- **2026-02-07**: Added Daily Ads Tracker page for logging daily Facebook Ads spend per product. New `daily_ads` table, API routes (GET/POST /api/daily-ads), date range filters (this week/last week/this month/last month/custom), debounced inputs, save all functionality.
- **2026-02-06**: Converted from mockup/prototype to full-stack application. Database provisioned, db driver switched from `@neondatabase/serverless` to `pg` (node-postgres), frontend reconnected to real backend API endpoints. Auth uses Passport.js with session-based authentication, all data persisted in PostgreSQL via Drizzle ORM.