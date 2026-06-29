# CLAUDE.md — Project Conventions

## What we're building
Electronics e-commerce store (customer-facing) + admin back portal. Solo dev. Build phase-by-phase per PRD.md. Do NOT jump ahead to a later phase until the current one's tests pass.

## Stack
- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma (schema in prisma/schema.prisma)
- NextAuth (credentials provider, role-based)
- Cloudinary for images
- SSLCommerz for payment (Phase 5 only — until then COD)
- Hosting: Vercel + Neon/Supabase

## Architecture rules (scalable-first)
- Server Components by default. Add "use client" ONLY when interactivity (state/handlers) is required.
- Route groups: app/(shop)/ for customer, app/(admin)/ for portal — separate layouts.
- Cursor-based pagination for ALL lists (never offset).
- All DB writes that touch stock MUST run inside prisma.$transaction (prevent oversell).
- Money: always Prisma Decimal, never float. Use a money util for arithmetic.
- Server Actions for mutations where possible; Route Handlers for webhooks/external (SSLCommerz).
- Validate every input with Zod (shared schemas in lib/validators).
- Role guard EVERY admin route + action. Check session role server-side, never trust client.

## Folder structure
```
app/
  (shop)/          # customer pages
  (admin)/         # admin portal (role-guarded layout)
  api/             # route handlers (webhooks, etc.)
components/ui/     # shadcn
components/        # shared
lib/
  prisma.ts        # singleton client
  auth.ts          # NextAuth config
  validators/      # zod schemas
  utils/           # money, slug, pagination helpers
prisma/
  schema.prisma
  seed.ts
```

## Conventions
- File names: kebab-case. Components: PascalCase.
- Prefer named exports.
- No business logic in components — put it in lib/ or server actions.
- Snapshot product name+price into OrderItem at purchase time (price changes later must not alter old orders).
- Soft-delete products (isDeleted), never hard delete if orders reference them.

## Testing gate
- After each phase: write Playwright e2e for the phase's key flow. Phase not "done" until green.
- Unit test: cart total, coupon application, stock decrement logic.

## Don't
- Don't use localStorage for cart on server-rendered pages — cart is DB-backed.
- Don't add features outside the current phase's PRD scope without asking.
- Don't store secrets in code — use env vars.
