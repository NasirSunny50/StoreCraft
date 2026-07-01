# StoreCraft

Electronics e-commerce store (customer-facing) + admin back portal. Built phase-by-phase per [PRD.md](PRD.md). Conventions in [CLAUDE.md](CLAUDE.md).

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind v4 · PostgreSQL + Prisma · NextAuth v5 (credentials, role-based) · Vitest · Playwright.

## Phase status

- **Phase 1 — Setup, schema, auth roles, seed ✅ (tests green)**
- **Phase 2 — Catalog (home, listing, filter/sort/search, detail), cart, wishlist, read-only reviews ✅ (tests green)**
- **Phase 3 — Checkout (COD), address management, orders + tracking, cancel ✅ (tests green)**
- **Phase 4 — Admin portal (dashboard, product CRUD + CSV, inventory, orders, customers, coupons, reports, RBAC) ✅ (tests green)**
- UI restyled to a StarTech.com.bd-style marketplace look.
- Phase 5 — not started (SSLCommerz, email/SMS, deploy).

## Prerequisites

- Node 20+ (built on Node 24)
- Docker (for local Postgres) — or any PostgreSQL instance

## Quick start (one command)

Runs everything locally — Postgres (Docker), migrations, seed, then the app
(storefront + `/admin` + API are one Next.js process):

```bash
npm run start:local        # or: ./start.sh   (Windows: double-click start.bat)
```

Flags: `--fresh` (recreate the DB), `--no-seed` (skip seeding).
Then open http://localhost:3000 (storefront) and http://localhost:3000/admin.

## Setup (manual)

```bash
# 1. Install dependencies
npm install

# 2. Start a local Postgres (port 5433 to avoid clashing with a system Postgres)
docker run -d --name storecraft-pg \
  -e POSTGRES_USER=storecraft -e POSTGRES_PASSWORD=storecraft -e POSTGRES_DB=storecraft \
  -p 5433:5432 postgres:16-alpine

# 3. Configure env
cp .env.example .env   # adjust DATABASE_URL / AUTH_SECRET if needed

# 4. Apply schema + seed
npx prisma migrate dev
npm run db:seed

# 5. Run
npm run dev            # http://localhost:3000
```

## Seeded accounts

| Role     | Email                    | Password       | Notes              |
| -------- | ------------------------ | -------------- | ------------------ |
| ADMIN    | admin@storecraft.test    | Admin@12345    | full admin portal  |
| STAFF    | staff@storecraft.test    | Staff@12345    | admin portal       |
| CUSTOMER | customer@storecraft.test | Customer@12345 | storefront         |
| CUSTOMER | blocked@storecraft.test  | Blocked@12345  | blocked (no login) |

## Testing (phase gate)

```bash
npm run typecheck      # tsc --noEmit
npm run lint
npm run test:unit      # Vitest — validators, password, money, slug, roles
npm run test:e2e       # Playwright — auth + role-based access (needs DB seeded)
```

## What Phase 1 delivers

- Project scaffold (Next.js 15, TS strict, Tailwind v4, ESLint).
- Full Prisma schema (`prisma/schema.prisma`) + initial migration.
- Idempotent seed (`prisma/seed.ts`): users (all roles), categories, brands, products (incl. out-of-stock & low-stock fixtures).
- NextAuth v5 credentials auth with JWT carrying `id` + `role`.
- Register / login / logout (server actions, Zod-validated, bcrypt-hashed).
- Role guards: admin route group + `requireRole` helper; blocked users cannot log in.
- Unit + e2e test suites, all green.

## What Phase 2 delivers

- Home: banner, category nav, featured products.
- Listing (`/products`, `/category/[slug]`, `/brand/[slug]`): filter by category/brand/price/rating/in-stock, sort (newest, price ↑/↓, popularity), name+description search, **cursor-based** "Load more". Filter state lives in the URL (shareable); empty state handled.
- Product detail: image gallery, spec table, stock status, related products (same category), read-only reviews + average rating. Out-of-stock disables "Add to cart".
- Cart: DB-backed, guest cart via httpOnly cookie that **merges into the account on login/register**; quantity update/remove, stock cap (never oversell into the cart), subtotal via Decimal money util, header badge.
- Wishlist (auth): add/remove, move-to-cart, header badge.
- Tests: 58 unit/integration (cart math, filter/sort builders, validator, DB cursor pagination) + 31 Playwright e2e — all green.

## What Phase 3 delivers

- **Address management** (`/account/addresses`): add / delete / set-default, multiple addresses per user.
- **Checkout (COD)** (`/checkout`, login required): pick or add address, order summary with flat ৳60 shipping, COD, place order.
- **Stock-safe order placement**: stock decremented with an atomic conditional update (`updateMany … stock >= qty`) inside `prisma.$transaction` — oversell impossible even under concurrency. Order items snapshot name+price; StockLog written; cart cleared; human order number `ORD-YYYY-NNNNNN`.
- **Orders** (`/orders`, `/orders/[orderNumber]`): cursor-paginated history, detail with status timeline (PENDING→CONFIRMED→SHIPPED→DELIVERED), color-coded badges, cancel (PENDING only → restocks atomically).
- Tests: 77 unit/integration (incl. DB checkout: decrement, oversell-blocked, cancel-restock, order-number) + 35 Playwright e2e — all green.

## What Phase 4 delivers (Admin portal, `/admin`)

- **RBAC**: ADMIN sees everything; STAFF limited to Orders + Inventory + Dashboard (admin-only pages → /forbidden, hidden from nav). Guards on every route + action.
- **Dashboard**: revenue / orders / customers / low-stock cards (date-range filter) + orders-by-status and top-products charts.
- **Products**: list + search, create/edit (specs + image-URL editor), soft-delete/restore, unique-slug + price>0 validation, **CSV bulk import** with per-row error report. (Image upload is URL-based for now; Cloudinary widget is Phase 5.)
- **Categories & Brands**: full CRUD (delete blocked while products reference them).
- **Inventory**: stock view, low-stock filter, manual adjust → StockLog (atomic, can't go below 0).
- **Orders**: list + status filter, detail, status update (logged); cancelling restocks atomically.
- **Customers**: list/detail + order history, block/unblock (blocked users can't log in).
- **Coupons**: CRUD (percent/fixed, min order, expiry, usage limit) + **apply at checkout** (validated; discount + atomic usedCount++ on order placement).
- **Reports**: sales by date range + low-stock, **CSV export** (ADMIN-guarded route handler).
- Tests: 99 unit/integration (coupon-math, CSV parser, DB admin: product CRUD/soft-delete, stock adjust, order status+restock, coupon apply, block) + 42 Playwright e2e (RBAC, product→storefront, coupon→checkout, block→no-login, order status) — all green.

## Test data of note (for e2e)

- Out-of-stock: `samsung-galaxy-s24-ultra` (stock 0). Low stock: `anker-powercore-20000` (stock 3).
- Cheapest: Anker (৳5,900). Audio category has exactly one product (Sony). Apple brand has two.
