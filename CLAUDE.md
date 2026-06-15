# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # production build
npm run lint         # next lint
npm run seed         # wipe + reseed Product table from seed.ts (uses tsx)
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate (re-run after schema.prisma changes)
npm run db:studio    # prisma studio
```

There is no test runner configured. Type-checking happens via `next build` (incremental: `tsconfig.tsbuildinfo`).

## Required environment

`.env` (gitignored) needs:
- `DATABASE_URL` — Postgres connection string used by the Prisma `PrismaPg` driver adapter (see `lib/db.ts`).
- `SMARTCART_API_URL` — base URL of the external SmartCart service (see "SmartCart proxy" below).
- `SMARTCART_API_KEY` — optional bearer for SmartCart.
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) — used by `/api/conversation/questions` for clarifying-question generation. When unset, that route silently falls back to a rule-based question bank.
- `GEMINI_MODEL_ID` — defaults to `gemini-2.0-flash`.

## Architecture

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4. Prisma 7 with `@prisma/adapter-pg` driver adapter (preview feature `driverAdapters` is enabled). Two Prisma models only: `Product` and `Order` — there is no user table; everything is hard-coded to `userId = "garv"`.

### Two AI shopping entry points (both live in the root layout)

`app/layout.tsx` mounts both `<QuickModeModal />` and `<ConversationalModal />` globally; their visibility is driven by Zustand stores (`useQuickMode`, `useConv`).

1. **Quick Mode** — `components/quick-mode/*` → `POST /api/quick` → SmartCart `POST /v1/cart/plan`. One-shot: user types intent + group size, gets a full cart back. Response is mapped from SmartCart's `essentials/recommended/premiumSuggestions` into a single deduped `CartLineItem[]` (see `app/api/quick/route.ts`).

2. **Conversational** — `components/conversational/conversational-modal.tsx`. A two-step dance per query:
   - `POST /api/conversation/questions` to generate **query-specific** clarifying questions (Gemini, then rule-based fallback in `app/api/conversation/questions/route.ts`).
   - The modal asks each question in turn, collects answers, then `POST /api/conversation` (which proxies to SmartCart `POST /v1/cart/plan` with `parameters`).
   - Cart is held in `lib/conv-store.ts` (in-memory only — not persisted, unlike the main `useCart`).

### SmartCart proxy

Both `/api/quick` and `/api/conversation` proxy to an **external** SmartCart service (see `API.md` for its full contract). The shared client lives in `lib/services/smartcart.ts` — it owns the upstream `fetch`, types (`SmartCartResponse`, `SmartCartItem`, `SmartCartStatus`), error class (`SmartCartError`), and the `mergeCartItems` helper that filters `audit.removed` and dedupes across `essentials → recommended → premiumSuggestions`. Both routes are thin: parse → `planCart()` → map to their own response shape. Default base URL is `http://localhost:3001`; override with `SMARTCART_API_URL`. SmartCart owns intent classification, requirement extraction, product retrieval, and audit; this app is mostly a thin client + UI.

**Foreign productIds caveat:** SmartCart returns its own product IDs that don't exist in this app's `Product` table. So:
- `/api/orders` (`createOrder` in `lib/services/orders.ts`) silently drops items whose IDs aren't in the local DB. The conversational flow expects this and falls back to a client-generated order ID (`conversational-modal.tsx:234`).
- The cart line shape used in conv-store (`ConvCartLine`) is decoupled from the persisted local cart (`useCart` in `lib/cart-store.ts`, which stores raw `productId → qty` keyed off local Product rows).

### Local product catalog (used by the rest of the site)

Everything outside the two AI flows reads from local Postgres via `lib/services/products.ts`:
- `app/page.tsx`, `app/category/[slug]`, `app/product/[id]`, `app/cart`, `app/checkout`, `app/orders`, `app/order/[id]`
- `GET /api/products`, `GET /api/products/[id]`, `GET /api/products/by-ids`, `GET /api/categories`
- Category list is cached in-process for 60s (`listCategories`).

### State management

Zustand throughout. Two stores are persisted to `localStorage`:
- `useCart` (`ap_cart_v1`) — main site cart, `Record<productId, qty>`.
- `usePredictionStore` (`ap_pred_v1`) — purchase history, snooze/skip/remove flags for predictive replenishment. The `skipSession` field is intentionally **not** persisted (`partialize` strips it).

Non-persisted: `useConv` (conversational session), `useQuickMode` (modal open + prefill).

### Recurring/replenishable products

`lib/recurring.ts` is a client-side keyword map (e.g. `milk → 2 days`, `bread → 3 days`) that substitutes for a real `recurring`/`defaultIntervalDays` column on `Product`. Used by:
- `GET /api/predictions/eligible` to surface replenishable items on the home page.
- The conversational checkout (`payNow`) to tag which items in the order should feed `usePredictionStore.appendOrder`.

### Seed pipeline

`zepto_combined.json` (16MB, gitignored-sized) → `scripts/build-seed.mjs` + `scripts/dedupe-seed.mjs` → `seed.ts` (8MB, committed) → `scripts/seed-db.ts` (run via `npm run seed`). The seed script wipes `Product` first, derives `brand` from name with a hand-curated `COMMON_BRANDS` set, computes `tags`/`rankScore`/`deliveryMin` deterministically, and bulk-inserts in 1000-row batches.

## File map shortcuts

| Concern | File |
|---|---|
| Quick Mode proxy + response shape | `app/api/quick/route.ts` |
| Conversational proxy | `app/api/conversation/route.ts` |
| Clarifying-question generation | `app/api/conversation/questions/route.ts` |
| SmartCart contract | `API.md` |
| Local product queries | `lib/services/products.ts` |
| Order creation (local) | `lib/services/orders.ts` |
| Persisted cart | `lib/cart-store.ts` |
| Conversational session | `lib/conv-store.ts` |
| Recurrence keyword map | `lib/recurring.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Seed entry point | `scripts/seed-db.ts` |

---

## Behavioral guidelines

These reduce common LLM coding mistakes. Tradeoff: bias toward caution over speed; for trivial tasks, use judgment.

### 1. Think before coding

State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently. If a simpler approach exists, say so. If something is unclear, stop and ask.

### 2. Simplicity first

Minimum code that solves the problem. No features, abstractions, configurability, or error handling for impossible scenarios that weren't asked for. If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical changes

Touch only what you must. Don't "improve" adjacent code, don't refactor things that aren't broken, match existing style. Remove imports/variables your changes orphaned; leave pre-existing dead code alone (mention it instead). Every changed line should trace to the user's request.

### 4. Goal-driven execution

Translate fuzzy asks into verifiable goals before coding ("Add validation" → "Write tests for invalid inputs, then make them pass"). For multi-step tasks, state a brief plan with verify steps. Strong success criteria let you loop independently.
