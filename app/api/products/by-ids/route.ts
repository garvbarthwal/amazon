import { NextRequest, NextResponse } from "next/server";
import { fetchByIds } from "@/lib/services/products";

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ items: [] });
  const items = await fetchByIds(ids);
  return NextResponse.json({ items });
}
