# Electronics E-Commerce + Admin Portal — PRD

## 1. Overview
Ekta electronics shop-er online store (customer-facing) + admin back portal. Solo developer, Claude Code diye phase-by-phase build. Scalable architecture (future growth-er jonno).

**Stack:** Next.js 15 (App Router, full-stack) · TypeScript · Tailwind + shadcn/ui · PostgreSQL · Prisma · NextAuth (role-based) · Cloudinary (images) · SSLCommerz (Phase 5) · Vercel + Neon/Supabase.

## 2. User Roles
- **CUSTOMER** — browse, cart, order, review.
- **STAFF** — order management, inventory view/update (no delete, no settings).
- **ADMIN** — full access: products, users, coupons, reports, settings.

## 3. Scalability Principles (from day 1)
- Server Components by default; Client Components only where interactivity dorkar.
- Cursor-based pagination (offset na) for all lists.
- DB indexes on: `Product.slug`, `Product.categoryId`, `Order.userId`, `Order.status`, `Product.createdAt`.
- Cart DB-backed (guest cart = cookie sessionId, login-e merge).
- Images via Cloudinary CDN, never local storage.
- Stock decrement always inside DB transaction (oversell rokhe).
- Route groups: `(shop)` for customer, `(admin)` for portal, separate layouts.

---

## 4. Customer Features

### 4.1 Auth
- Register (email + password), login, logout.
- Guest browsing allowed; checkout-e login required.
- Acceptance: invalid login error dekhabe; session persist korbe; guest cart login-er por merge hobe.

### 4.2 Catalog / Browsing
- Homepage: featured products, categories, banner.
- Category & brand listing pages.
- Filters: category, brand, price range, in-stock, rating.
- Sort: price asc/desc, newest, popularity.
- Search: product name + description (Postgres full-text ba `ILIKE` to start).
- Cursor pagination.
- Acceptance: filter+sort+search combinable; empty state dekhabe; URL-e filter state thakbe (shareable).

### 4.3 Product Detail
- Image gallery, specs (key-value), price, stock status, description.
- Related products (same category).
- Reviews + average rating.
- Add to cart / wishlist.
- Acceptance: out-of-stock hole "Add to cart" disabled; spec table render hobe.

### 4.4 Cart & Wishlist
- DB-backed cart, quantity update, remove, subtotal.
- Wishlist add/remove, move to cart.
- Acceptance: stock-er beshi quantity newa jabe na; cart badge count update hobe.

### 4.5 Checkout (COD — MVP)
- Address management (multiple address, default set).
- Order summary, COD selection, place order.
- Stock decrement inside transaction.
- Acceptance: stock insufficient hole order block; order confirm page + order number dekhabe.

### 4.6 Orders
- Order history list, order detail, status tracking (PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED).
- Acceptance: status badge color-coded; cancel allowed only PENDING-e.

### 4.7 Reviews
- Logged-in customer je product kineche tar review dite parbe (1-5 star + text).
- Acceptance: ek user ek product-e ekbar review; admin moderate korte parbe.

---

## 5. Admin Portal Features

### 5.1 Dashboard
- Cards: total revenue, total orders, total customers, low-stock count.
- Charts: revenue over time, orders by status, top 5 products.
- Acceptance: date range filter; charts real data theke.

### 5.2 Product Management
- CRUD (create/edit/delete/soft-delete).
- Multi-image upload (Cloudinary), specs key-value editor.
- CSV bulk upload (validate + error report).
- Category & brand management.
- Acceptance: validation (price > 0, slug unique); bulk upload-e bad rows reject + report.

### 5.3 Inventory
- Stock view, manual adjust, low-stock alerts (threshold configurable).
- Acceptance: stock log (ke koto change korlo).

### 5.4 Order Management
- All orders list (filter by status/date/customer).
- Order detail, status update, cancel/refund note.
- Acceptance: status change customer-er order-e reflect; status change log.

### 5.5 Customer Management
- Customer list, detail (order history), block/unblock.
- Acceptance: blocked user login korte parbe na.

### 5.6 Coupons / Discounts
- Create coupon: code, type (percent/fixed), min order, expiry, usage limit.
- Acceptance: checkout-e valid coupon apply; expired/limit-crossed reject.

### 5.7 Reports
- Sales report (date range, export CSV), top products, low stock.
- Acceptance: CSV export thik data.

### 5.8 Roles & Access
- Role guards on every admin route + API.
- Acceptance: STAFF restricted route-e 403; UI-te hidden.

---

## 6. Build Phases

| Phase | Scope | Est (part-time) |
|-------|-------|-----------------|
| 1 | Setup, Prisma schema, NextAuth roles, seed | 3-4 din |
| 2 | Catalog: home, listing, filter, search, detail, cart | 1 sptaho |
| 3 | Checkout (COD), addresses, orders, tracking | 1 sptaho |
| 4 | Admin: dashboard, product CRUD, CSV, inventory, orders, customers, coupons, reports | 1.5-2 sptaho |
| 5 | SSLCommerz, email/SMS notify, Playwright e2e, deploy | 1 sptaho |

**Total: ~5-6 sptaho part-time / 2.5-3 sptaho full-time.**

## 7. Testing
- Unit: cart calc, coupon logic, stock decrement.
- E2E (Playwright): register→browse→cart→checkout→order; admin product create; coupon apply.
- Gate: prottek phase-er por test pass na hole next phase na.

## 8. Out of Scope (v1)
Multi-vendor, multi-currency, live chat, recommendation ML, mobile app.
