import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  planCart,
  mergeCartItems,
  SmartCartError,
  type SmartCartItem,
  type SmartCartStatus,
} from "@/lib/services/smartcart";

const ConversationRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  sessionId: z.string().optional(),
});

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
  status: SmartCartStatus;
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
  const body = await req.json().catch(() => null);

  const parsed = ConversationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { query, parameters, sessionId } = parsed.data;

  let response;
  try {
    response = await planCart({ query, parameters, sessionId });
  } catch (err) {
    if (err instanceof SmartCartError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    throw err;
  }

  const out: ConvApiResponse = {
    status: response.status,
    reply: response.reply ?? "",
    questions: response.questions ?? [],
    items: mergeCartItems(response).map(toLine),
    sessionId: response.sessionId,
  };
  return NextResponse.json(out);
}
