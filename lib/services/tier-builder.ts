import { retrieveCandidates, type Candidate } from "@/lib/services/retrieval";
import { scaleQuantity } from "@/lib/services/intent";
import type { ClaudeIntent } from "@/lib/schemas";

export type CartLineItem = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  size: string;
  img: string;
  qty: number;
  query: string;
  deliveryMin: number;
  tags: string[];
};

export type SingleCart = {
  items: CartLineItem[];
  total: number;
  savings: number;
  itemCount: number;
  deliveryMin: number;
};

// "Best balance" pick — highest matchScore for the price.
function pickBestBalance(c: Candidate[]): Candidate | null {
  if (c.length === 0) return null;
  return c
    .slice(0, Math.min(c.length, 12))
    .map((x) => ({ x, score: x.matchScore / Math.log(x.price + 2) }))
    .sort((a, b) => b.score - a.score)[0]?.x ?? null;
}

function lineFromCandidate(c: Candidate, qty: number, query: string): CartLineItem {
  return {
    productId: c.id,
    name: c.name,
    brand: c.brand,
    price: c.price,
    mrp: c.mrp,
    size: c.size,
    img: c.img,
    qty,
    query,
    deliveryMin: c.deliveryMin,
    tags: c.tags,
  };
}

function totals(items: CartLineItem[]): { total: number; savings: number; eta: number; count: number } {
  let total = 0, savings = 0, eta = 0, count = 0;
  for (const i of items) {
    total += i.price * i.qty;
    if (i.mrp > i.price) savings += (i.mrp - i.price) * i.qty;
    if (i.deliveryMin > eta) eta = i.deliveryMin;
    count += i.qty;
  }
  return { total, savings, eta, count };
}

export async function buildSingleCart(
  decomposed: ClaudeIntent,
  groupSize: number,
): Promise<SingleCart> {
  const perQuery = await Promise.all(
    decomposed.shopping_list.map(async (q) => ({
      query: q.query,
      requestedQty: Math.max(1, Math.min(q.quantity, scaleQuantity(q.query, groupSize) + 2)),
      candidates: await retrieveCandidates(q.query, 12),
    })),
  );

  const merged = new Map<string, CartLineItem>();
  for (const r of perQuery) {
    const pick = pickBestBalance(r.candidates);
    if (!pick) continue;
    const existing = merged.get(pick.id);
    if (existing) {
      existing.qty += r.requestedQty;
    } else {
      merged.set(pick.id, lineFromCandidate(pick, r.requestedQty, r.query));
    }
  }

  const items = Array.from(merged.values());
  const t = totals(items);
  return {
    items,
    total: t.total,
    savings: t.savings,
    itemCount: t.count,
    deliveryMin: t.eta || 13,
  };
}
