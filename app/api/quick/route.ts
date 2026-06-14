import { NextRequest, NextResponse } from "next/server";
import { QuickRequestSchema } from "@/lib/schemas";
import { decomposeIntent } from "@/lib/services/intent";
import { buildSingleCart } from "@/lib/services/tier-builder";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = QuickRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { intent, groupSize, zoneCode } = parsed.data;

  const decomposed = await decomposeIntent(intent, groupSize);
  const cart = await buildSingleCart(decomposed, groupSize);

  return NextResponse.json({
    vibe_category: decomposed.vibe_category,
    shopping_list: decomposed.shopping_list,
    cart,
    usedFallback: decomposed.usedFallback,
    zoneCode,
  });
}
