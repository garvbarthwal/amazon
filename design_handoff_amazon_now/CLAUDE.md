# Amazon Now — Project Rules (read every session)

## What this is
Quick-commerce grocery storefront (Amazon HackOn 6.0) styled to read as Amazon, with **three AI
shopping modes**:
- **Quick Mode** — one sentence → one ready, **editable** cart (add/remove/adjust) → checkout.
- **Conversational Mode** — chat-driven cart with a live cart panel + in-overlay smooth payment.
- **Predictive Mode** — proactive "buy it again, right on time" reorder nudges below the hero.

## Source of truth
- `design_handoff_amazon_now/README.md` — full UI spec, screens, tokens, the color-tile system.
- `design_handoff_amazon_now/PIPELINE.md` — the AI pipelines for all three modes.
- `design_handoff_amazon_now/HANDOFF_Amazon_Now.md` — concise delta + acceptance checklist.
- `design_handoff_amazon_now/prototype/*.dc.html` — visual reference. **Recreate, don't copy.**
  `support.js` is the prototype runtime — **never ship it**.

## Stack
Next.js (App Router) + TypeScript + Tailwind + Framer Motion · Postgres + pgvector (Prisma) ·
AWS Bedrock (Claude for intent/conversation JSON, Titan V2 for 1024-dim embeddings).

## Design rules
- Match the prototype pixel-for-pixel. Use ONLY the hex values in the README token table — never invent colors.
- Font stack is `Arial, Helvetica, sans-serif`. No custom webfont.
- Max content width 1500px (header inner 1680px), centered. Nav `#131921`, sub-nav `#232f3e`, page `#eaeded`.
- Primary CTA / AI = orange `#ff9900`; add-to-cart = yellow gradient `#f7dfa5→#f0c14b` border `#c89411`.
- **Product images = clean color tiles** (soft tint + BRAND + name + size) until real photos exist;
  real `img` overrides the tile. Tint is keyword-derived (see README §tiles / HANDOFF §1).
- Keep the "amazon picks" wordmark + original smile-arrow. Do NOT reproduce Amazon's trademarked logo.

## Mode-specific rules
- **Quick Mode has NO budget tiers and NO 3-cart picker** — it produces ONE editable cart, plus an
  "Add any item" search, then merges into the global cart at checkout.
- **Conversational Mode** opens from the hero, zooms in on first keystroke, keeps its own scratch cart,
  and completes payment inside the overlay (`chat → checkout → paying → done`). Order IDs use `AN` prefix.
- **Predictive Mode** nudges ONLY replenishable staples that are due (`lastOrdered + interval ≤ ~1 day`).
  Actions: Add / Skip (session) / Snooze (persist ~1 day) / Remove (persist, stop predicting).

## Engineering rules
- Cart state is global + persisted to `localStorage (ap_cart_v1)`; header badge = total qty.
  Quick & Conversational keep separate scratch carts that merge on checkout.
- Predictive persistence keys: `ap_history_v1`, `ap_predremoved_v1`, `ap_predsnooze_v1`
  (prototype only — production stores order history + prefs server-side).
- Every order (any mode) appends its **recurring** items to order history so predictions stay live.
- Every AI call (Quick decompose, Conversational turn) MUST have a rule-based fallback — the flow can never break.
- Validate all model-returned product ids against the catalog before use.
- Snapshot product name + price at order time; price never mutates after ordering.
- Secrets in `.env` only (`AWS_*`). Never hardcode or commit credentials.
- Build vertical slices; screenshot each screen/mode and diff against the prototype before moving on.

## Commands
- `npm run dev` · `npm run build` · `npx prisma migrate dev` · `npm run seed`
