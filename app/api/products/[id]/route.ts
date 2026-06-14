import { NextResponse } from "next/server";
import { getProduct, getRelated } from "@/lib/services/products";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const related = await getRelated(id, 10);
  return NextResponse.json({ product, related });
}
