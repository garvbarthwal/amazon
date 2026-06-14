import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RECURRING_CONFIG } from "@/lib/recurring";

const SELECT = {
  id: true, name: true, brand: true, category: true, subCategory: true,
  size: true, price: true, mrp: true, rating: true, ratingCount: true,
  deliveryMin: true, status: true, tags: true, rankScore: true, img: true,
} as const;

// Returns the recurring/replenishable products from the catalog.
// One row per matching recurrence key, with the suggested intervalDays.
export async function GET() {
  try {
    const out: Array<{ product: unknown; intervalDays: number }> = [];
    const seen = new Set<string>();

    for (const r of RECURRING_CONFIG) {
      // Match each key against name/brand/tags (case-insensitive).
      const candidates = await prisma.product.findMany({
        where: {
          status: "Available",
          OR: r.keys.flatMap((k) => [
            { name: { contains: k, mode: "insensitive" as const } },
            { brand: { contains: k, mode: "insensitive" as const } },
            { tags: { has: k.toLowerCase() } },
          ]),
        },
        orderBy: [{ rankScore: "desc" }, { ratingCount: "desc" }],
        take: 3,
        select: SELECT,
      });

      const top = candidates[0];
      if (top && !seen.has(top.id)) {
        seen.add(top.id);
        out.push({ product: top, intervalDays: r.days });
      }
    }

    return NextResponse.json({ items: out });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
