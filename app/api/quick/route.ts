import { NextRequest, NextResponse } from "next/server";
import { QuickRequestSchema } from "@/lib/schemas";
import type { CartLineItem } from "@/lib/services/tier-builder";

const SMARTCART_URL = process.env.SMARTCART_API_URL ?? "http://localhost:3001";
const SMARTCART_KEY = process.env.SMARTCART_API_KEY;

type SmartCartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: string;
  rating?: number;
  reviews?: number;
  brand: string;
  subCategory: string;
  requirement: string;
  resolverPath?: string;
};

type SmartCartResponse = {
  status: "success" | "partial_success" | "clarification_required" | "failed";
  queryType?: string;
  reply?: string;
  requirements?: {
    essentials?: { name: string }[];
    recommended?: { name: string }[];
    premium?: { name: string }[];
  };
  cart?: {
    essentials?: SmartCartItem[];
    recommended?: SmartCartItem[];
    premiumSuggestions?: SmartCartItem[];
  };
  audit?: {
    valid?: boolean;
    removed?: { productId: string; reason?: string }[];
    summary?: string;
  };
};

const VIBE_BY_QUERY_TYPE: Record<string, string> = {
  festival: "celebration",
  mission: "restock",
  dish: "comfort",
  ingredient: "comfort",
  category: "restock",
};

function deriveVibe(queryType: string | undefined, intent: string): string {
  const text = intent.toLowerCase();
  if (/(movie|cinema|film)/.test(text)) return "movie";
  if (/(party|birthday|celebrat)/.test(text)) return "party";
  if (/(breakfast|morning)/.test(text)) return "breakfast";
  if (/(healthy|salad|diet)/.test(text)) return "healthy";
  if (/(water|hydrat|summer|cold drink|juice)/.test(text)) return "hydration";
  if (/(snack|chips|munch)/.test(text)) return "snack";
  if (/(restock|grocery|monthly)/.test(text)) return "restock";
  return VIBE_BY_QUERY_TYPE[queryType ?? ""] ?? "default";
}

function toLineItem(item: SmartCartItem): CartLineItem {
  return {
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    price: item.price,
    mrp: item.price,
    size: item.quantity,
    img: item.image,
    qty: 1,
    query: item.requirement,
    deliveryMin: 13,
    tags: item.subCategory ? [item.subCategory] : [],
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = QuickRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { intent, zoneCode } = parsed.data;

  let response: SmartCartResponse;
  try {
    const upstream = await fetch(`${SMARTCART_URL}/v1/cart/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SMARTCART_KEY ? { Authorization: `Bearer ${SMARTCART_KEY}` } : {}),
      },
      body: JSON.stringify({ query: intent }),
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `SmartCart upstream error (${upstream.status})` },
        { status: 502 },
      );
    }
    response = (await upstream.json()) as SmartCartResponse;
  } catch (err) {
    return NextResponse.json(
      { error: `SmartCart unreachable: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (response.status === "failed" || !response.cart) {
    return NextResponse.json(
      { error: response.reply ?? "SmartCart could not build a cart for that request." },
      { status: 422 },
    );
  }

  const removed = new Set((response.audit?.removed ?? []).map((r) => r.productId));
  const keep = (arr?: SmartCartItem[]) => (arr ?? []).filter((i) => !removed.has(i.productId));

  const essentials = keep(response.cart.essentials);
  const recommended = keep(response.cart.recommended);
  const premium = keep(response.cart.premiumSuggestions);

  const merged = new Map<string, CartLineItem>();
  for (const item of [...essentials, ...recommended, ...premium]) {
    if (merged.has(item.productId)) continue;
    merged.set(item.productId, toLineItem(item));
  }
  const items = Array.from(merged.values());

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const deliveryMin = items.length ? 13 : 13;

  const shopping_list = (response.requirements?.essentials ?? []).map((r) => ({
    query: r.name,
    quantity: 1,
  }));

  return NextResponse.json({
    vibe_category: deriveVibe(response.queryType, intent),
    shopping_list,
    cart: {
      items,
      total,
      savings: 0,
      itemCount,
      deliveryMin,
    },
    usedFallback: false,
    zoneCode,
  });
}
