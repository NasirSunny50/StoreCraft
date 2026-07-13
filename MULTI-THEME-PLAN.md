# Multi-Theme Framework — StoreCraft

## Context

Ekjon client amader current StarTech-style electronics marketplace theme-er bodole **Shwapno.com-style (grocery supermarket) look** chacchen. Amra current theme-ta rakhte chai ebong future-e onek client-er jonno notun theme druto banate chai.

Confirmed decisions:
- **Deployment**: per-client alada deployment; theme **build-time env var** diye select hobe (kono admin runtime toggle NA — purapuri development-end e control).
- **Depth**: **full structural theme** — sudhu color na, header/footer/homepage composition/grocery-style UX porjonto alada.
- **Scalability**: ekta **reusable theme framework/registry** — notun theme add kora sohoj hobe.

Goal: emon ekta framework jekhane (1) `NEXT_PUBLIC_THEME` env diye active theme thik hoy, (2) prottek theme-er nijer color tokens + structural chrome/home components thake, (3) shared functional components (product card, cart, checkout, etc.) sob theme reuse kore.

### Current state (exploration summary)
- **Tokens**: Tailwind v4 `@theme` block `app/globals.css`-e, 13 semantic color token, ~93% component semantic class use kore (`bg-surface`, `text-accent` ...). Palette swap architecturally sohoj.
- **Hardcoded colors**: ~22 file-e raw Tailwind color (status badge `bg-blue-100`, error `bg-red-50`, success `bg-green-50`, wishlist button `bg-blue-600`, placeholder `bg-gray-100`). Egula tokenize korte hobe.
- **Structural chrome hardcoded for electronics**: footer (`app/(shop)/layout.tsx`), header top-bar text (`components/site-header.tsx`), banner slider `SLIDES` array (`components/storefront/banner-slider.tsx`), promo boxes + hero grid (`app/(shop)/page.tsx`), category icon map (`components/storefront/featured-categories.tsx` / `lib/view/category-icon.ts`).
- **Already theme-agnostic / reusable**: `components/product/product-card.tsx`, `product-section.tsx`, `brand-logo.tsx`, `product-card-data.ts` (specs are generic key-value), mobile menu/bottom-nav structure. Product detail/listing/cart/checkout are functional (token-styled).
- **Branding**: DB `Setting` JSON row via `lib/branding.ts` (`getBranding()` cached, server-side). Shop name/logo/favicon/contact/SEO configurable; **kono color/theme config nei**.
- Chrome components server-rendered, read `getBranding()`; client leaves (menu, nav, slider) get props.

---

## Architecture

### 1. Theme selection (env, build-time)
- New `lib/theme/active-theme.ts`: reads `process.env.NEXT_PUBLIC_THEME` (default `"startech"`), validates against registry, exports `activeThemeId` + `activeTheme`.
- Root layout `app/layout.tsx`: set `<html data-theme={activeThemeId}>` so CSS token overrides apply.
- Per-client operation: oi client-er Vercel project-e `NEXT_PUBLIC_THEME=shwapno` set → build → done. No code branch per client.

### 2. Design tokens per theme (Tailwind v4 `data-theme` override)
Restructure `app/globals.css`:
- `@theme { ... }` = **default (startech)** token values → utilities generate kore (`bg-accent` = `var(--color-accent)`).
- Per-theme override blocks (idiomatic Tailwind v4 — utilities use `var()`, so scoped override cascades):
  ```css
  [data-theme="shwapno"] {
    --color-accent: #00a651;      /* Shwapno green */
    --color-navbar: #...;
    /* ...only the tokens that differ */
  }
  ```
- Keep each theme's token block in its own file `themes/<name>/tokens.css`, `@import`-ed into globals.css (all themes present in CSS; `data-theme` picks one — CSS overhead negligible).

### 3. Token cleanup (prerequisite for clean reskin)
- Add semantic status tokens to `@theme`: `--color-success`, `--color-error`, `--color-warning`, `--color-info` (+ soft/tint variants for badge backgrounds).
- Replace the ~22 files' raw colors with these tokens. Representative files: `components/order/order-status-badge.tsx`, `components/auth/login-form.tsx` / `register-form.tsx`, `components/account/profile-form.tsx`, `components/checkout/checkout-form.tsx`, `components/wishlist/wishlist-item-row.tsx` + `app/(shop)/wishlist/page.tsx` (blue button → `bg-accent`), admin list/report pages, `app/(shop)/compare/page.tsx`, `track/page.tsx`. Pattern: `bg-red-50 → bg-error-soft`, `text-green-700 → text-success`, etc.

### 4. Theme contract + registry (the framework core)
New `lib/theme/contract.ts` — TypeScript interface every theme implements:
```ts
export interface StoreTheme {
  id: string;
  label: string;
  // structural chrome
  Header: ComponentType<HeaderProps>;
  Footer: ComponentType<FooterProps>;
  MobileNav: ComponentType<MobileNavProps>;
  HomePage: ComponentType<HomePageProps>;   // full home composition
  // config-driven bits
  categoryIcon: (slug: string) => IconType;
  chrome: { utilityBarText: string; benefits: string[]; footerColumns: FooterColumn[] };
  home: { banners: BannerSlide[]; promos: PromoCard[] };
}
```
New `themes/registry.ts` — `{ startech, shwapno }` map; `active-theme.ts` resolves from it.

**Shared props types** (`HeaderProps`, `HomePageProps` ...) carry the already-fetched server data (categories, cart/wishlist counts, branding, product sections) so themes stay presentational and the data-fetching stays in the route/layout once.

### 5. Thin route shells
- `app/(shop)/layout.tsx`: keep data fetch (`auth`, `getBranding`, categories) + `CompareProvider`; render `<activeTheme.Header .../>`, `{children}`, `<activeTheme.MobileNav/>`, `<activeTheme.Footer .../>`. Remove hardcoded footer/header markup (moves into themes).
- `app/(shop)/page.tsx`: keep data fetch (featured, per-category products); render `<activeTheme.HomePage ... />`. Remove hardcoded hero/banner/promo markup.
- Other shop routes (products, detail, cart, checkout, orders, wishlist, compare) stay shared & token-themed. Framework allows a theme to override a route-level component later, but default = shared. (Keeps scope realistic; grocery divergence concentrates in home + chrome.)

### 6. Extract current design into `themes/startech/`
Move existing chrome/home into the first registered theme WITHOUT visual change:
- `themes/startech/Header.tsx` (from `site-header.tsx` markup), `Footer.tsx` (from layout), `MobileNav.tsx`, `HomePage.tsx` (from `page.tsx` hero+sections), `tokens.css`, `theme.config.ts` (utility-bar text, benefits, banners, promos, category icons).
- Shared primitives (`product-card`, `product-section`, `brand-logo`, `banner-slider` engine, `mobile-menu` drawer) stay in `components/` and are imported by themes. `banner-slider` becomes **data-driven** (slides via props) instead of hardcoded `SLIDES`.
- This step proves the framework: `NEXT_PUBLIC_THEME=startech` → pixel-identical to today.

### 7. Build `themes/shwapno/`
- `tokens.css`: green palette + supporting colors.
- `Header.tsx`: grocery-style — delivery-location + prominent search + department mega-nav.
- `Footer.tsx`: department-oriented columns.
- `HomePage.tsx`: grocery composition — department carousel, grocery promo banners, deal/section blocks (reusing `ProductSection` + optionally a `ProductCardGrocery` variant if the card look must differ).
- `MobileNav.tsx`, `categoryIcon` (grocery icon map), `theme.config.ts` (banners/promos/copy).
- Reuse all shared functional components; only structure/skin differ.

### 8. Category icons
Theme provides its own `categoryIcon(slug)` map (grocery vs electronics) with a neutral fallback. (Future option, note only: move icon reference onto the `Category` DB model so it's data-driven per client — not required now.)

---

## Effort estimate

| Phase | Work | Est (focused) |
|---|---|---|
| 0 | Token cleanup: add status tokens, replace ~22 files' raw colors, restructure `globals.css` for `data-theme` | 1–1.5 din |
| 1 | Framework scaffold: `lib/theme/*` (env resolver, contract, registry), thin route shells, make banner-slider data-driven | 2–3 din |
| 2 | Extract current design → `themes/startech/` (zero visual change), verify identical | 1.5–2 din |
| 3 | Build `themes/shwapno/` full structural theme (tokens + header/footer/home/nav/icons/content) + any grocery card variant | 3–5 din |
| 4 | Env wiring, `.env.example`, "how to add a theme" doc, QA both themes, tests green | 1 din |

**Total ≈ 8.5–12.5 focused din** framework + 2 theme. Framework hoye gele **prottek future theme ≈ 3–5 din** (mostly oi theme-er structural component + palette; framework/shared code untouched).

Effort driver: "full structural theme" choice-tar jonno Phase 3 boro (grocery UX design + components). Jodi kokhono "colors + chrome restyle" e namano hoy, Phase 3 ~2 din e name.

---

## How it's operated (dev-end, per client)
1. Notun client → tader Vercel project-e `NEXT_PUBLIC_THEME=<theme>` set.
2. Notun theme dorkar → `themes/<new>/` folder banao (contract implement) + `registry.ts`-e add + `tokens.css` `@import`. Kono core/route/shared code change lage na.
3. Kono admin UI/DB theme-switch nei — pure code + env. Client-specific content (logo, shop name, contact) age-er moto DB Branding theke edit hobe.

---

## Critical files
- New: `lib/theme/active-theme.ts`, `lib/theme/contract.ts`, `themes/registry.ts`, `themes/startech/*`, `themes/shwapno/*` (Header/Footer/MobileNav/HomePage/tokens.css/theme.config.ts each).
- Modified: `app/layout.tsx` (`data-theme`), `app/(shop)/layout.tsx` (thin shell), `app/(shop)/page.tsx` (thin shell), `app/globals.css` (tokens restructure + status tokens), `components/storefront/banner-slider.tsx` (data-driven), ~22 files for color tokenization.
- Reused as-is: `components/product/product-card.tsx`, `product-section.tsx`, `brand-logo.tsx`, `lib/view/product-card-data.ts`, `lib/branding.ts`.

## Verification
- **Framework correctness (no-regression)**: `NEXT_PUBLIC_THEME=startech npm run dev` → home/header/footer/detail/cart/checkout current-er sathe pixel-identical (preview tool desktop+mobile), `npx tsc --noEmit` clean, `npx vitest run` green.
- **Second theme**: `NEXT_PUBLIC_THEME=shwapno` → home grocery-style, green palette, grocery header/footer/nav render; functional flows (browse→cart→checkout) kaj kore.
- **Token cleanup**: status badges / error / success / wishlist button sob theme token theke ashe (both themes-e visually correct), kono raw `bg-red-50/green-100/blue-600` obosishto nei (grep).
- **Env fallback**: env unset → default `startech`; invalid value → clear build error.
- Both themes deploy-buildable (`npm run build`).

## Risks / notes
- **Tailwind v4 `data-theme` override**: `@theme` tokens `var()`-based utilities generate kore, scoped `[data-theme]` override cascade kore — idiomatic, but Phase 0-e ekta token diye early validate kore nite hobe.
- **Content vs structure**: banners/promos/footer-links ekhon theme-config (code) e thakbe (per-client dev-set). Jodi client nije banner edit korte chায়, future-e DB/CMS extension lagbe — ei plan-e nei (note only).
- **Scope guard**: product detail/listing/cart/checkout structurally shared thakbe; grocery divergence home + chrome-e concentrate. Kono theme jodi egulao restructure korte chায়, framework override support kore kintu ta additional effort.
