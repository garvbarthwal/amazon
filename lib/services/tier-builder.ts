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
};

export type CartTier = {
  title: "Essentials" | "Standard" | "Premium";
  key: "essentials" | "standard" | "premium";
  items: CartLineItem[];
  total: number;
  savings: number;
  itemCount: number;
  deliveryMin: number;
};

function pickEssentials(c: Candidate[]): Candidate | null {
  const top = c.slice(0, Math.min(c.length, 6));
  return top.slice().sort((a, b) => a.price - b.price)[0] ?? null;
}

function pickStandard(c: Candidate[]): Candidate | null {
  return (
    c
      .slice(0, Math.min(c.length, 12))
      .map((x) => ({ x, score: x.matchScore / Math.log(x.price + 2) }))
      .sort((a, b) => b.score - a.score)[0]?.x ?? null
  );
}

function pickPremium(c: Candidate[]): Candidate | null {
  return c.slice().sort((a, b) => b.matchScore - a.matchScore)[0] ?? null;
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
  };
}

function totals(items: CartLineItem[]): { total: number; savings: number; eta: number } {
  let total = 0, savings = 0, eta = 0;
  for (const i of items) {
    total += i.price * i.qty;
    if (i.mrp > i.price) savings += (i.mrp - i.price) * i.qty;
    if (i.deliveryMin > eta) eta = i.deliveryMin;
  }
  return { total, savings, eta };
}

export async function buildTiers(
  decomposed: ClaudeIntent,
  groupSize: number,
): Promise<CartTier[]> {
  const perQuery = await Promise.all(
    decomposed.shopping_list.map(async (q) => ({
      query: q.query,
      requestedQty: Math.max(1, Math.min(q.quantity, scaleQuantity(q.query, groupSize) + 2)),
      candidates: await retrieveCandidates(q.query, 12),
    })),
  );

  const essentials: CartLineItem[] = [];
  const standard: CartLineItem[] = [];
  const premium: CartLineItem[] = [];

  const seenE = new Set<string>();
  const seenS = new Set<string>();
  const seenP = new Set<string>();

  const push = (
    bucket: CartLineItem[],
    pickedId: Set<string>,
    picked: Candidate | null,
    qty: number,
    query: string,
  ) => {
    if (!picked || pickedId.has(picked.id)) return;
    pickedId.add(picked.id);
    bucket.push(lineFromCandidate(picked, qty, query));
  };

  for (const r of perQuery) {
    if (r.candidates.length === 0) continue;
    push(essentials, seenE, pickEssentials(r.candidates), r.requestedQty, r.query);
    push(standard,   seenS, pickStandard(r.candidates),   r.requestedQty, r.query);
    push(premium,    seenP, pickPremium(r.candidates),    r.requestedQty, r.query);
  }

  const buildTier = (
    title: CartTier["title"],
    key: CartTier["key"],
    items: CartLineItem[],
  ): CartTier => {
    const t = totals(items);
    return {
      title, key, items,
      total: t.total,
      savings: t.savings,
      deliveryMin: t.eta || 13,
      itemCount: items.reduce((s, i) => s + i.qty, 0),
    };
  };

  return [
    buildTier("Essentials", "essentials", essentials),
    buildTier("Standard",   "standard",   standard),
    buildTier("Premium",    "premium",    premium),
  ];
}
