# Amazon Now — AI Pipelines (Quick · Conversational · Predictive)

Three AI experiences, three pipelines. All share the same catalog + hybrid retrieval and all have
**rule-based fallbacks** so a demo can never break. Common building blocks first, then each mode.

---

## Common building blocks

### Catalog & hybrid retrieval (`retrieveCandidates(query)`)
For a generic query, run hybrid retrieval against Postgres:
- **Keyword arm:** `ILIKE` on `Product.name`, `brand`, `tags[]` (catches brand names: "Lay's", "Pepsi").
- **Semantic arm:** cosine distance between the query's **Titan V2 (1024-dim)** embedding and
  `Product.embedding` (pgvector) (catches intent: "something fizzy" → Coca-Cola).

De-dupe across arms → filter to in-stock for the user's zone (`ZoneStock.stock > 0`) →
blend & rank by `(similarity + rankScore)`. Generate embeddings at seed time from
`name + " " + brand + " " + tags.join(" ")`.

### Defensive JSON + fallback
Every Bedrock call: strict "minified JSON only" system prompt, `try/catch`, extract the
`{...}` span, `JSON.parse`, validate shape — and fall back to the rule-based decomposer on any error.
Keep Bedrock creds in `.env` (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`); never commit.

### Rule-based decomposer (`fallbackDecompose(text)`)
Keyword → `{ vibe_category, shopping_list:[{query, quantity}] }` mapping. Cases in the prototype:
movie/party/celebration, breakfast, healthy, hydration, restock, snack (default). Quantities scale
with detected/selected group size.

### Vibe themes
`vibe_category` drives UI theming (name, emoji, accent, soft, gradient). Prototype set: party, movie,
healthy, breakfast, hydration, comfort, restock, celebration, snack. Default = amazon-orange.

---

## Pipeline A — Quick Mode → one editable cart

`POST /api/quick`

**Request**
```json
{ "intent": "movie night for 4 people", "groupSize": 4, "zoneCode": "110001" }
```
(No `budgetTier` — the budget tiers were removed.)

**Stage 1 — Input (frontend).** Capture `intent` (free text), `groupSize`, `zoneCode`.

**Stage 2 — generateJSON() → Claude.** Decompose intent into vibe + generic retrieval queries
(Claude does NOT pick products):
```json
{ "vibe_category": "party",
  "shopping_list": [
    { "query": "cola soft drink", "quantity": 4 },
    { "query": "potato chips",    "quantity": 4 },
    { "query": "popcorn",         "quantity": 2 },
    { "query": "chocolate",       "quantity": 2 } ] }
```
Validate; fall back to `fallbackDecompose` on error.

**Stage 3 — retrieveCandidates() per query.** Hybrid retrieval, in-stock for zone.

**Stage 4 — Single-cart assembly (CHANGED).** For each query pick **one** product using the
"best balance" rule (`rankScore` vs `price`). Scale quantities by `groupSize`. Merge duplicates.
Return **one cart** (no tiers):
```json
{ "vibe_category": "party",
  "cart": { "items": [ { "productId": "coke", "qty": 4 }, ... ], "total": 470, "eta": 15 } }
```
(Alternatively return just `shopping_list` and let the client build the single cart — the prototype
builds client-side from the catalog.)

**Stage 5 — Editable on the client.** Render the cart as **editable**: per-line qty stepper + remove,
plus an "➕ Add any item" search over the catalog. **Proceed to checkout** merges this cart into the
global cart and goes to the normal checkout.

---

## Pipeline B — Conversational Mode → chat-built cart

`POST /api/conversation`

**Request**
```json
{ "messages": [ { "role": "user", "content": "snacks and cold drinks for movie night" } ],
  "cart": { "coke": 2 }, "zoneCode": "110001" }
```

**Stage 1 — Open & zoom (frontend).** Opens from the hero on first keystroke; carries the text into
the chat composer.

**Stage 2 — Claude turn.** Send the running conversation + a compact **catalog brief**
(`id|name (brand) size ₹price` per line) with this strict contract:
```json
{ "reply": "<1–2 friendly sentences>",
  "add": [ { "id": "<catalog id>", "qty": <int> } ],
  "remove": [ "<catalog id>" ] }
```
Rules in the system prompt: use ONLY ids from the catalog; only add items the customer clearly wants
now; keep `reply` short and natural; minified JSON only.

**Stage 3 — Apply.** Validate ids → apply `add`/`remove` to the **conversational cart** → render
`reply` as an assistant bubble. The live cart panel updates in place (qty steppers + remove there too).
**Fallback:** run `fallbackDecompose(lastUserMessage)` → `retrieveCandidates` → add top match per query,
with a canned friendly reply. Never breaks.

**Stage 4 — In-overlay checkout (`chat → checkout → paying → done`).**
- **checkout:** deliver-to + payment method (UPI/Card/COD) + order summary + "Pay ₹X via {method}".
- **paying:** ~2.1s processing animation (mock gateway).
- **done:** success state, Order ID `AN########`, ETA, items, paid.
- On success → `POST /api/orders` (snapshot name+price), clear the conversational cart, **record
  recurring items to order history**.

> Production note: keep the cart authoritative on the client during the chat; the server turn only
> returns reply + add/remove deltas. Persist the order at checkout via `/api/orders`.

---

## Pipeline C — Predictive Mode → "buy it again, right on time"

Either compute on the server (`GET /api/predictions`) or client-side from order history.

**Stage 1 — Recurrence model.** Only **replenishable staples** are eligible. Two options:
1. **Configured:** `Product.recurring = true` + `Product.defaultIntervalDays`. Prototype uses a fixed
   map: `milk 2, water 2, bread 3, badam 3, eggs 4, maggi 5, butter 7, cornflakes 10` (days).
2. **Inferred:** interval = **median gap** between a user's past orders of that product
   (need ≥2–3 prior orders to trust it). Cap to a sane range (e.g. 1–30 days).

**Stage 2 — Order history.** Maintain `{ productId, orderedAt }[]` per user, appended on **every**
order from any mode. Prototype seeds a realistic history and persists to `localStorage (ap_history_v1)`.

**Stage 3 — Due computation.** For each eligible item the user has ordered:
`dueAt = lastOrderedAt + interval`. Surface it as a nudge when `dueAt - now ≤ 1 day`
("Due now" if ≤ 0, else "Due tomorrow"). Sort soonest-first. Exclude removed/snoozed/skipped items.

**Stage 4 — Render.** Card per due item: tile · due chip · name · "Every N days" · price ·
"Last ordered N days ago" · **Add to cart** + **Skip / Snooze / Remove**.

**Stage 5 — User controls (persist preferences).**
| Action | Effect | Persistence |
|---|---|---|
| Add to cart | add 1 to cart, dismiss this cycle | session |
| Skip | dismiss this cycle; reappears next cycle | session |
| Snooze | hide ~1 day, then reappears | persisted (`PredictionPref.snoozeUntil`) |
| Remove | stop predicting permanently | persisted (`PredictionPref.removed`) |

**Stage 6 — Feedback loop.** Ordering an item (any mode) appends to history → its `dueAt` moves
forward → it stops nudging until next cycle. This is what makes the predictions feel alive in a demo.

---

## Suggested schema (Prisma-ish)

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  brand       String
  category    String
  size        String
  price       Int
  mrp         Int
  rating      Float
  ratingCount Int
  deliveryMin Int
  tags        String[]
  rankScore   Float    @default(0)
  img         String?
  embedding   Unsupported("vector(1024)")?
  // Predictive Mode
  recurring           Boolean @default(false)
  defaultIntervalDays Int?    // null = infer from purchase history
  stock       ZoneStock[]
}

model ZoneStock {
  id String @id @default(cuid())
  productId String
  zoneCode  String
  stock     Int
  product   Product @relation(fields: [productId], references: [id])
  @@unique([productId, zoneCode])
}

model Order {
  id        String   @id @default(cuid())
  userId    String
  items     Json     // snapshot: [{ productId, name, price, qty }]
  total     Int
  zoneCode  String
  source    String   // 'quick' | 'conversational' | 'standard'
  createdAt DateTime @default(now())
}

// Order history for predictions (or derive from Order.items)
model OrderItemHistory {
  id        String   @id @default(cuid())
  userId    String
  productId String
  orderedAt DateTime @default(now())
}

model PredictionPref {
  id          String    @id @default(cuid())
  userId      String
  productId   String
  removed     Boolean   @default(false)
  snoozeUntil DateTime?
  @@unique([userId, productId])
}
```

## API surface
- `POST /api/quick` — decompose → single editable cart (Pipeline A).
- `POST /api/conversation` — `{ messages, cart }` → `{ reply, add, remove }` (Pipeline B).
- `GET  /api/predictions` — due reorder nudges for the user (Pipeline C), or compute client-side.
- `POST /api/orders` — validate stock, snapshot name+price, create order, append order history.
- `POST /api/predictions/pref` — set remove/snooze for a product.

## Hard rules
- Wrap every Bedrock call in `try/catch` with a rule-based fallback.
- Validate all model-returned product ids against the catalog before using them.
- Snapshot `name` + `price` at order time; price never mutates after ordering.
- Secrets in `.env` only; never hardcode or commit credentials.
