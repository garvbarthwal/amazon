import { NextRequest, NextResponse } from "next/server";
import { QuickRequestSchema } from "@/lib/schemas";
import type { CartLineItem } from "@/lib/services/tier-builder";
import {
  planCart,
  mergeCartItems,
  SmartCartError,
  type SmartCartItem,
} from "@/lib/services/smartcart";

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

  let response;
  try {
    response = await planCart({ query: intent });
  } catch (err) {
    if (err instanceof SmartCartError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    throw err;
  }

  if (response.status === "failed" || !response.cart) {
    return NextResponse.json(
      { error: response.reply ?? "SmartCart could not build a cart for that request." },
      { status: 422 },
    );
  }

  const items = mergeCartItems(response).map(toLineItem);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const deliveryMin = 13;

  const shopping_list = (response.requirements?.essentials ?? []).map((r) => ({
    query: r.name,
    quantity: 1,
  }));

  return NextResponse.json({
    vibe_category: deriveVibe(response.queryType, intent),
    shopping_list,
    cart: { items, total, savings: 0, itemCount, deliveryMin },
    usedFallback: false,
    zoneCode,
  });
}
