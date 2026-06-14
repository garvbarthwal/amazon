# Handoff: Amazon Now — Three AI Shopping Modes

> Amazon HackOn 6.0 — "Reimagining Urgent Shopping". This builds on the original
> Amazon Picks storefront and adds **three AI modes**: a simplified **Quick Mode**,
> a new **Conversational Mode**, and a new **Predictive Mode**.
>
> **Visual reference (recreate, don't copy):** `prototype/Amazon Now.dc.html`
> (open in a browser — it's a working prototype of every screen + all three modes).
> The runtime `support.js` is a prototyping convenience — **do not ship it**.

This document is additive to the original `README.md` / `PIPELINE.md` / `CLAUDE.md`.
Everything in those still holds (header, category, product, cart, checkout, success,
brand, max width 1500px). Only the deltas are described here.

---

## 0. Recommended stack (unchanged)

Next.js (App Router) + React + TypeScript · Tailwind · Framer Motion · global cart
context persisted to `localStorage` · Postgres (+pgvector) · Claude on AWS Bedrock for
intent/conversation. Rule-based fallbacks everywhere so a demo can never break.

---

## 1. Design tokens (carry over) + the new tile system

All color/type/spacing tokens from the original README are authoritative. Use ONLY those
hex values. Font stack `Arial, Helvetica, sans-serif`. Primary CTA orange `#ff9900`;
add-to-cart yellow gradient `#f7dfa5 → #f0c14b` border `#c89411`; nav `#131921`,
sub-nav `#232f3e`, page `#eaeded`.

### NEW — Product image tiles (replaces striped placeholders)
Since there are no product photos, every product renders a **clean color tile**:
soft tinted background + `BRAND` (uppercase, 9–10px, 62% opacity) + product **name**
(bold) + size. The tint is derived from the product's name/brand/tags by keyword.
When a real `img` exists, it renders instead (object-fit: contain) with the tile as fallback.

Tint map (`{ background, foreground }`), first match wins:

| Match (in name+brand+tags) | bg | fg |
|---|---|---|
| cola / coke / pepsi | `#f4e2dc` | `#9c2f1c` |
| lemon / lime / limca / 7up / dew / citrus | `#e9f2cf` | `#566b14` |
| orange / fanta / tropicana | `#ffe7c6` | `#b25a08` |
| mango / frooti / maaza | `#ffedbe` | `#a9760a` |
| water / bisleri / mineral | `#dbeefb` | `#1c6a94` |
| energy / red bull / caffeine | `#e2e5fb` | `#34409e` |
| iced tea / lipton / tea | `#f1e6cb` | `#876a22` |
| badam / almond | `#f6ead3` | `#8a6a2c` |
| milk / dairy | `#fbf4e2` | `#8f7327` |
| butter | `#fdf1cf` | `#9a7a16` |
| bread | `#f3e4cd` | `#8a5a22` |
| egg | `#fdf2cf` | `#9a7d22` |
| noodle / maggi / instant | `#fbe4c6` | `#a85c12` |
| cereal / corn flakes | `#fceabf` | `#a07410` |
| popcorn | `#fbeecb` | `#9c7414` |
| chocolate / silk / kitkat / ferrero | `#ece0d2` | `#6a4324` |
| biscuit / cookie / oreo | `#ece2d6` | `#6f4b28` |
| chips / kurkure / bingo / doritos / pringles / namkeen / bhujia / snack | `#fdeaca` | `#a6580c` |
| (default) | `#eef1f3` | `#37475a` |

The same tile is used on product cards, cart lines, quick/conversational cart panels, and
predictive cards. When you swap in real images, the tile becomes the graceful fallback.

---

## 2. Quick Mode (SIMPLIFIED — one editable cart)

Entry: the orange **"Quick Mode"** button in the top nav. Full-screen modal overlay,
header "Quick Mode · AI · BEDROCK". **The Essentials/Standard/Premium 3-cart picker and the
Budget control are removed.** It now produces **one editable cart**.

**Step 1 — Input**
- Big textarea "What do you need?" + example chips.
- **People** stepper (scales quantities). **Zone** display ("📍 Connaught Place · 110001").
- (No budget tier.) Primary button "Build my carts".

**Step 2 — Thinking**
- 4-stage animated checklist: Understanding intent → Classifying vibe → Searching catalog →
  Assembling cart (ticks green in sequence). ~1.9s.

**Step 3 — Result (one editable cart)**
- **Vibe banner** (gradient themed to detected vibe; emoji + vibe name + decomposed query
  chips e.g. "cola soft drink ×4").
- **Editable cart list** — each line: tile thumb · name · `BRAND · size` · qty stepper (−/n/+) ·
  Remove · line total. Subtitle shows `N items · M min delivery`.
- **"➕ Add any item"** search input → dropdown of catalog matches (tile + name + brand + ₹) →
  click adds to the quick cart. Excludes items already in it.
- **Checkout bar**: "← Edit request" · Subtotal · **"Proceed to checkout →"**.
- Proceed merges the quick cart into the global cart and navigates to the normal checkout screen.

**Pipeline (unchanged decompose, new assembly):**
1. Decompose intent → Claude on Bedrock returns `{ vibe_category, shopping_list:[{query,quantity}] }`
   (minified JSON; rule-based `fallbackDecompose` on any error).
2. For each query run hybrid retrieval (keyword ILIKE + Titan V2 semantic), in-stock for zone.
3. Pick **one product per query** using the "best balance" rule (rank vs price). Scale by group size.
4. Return a **single cart**; the client renders it as editable and lets the user add/adjust before checkout.

---

## 3. Conversational Mode (NEW)

Entry: the **home hero input** ("Build my cart"). The moment the user starts typing (or
submits), a centered chat panel **zooms into focus** — backdrop dims + blurs, panel scales up
(`scale .9→1`, `translateY 18→0`, ~320ms). The typed text is carried into the chat composer.

**Layout — two columns inside the modal:**

**Left — Chat**
- Message stream: user bubbles (orange gradient, right-aligned, rounded `16/16/4/16`),
  assistant bubbles (gray `#f0f2f4`, left, sparkle avatar, rounded `4/16/16/16`).
- Typing indicator = 3 blinking dots while awaiting a reply.
- Composer: quick-suggestion chips + auto-growing textarea + send button (Enter = send,
  Shift+Enter = newline). Auto-scrolls to newest message.

**Right — Live cart (fills in as you chat)**
- Each item: tile thumb · name · line total · qty stepper · Remove. Empty state placeholder.
- Footer: Subtotal + **"Checkout · ₹X"**.

**AI contract (real Claude + scripted fallback):**
Send the running conversation plus a compact catalog brief (`id|name (brand) size ₹price`).
Claude must reply with STRICT minified JSON only:
```json
{ "reply": "<1–2 friendly sentences>",
  "add": [{ "id": "<catalog id>", "qty": <int> }],
  "remove": ["<catalog id>"] }
```
Only ids that exist in the catalog. The client applies `add`/`remove` to the conversational
cart and renders `reply`. **Fallback** (Bedrock down / bad JSON): reuse the keyword decomposer
+ retrieval to add the top match per query, with a canned friendly reply. The flow never breaks.

**Checkout (inside the overlay) — clean, smooth payments:**
- `chat → checkout → paying → done` steps (no page navigation).
- **checkout**: deliver-to card (Express ETA, FREE) · payment method radios (UPI / Card / COD,
  selected = orange border + tinted bg) · order summary · **"Pay ₹X via {method}"**.
- **paying**: spinner "Processing payment… securely confirming with your bank" (~2.1s).
- **done**: green check "Payment successful!", summary (Order ID `AN########`, Arriving in N min,
  Items, Paid), "Continue shopping" (closes overlay → home).
- On success: clear the conversational cart and **append ordered recurring items to order history**
  (feeds Predictive Mode).

---

## 4. Predictive Mode (NEW)

Location: **Home, directly below the hero banner**, above the category tiles. Only rendered when
there is at least one due item. Section title "Buy it again, right on time" + a "Predicted for you"
pill; subtitle "Based on how often you reorder — refill before you run out."

**Cards (horizontal scroll), each:**
- Tile thumb · "⏱ Due now / Due tomorrow" chip · product name.
- Cadence ("Every N days") · price · "Last ordered N days ago".
- Primary **"Add to cart"** (yellow gradient).
- Row of **Skip · Snooze · Remove** controls.

**Eligibility — only replenishable staples.** Milk, yes; RC car, no. Maintain a recurrence
config per product. In the prototype it's a fixed map of `{ productId: intervalDays }`:

```
milk: 2, bisleri (water): 2, bread: 3, badam: 3,
eggs: 4, maggi: 5, butter: 7, cornflakes: 10
```

For production, store this on the product (or infer): add `recurring: boolean` and
`defaultIntervalDays: int` to `Product`, OR compute the interval per user as the **median gap**
between that user's past orders of the item.

**Due logic:** for each eligible item the user has ordered, `dueAt = lastOrderedAt + interval`.
Surface it as a nudge when `dueAt - now ≤ 1 day` (Due now / Due tomorrow). Sort soonest-first.
Skip items the user removed/snoozed.

**Actions:**
| Action | Behavior | Persistence |
|---|---|---|
| **Add to cart** | adds 1 to cart, dismisses this cycle | session |
| **Skip** | dismiss this cycle; reappears next cycle | session |
| **Snooze** | hide for ~1 day, then reappears | persisted |
| **Remove** | stop predicting this item permanently | persisted |

Placing any order (any mode) appends its recurring items to order history, which automatically
pushes their next due date forward — so a just-bought item stops nudging.

---

## 5. Client state (additions to the existing store)

```
// Quick Mode
qCart: { [productId]: qty }     // the editable quick cart (scratch; merged into cart on checkout)
quickAddQuery, qVibe, qList, qGroup

// Conversational Mode
convOpen: boolean
convStep: 'chat' | 'checkout' | 'paying' | 'done'
convMsgs: { role: 'user' | 'assistant', text }[]
convInput, convBusy
convCart: { [productId]: qty }  // scratch cart for the conversation
convPay: 'upi' | 'card' | 'cod'
convOrder: { id, total, count, eta }

// Predictive Mode
orderHistory: { id: productId, ts: epochMs }[]   // seeded + appended on every order
predRemoved: productId[]          // "stop predicting"
predSnooze:  { [productId]: untilTs }
predSkip:    productId[]           // dismissed this session
```

**localStorage keys** (client persistence): `ap_cart_v1`, `ap_history_v1`,
`ap_predremoved_v1`, `ap_predsnooze_v1`. (In production, order history & preferences live
server-side; localStorage is the prototype stand-in.)

---

## 6. Backend deltas (see PIPELINE.md for the base pipeline)

- **`POST /api/quick`** — same decompose, but assemble & return **one cart** (or just the
  `shopping_list` and let the client build one). Keep the rule-based fallback.
- **`POST /api/conversation`** — body `{ messages, cart }`; calls Claude with the catalog brief
  and the JSON contract in §3; returns `{ reply, add, remove }`. Validate ids against the
  catalog; rule-based fallback on failure.
- **`POST /api/orders`** — on success, snapshot name+price (price never mutates), create the
  order, and **record purchased recurring items into the user's order history**.
- **Predictions** — either `GET /api/predictions` (server computes due items from order history
  + recurrence config) or compute client-side from order history. Respect remove/snooze.

**Schema additions (Prisma-ish):**
```prisma
model Product {
  // ...existing fields...
  recurring           Boolean @default(false)
  defaultIntervalDays Int?    // null = infer from purchase history
}

model OrderItemHistory {     // or derive from Order.items
  id        String   @id @default(cuid())
  userId    String
  productId String
  orderedAt DateTime @default(now())
}

model PredictionPref {
  id         String    @id @default(cuid())
  userId     String
  productId  String
  removed    Boolean   @default(false)
  snoozeUntil DateTime?
  @@unique([userId, productId])
}
```

---

## 7. Acceptance criteria

- [ ] Product images are clean color tiles (per §1) everywhere; real `img` overrides the tile.
- [ ] **Quick Mode** has no budget tiers / no 3-cart picker. It yields one cart you can
      add to, remove from, and re-quantity, then checkout.
- [ ] **Conversational Mode** opens from the hero, zooms in on first keystroke, holds a real
      chat (Claude + fallback), fills a live cart you can edit, and completes a smooth in-overlay
      payment ending in a success state.
- [ ] **Predictive Mode** sits below the hero, nudges only replenishable staples that are due,
      shows cadence + last-ordered, and supports Add / Skip / Snooze / Remove.
- [ ] Every order (any mode) updates order history; just-bought staples stop nudging.
- [ ] Matches the prototype `Amazon Now.dc.html` pixel-for-pixel; all original screens still work.
- [ ] All AI calls have rule-based fallbacks; the demo can never hard-break.
