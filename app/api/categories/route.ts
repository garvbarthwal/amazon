import { NextResponse } from "next/server";
import { listCategories } from "@/lib/services/products";

export async function GET() {
  const cats = await listCategories();
  return NextResponse.json(cats);
}
