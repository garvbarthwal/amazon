import { NextRequest, NextResponse } from "next/server";
import { ProductsQuerySchema } from "@/lib/schemas";
import { listProducts } from "@/lib/services/products";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsed = ProductsQuerySchema.safeParse(Object.fromEntries(sp.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await listProducts(parsed.data);
  return NextResponse.json(result);
}
