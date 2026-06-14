import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const STOPWORDS = new Set([
  "the", "and", "with", "for", "from", "of", "on", "in", "by", "to", "or",
  "a", "an", "is", "at", "as", "be", "no", "up", "do", "it", "g", "kg",
  "ml", "l", "pcs",
]);

export type Candidate = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  size: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  deliveryMin: number;
  status: string;
  tags: string[];
  rankScore: number;
  img: string;
  matchScore: number;
};

const SELECT = {
  id: true, name: true, brand: true, category: true, subCategory: true,
  size: true, price: true, mrp: true, rating: true, ratingCount: true,
  deliveryMin: true, status: true, tags: true, rankScore: true, img: true,
} as const;

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .slice(0, 6);
}

export async function retrieveCandidates(query: string, limit = 12): Promise<Candidate[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const where: Prisma.ProductWhereInput = {
    status: "Available",
    OR: tokens.flatMap((t) => [
      { name: { contains: t, mode: "insensitive" as const } },
      { brand: { contains: t, mode: "insensitive" as const } },
      { tags: { has: t } },
    ]),
  };

  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ rankScore: "desc" }],
    take: 80,
    select: SELECT,
  });

  return rows
    .map((r) => {
      const lname = r.name.toLowerCase();
      const lbrand = r.brand.toLowerCase();
      let boost = 0;
      for (const t of tokens) {
        if (lbrand.includes(t)) boost += 2.0;
        if (lname.includes(t))  boost += 1.0;
        if (r.tags.some((tag) => tag.toLowerCase().includes(t))) boost += 0.5;
      }
      return { ...r, matchScore: r.rankScore + boost };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
