# Handoff: Amazon Now — Quick-Commerce Storefront with Three AI Modes

> **Amazon HackOn Season 6.0 — "Reimagining Urgent Shopping."**
> Quick-commerce customers arrive with an immediate need and want to finish in seconds.
> Amazon Now removes search-and-scroll friction with **three AI-powered ways to shop**:
>
> 1. **Quick Mode** — one sentence → one ready, editable cart.
> 2. **Conversational Mode** — chat your cart together, then check out, without leaving the chat.
> 3. **Predictive Mode** — proactive "buy it again, right on time" nudges from your reorder rhythm.
>
> Built on a clean, responsive, Amazon-styled grocery storefront.

---

## About the design files

The files in `prototype/` are **design references built in HTML** — an interactive prototype of
the intended look, layout, and behavior. **They are not production code to copy line-for-line.**
They render through a small runtime (`support.js`) that is a prototyping convenience and **must
not be shipped**.

Your task: **recreate these designs in a real codebase** (recommended: Next.js + React + TypeScript +
Tailwind) using that environment's patterns, then wire the backend in `PIPELINE.md`.

Open `prototype/Amazon Now.dc.html` in a browser to interact with the full flow + all three modes.

**Companion docs:**
- `PIPELINE.md` — the AI backend pipelines for all three modes.
- `HANDOFF_Amazon_Now.md` — a concise delta + acceptance checklist (quick read).
- `CLAUDE.md` — drop at repo root so every Claude Code session inherits the rules.

## Fidelity

**High-fidelity.** Recreate pixel-for-pixel. Every hex value, size, and radius here is authoritative.

---

## Recommended stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Prototype is React-shaped |
| Styling | **Tailwind CSS** | Map the tokens below to `tailwind.config` |
| Animation | **Framer Motion** | Conversational zoom-in, cart reveals, vibe re-theme |
| State | React Context (or Zustand) | Cart + the per-mode scratch carts |
| Backend | Next API routes or Node/Express | Hosts the AI pipelines |
| Database | **Postgres + pgvector** | Hybrid keyword + semantic search |
| Embeddings | **Titan Text Embeddings V2 (1024-dim)** via Bedrock | |
| LLM | **Claude on AWS Bedrock** | Intent JSON + conversation |

---

## Brand & logo

- **Wordmark:** `amazon` (white, 800, letter-spacing -1.2px) + `picks` (amazon-amber `#febd69`, 800),
  with an original hand-drawn orange smile-arrow (SVG, stroke `#ff9900`). Keep it original — **do NOT
  reproduce Amazon's trademarked smile logo.** Logo is top-left, clickable, routes home.

---

## Design tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| `nav-ink` | `#131921` | Top nav, primary dark |
| `nav-ink-2` | `#232f3e` | Sub-nav |
| `nav-ink-3` | `#37475a` | Hover / gradient stop |
| `accent-amber` | `#febd69` | "picks" wordmark, cart badge, search button |
| `accent-orange` | `#ff9900` | Primary CTA, AI modes, smile-arrow |
| `cta-yellow-1 / 2` | `#f7dfa5` / `#f0c14b` | Add-to-cart gradient |
| `cta-border` | `#c89411` | Add-to-cart border |
| `link` / `link-hover` | `#007185` / `#c45500` | Links |
| `price-red` | `#cc0c39` | Discount badge |
| `success-green` | `#007600` | In-stock, savings, "Due now" |
| `predict-blue` | `#2a5bd7` on `#eef4ff` | "Predicted for you" pill |
| `delivery-dot` | `#46e07f` | Delivery green dot |
| `page-bg` / `card-bg` / `card-border` | `#eaeded` / `#ffffff` / `#e7e7e7` | Surfaces |
| `text-primary / secondary / tertiary` | `#0f1111` / `#565959` / `#8a8f94` | Text |

### Typography
`Arial, Helvetica, sans-serif` throughout. Scale (px): hero h1 38/800 · page h1 28/800 ·
section h2 21/800 · product title 26/700 · card title 14/400 · price (card) 21/700 ·
price (detail) 34/700 · body 14–15 · caption 12–13 · brand label 11–13/700 UPPERCASE.

### Spacing / radius / shadow
Spacing 6/8/10/14/18/22/24px · radius cards 8–14, pills/CTAs 20–26, badges 4–6 ·
card hover `0 6px 18px rgba(0,0,0,.1)` + `translateY(-2px)` · max content width **1500px**.

### NEW — Product image tiles (no photos yet)
Each product renders a soft **color tile**: tinted background + `BRAND` (uppercase, ~9px, 62%
opacity) + product **name** (bold) + size. Real `img` (object-fit: contain) overrides the tile.
Tint chosen by keyword in name+brand+tags (full table in `HANDOFF_Amazon_Now.md` §1), e.g.
cola `#f4e2dc/#9c2f1c`, water `#dbeefb/#1c6a94`, milk `#fbf4e2/#8f7327`, chips `#fdeaca/#a6580c`,
chocolate `#ece0d2/#6a4324`; default `#eef1f3/#37475a`. Used on cards, cart lines, and all AI panels.

---

## Screens / views

Single-page experience with a client-side screen router
(`home | category | product | cart | checkout | success`) + two modal overlays
(**Quick Mode**, **Conversational Mode**). Persistent header on every screen.

### Global — Header (unchanged)
Top nav (`#131921`, sticky): logo · deliver-to pill · search (category select + input + amber
button) · **Quick Mode** button (orange gradient + "AI" chip) · account · cart (icon + amber badge).
Sub nav (`#232f3e`): "All" + scrollable category buttons.

### 1. Home
- **Hero / Conversational promo:** full-width rounded gradient panel (`#131921→#232f3e→#37475a`,
  radial orange glow). Badge "NEW · POWERED BY AI". H1 "Tell us the plan. Get the cart in seconds."
  Inline input + **"Build my cart →"** — typing here opens **Conversational Mode** (see §Conversational).
  Three example chips.
- **NEW — Predictive section** ("Buy it again, right on time") directly **below the hero** (see §Predictive).
- **Category tiles** (5-up). **Product rows** (Today's top deals, Cold Drinks & Juices,
  Snacks & Munchies) — horizontally scrolling `ProductCard`s (212px).

### 2. Category / search · 3. Product detail · 4. Cart · 5. Checkout · 6. Success
Unchanged from the original storefront spec (filter rail + 5-col grid; 4-col detail with buy box +
"Frequently bought together"; cart with line items + sticky summary; numbered checkout with
address/speed/payment; centered success with order summary). Placing an order clears the cart and
**records purchased recurring items to order history** (feeds Predictive Mode).

### Quick Mode (AI modal) — SIMPLIFIED to one editable cart
The Essentials/Standard/Premium 3-cart picker and the Budget control are **removed**.
- **Input:** intent textarea + chips, **People** stepper (scales qty), Zone display. "Build my carts".
- **Thinking:** 4-stage animated checklist (~1.9s).
- **Result:** **vibe banner** (emoji + vibe name + decomposed query chips) + **one editable cart**:
  each line = tile · name · `BRAND · size` · qty stepper · Remove · line total; an **"➕ Add any item"**
  search (dropdown of catalog matches → click to add); checkout bar with Subtotal + **Proceed to
  checkout** (merges into the global cart → normal checkout screen). "← Edit request" returns to input.

### Conversational Mode (NEW) — chat your cart, check out in-overlay
Opens from the **hero input** the moment the user starts typing: backdrop dims + blurs and a
centered panel **zooms into focus** (`scale .9→1`, `translateY 18→0`, ~320ms); the typed text is
carried into the composer. Two columns:
- **Left — chat:** user bubbles (orange gradient, right), assistant bubbles (gray + sparkle avatar,
  left), typing dots; composer = suggestion chips + auto-grow textarea + send (Enter sends,
  Shift+Enter newline); auto-scrolls.
- **Right — live cart:** fills as you chat — tile · name · line total · qty stepper · Remove; subtotal;
  **"Checkout · ₹X"**.
- **Checkout flow (in-overlay):** `chat → checkout → paying → done`. Checkout = deliver-to card +
  payment radios (UPI/Card/COD, selected = orange border + tint) + order summary + **"Pay ₹X via {method}"**;
  paying = spinner "Processing payment…" (~2.1s); done = green check "Payment successful!" + order summary
  (Order ID `AN########`, ETA, items, paid) + "Continue shopping". Clears the conversational cart and
  records recurring items to order history.

### Predictive Mode (NEW) — below the hero banner
Section "Buy it again, right on time" + a "Predicted for you" pill, rendered only when items are due.
Horizontal cards: tile · "⏱ Due now / Due tomorrow" · name · "Every N days" · price ·
"Last ordered N days ago" · **Add to cart** · **Skip · Snooze · Remove**.
Only **replenishable staples** are eligible (milk, water, bread, eggs, butter, badam, maggi, corn
flakes — never one-off items like an RC car). Due when `lastOrdered + interval` is within ~1 day.
See `PIPELINE.md` for the recurrence model.

---

## Interactions & behavior
- **Navigation:** client-side screen switch; scroll to top on switch.
- **Cart:** add / inc / dec / remove (qty 0 removes); persisted to `localStorage (ap_cart_v1)`;
  header badge = total qty. Quick & Conversational keep **separate scratch carts** that merge/checkout.
- **Toast:** "Added X to cart" bottom-center ~2.4s.
- **ProductCard:** hover lift; "Add" swaps to −/qty/+ once in cart.
- **All AI calls have rule-based fallbacks** — the demo can never hard-break.
- **Responsive:** desktop-first; grids collapse 5→3→2; AI modals go single-column on narrow widths.

## State management
- Router: `screen`, `categoryName`, `productId`, `searchValue/activeSearch`, `sortBy`
- `cart: { [productId]: qty }` (persisted) — derived count/subtotal/savings/ETA
- Quick: `qCart` (editable), `quickAddQuery`, `qVibe`, `qList`, `qGroup`
- Conversational: `convOpen`, `convStep (chat|checkout|paying|done)`, `convMsgs[]`, `convInput`,
  `convCart`, `convBusy`, `convPay`, `convOrder`
- Predictive: `orderHistory: {id,ts}[]`, `predRemoved[]`, `predSnooze {id:untilTs}`, `predSkip[]`
- localStorage: `ap_cart_v1`, `ap_history_v1`, `ap_predremoved_v1`, `ap_predsnooze_v1`

## Data
- Catalog: ~30 products hardcoded in `Amazon Now.dc.html` under `const CATALOG`
  (fields: id, brand, name, category, size, price, mrp, rating, ratingCount, deliveryMin, img, tags[],
  + a derived `tint`). Use as seed data.
- Recurrence: prototype uses a fixed `RECURRING = { id: intervalDays }` map; production should store
  `recurring`/`defaultIntervalDays` on `Product` or infer the interval from a user's purchase history.

## Files
- `prototype/Amazon Now.dc.html` — the whole app (all screens + 3 modes + `CATALOG` + logic).
- `prototype/ProductCard.dc.html` — reusable product card (color-tile fallback).
- `prototype/support.js` — prototype runtime only; **do not ship.**
- `PIPELINE.md` — AI pipelines (Quick, Conversational, Predictive).
- `HANDOFF_Amazon_Now.md` — concise delta + acceptance checklist.
- `CLAUDE.md` — repo-root rules.
