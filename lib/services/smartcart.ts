const SMARTCART_URL = process.env.SMARTCART_API_URL ?? "http://localhost:3001";
const SMARTCART_KEY = process.env.SMARTCART_API_KEY;

export type SmartCartItem = {
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

export type SmartCartStatus =
  | "success"
  | "partial_success"
  | "clarification_required"
  | "failed";

export type SmartCartResponse = {
  requestId?: string;
  sessionId?: string;
  status: SmartCartStatus;
  queryType?: string;
  reply?: string;
  questions?: string[];
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

export class SmartCartError extends Error {
  constructor(message: string, public httpStatus: number = 502) {
    super(message);
  }
}

export type PlanCartArgs = {
  query: string;
  parameters?: Record<string, string | number | boolean>;
  sessionId?: string;
};

export async function planCart(args: PlanCartArgs): Promise<SmartCartResponse> {
  const url = `${SMARTCART_URL}/v1/cart/plan`;
  const body = {
    query: args.query,
    ...(args.parameters ? { parameters: args.parameters } : {}),
    ...(args.sessionId ? { sessionId: args.sessionId } : {}),
  };
  console.log("→ POST", url, JSON.stringify(body));

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SMARTCART_KEY ? { Authorization: `Bearer ${SMARTCART_KEY}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.log("← error", msg);
    throw new SmartCartError(`SmartCart unreachable: ${msg}`, 502);
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.log("←", upstream.status, text);
    throw new SmartCartError(`SmartCart upstream error (${upstream.status})`, 502);
  }

  const json = (await upstream.json()) as SmartCartResponse;
  console.log("←", upstream.status, JSON.stringify(json));
  return json;
}

// Filters audit-removed productIds and dedupes across essentials → recommended → premium.
export function mergeCartItems(response: SmartCartResponse): SmartCartItem[] {
  const removed = new Set((response.audit?.removed ?? []).map((r) => r.productId));
  const merged = new Map<string, SmartCartItem>();
  const tiers = [
    response.cart?.essentials ?? [],
    response.cart?.recommended ?? [],
    response.cart?.premiumSuggestions ?? [],
  ];
  for (const tier of tiers) {
    for (const item of tier) {
      if (removed.has(item.productId)) continue;
      if (!merged.has(item.productId)) merged.set(item.productId, item);
    }
  }
  return Array.from(merged.values());
}
