import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const SMARTCART_URL = process.env.SMARTCART_API_URL ?? "http://localhost:3007";
const SMARTCART_KEY = process.env.SMARTCART_API_KEY;

const ConversationRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  sessionId: z.string().optional(),
});

type SmartCartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: string;
  brand: string;
  subCategory: string;
  requirement: string;
};

type SmartCartResponse = {
  requestId?: string;
  sessionId?: string;
  status: "success" | "partial_success" | "clarification_required" | "failed";
  reply?: string;
  questions?: string[];
  cart?: {
    essentials?: SmartCartItem[];
    recommended?: SmartCartItem[];
    premiumSuggestions?: SmartCartItem[];
  };
  audit?: { removed?: { productId: string }[] };
};

export type ConvLine = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  img: string;
  qty: number;
  subCategory?: string;
};

export type ConvApiResponse = {
  status: SmartCartResponse["status"];
  reply: string;
  questions: string[];
  items: ConvLine[];
  sessionId?: string;
};

function toLine(item: SmartCartItem): ConvLine {
  return {
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    price: item.price,
    size: item.quantity,
    img: item.image,
    qty: 1,
    subCategory: item.subCategory,
  };
}

export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const body = await req.json().catch(() => null);
  console.log(`[conv ${reqId}] ← client`, JSON.stringify(body));

  const parsed = ConversationRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.log(`[conv ${reqId}] ✗ invalid request`, parsed.error.issues);
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { query, parameters, sessionId } = parsed.data;

  const upstreamBody = {
    query,
    parameters,
    ...(sessionId ? { sessionId } : {}),
  };
  console.log(`[conv ${reqId}] → ${SMARTCART_URL}/v1/cart/plan`, JSON.stringify(upstreamBody));

  let response: SmartCartResponse;
  const t0 = Date.now();
  try {
    const upstream = await fetch(`${SMARTCART_URL}/v1/cart/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SMARTCART_KEY ? { Authorization: `Bearer ${SMARTCART_KEY}` } : {}),
      },
      body: JSON.stringify(upstreamBody),
      cache: "no-store",
    });
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.log(`[conv ${reqId}] ✗ upstream ${upstream.status} (${Date.now() - t0}ms)`, text);
      return NextResponse.json(
        { error: `SmartCart upstream error (${upstream.status})` },
        { status: 502 },
      );
    }
    response = (await upstream.json()) as SmartCartResponse;
    console.log(`[conv ${reqId}] ← upstream ${upstream.status} (${Date.now() - t0}ms)`, JSON.stringify(response));
  } catch (err) {
    console.log(`[conv ${reqId}] ✗ upstream unreachable (${Date.now() - t0}ms)`, (err as Error).message);
    return NextResponse.json(
      { error: `SmartCart unreachable: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const removed = new Set((response.audit?.removed ?? []).map((r) => r.productId));
  const keep = (arr?: SmartCartItem[]) =>
    (arr ?? []).filter((i) => !removed.has(i.productId));

  const merged = new Map<string, ConvLine>();
  for (const item of [
    ...keep(response.cart?.essentials),
    ...keep(response.cart?.recommended),
    ...keep(response.cart?.premiumSuggestions),
  ]) {
    if (!merged.has(item.productId)) merged.set(item.productId, toLine(item));
  }

  const out: ConvApiResponse = {
    status: response.status,
    reply: response.reply ?? "",
    questions: response.questions ?? [],
    items: Array.from(merged.values()),
    sessionId: response.sessionId,
  };
  console.log(
    `[conv ${reqId}] → client status=${out.status} questions=${out.questions.length} items=${out.items.length}`,
  );
  return NextResponse.json(out);
}
