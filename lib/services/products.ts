import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify, unslugify } from "@/lib/format";
import { tileMeta, CATEGORY_TILE_META } from "@/lib/theme";

export type ProductDTO = {
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
};

const SELECT = {
  id: true, name: true, brand: true, category: true, subCategory: true,
  size: true, price: true, mrp: true, rating: true, ratingCount: true,
  deliveryMin: true, status: true, tags: true, rankScore: true, img: true,
} as const;

export type CategoryDTO = {
  name: string;
  slug: string;
  count: number;
  icon: string;
  bg: string;
  hasArt: boolean;
};

let categoryCache: { at: number; data: CategoryDTO[] } | null = null;
const CATEGORY_TTL = 60 * 1000;

export async function listCategories(): Promise<CategoryDTO[]> {
  if (categoryCache && Date.now() - categoryCache.at < CATEGORY_TTL) {
    return categoryCache.data;
  }
  try {
    const rows = await prisma.product.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    });
    const data: CategoryDTO[] = rows
      .filter((r) => r.category && r.category !== "Uncategorised")
      .map((r) => {
        const meta = tileMeta(r.category);
        return {
          name: r.category,
          slug: slugify(r.category),
          count: r._count._all,
          icon: meta.icon,
          bg: meta.bg,
          // True only when the category has explicit metadata in the
          // theme map — used on the home page to skip generic-fallback tiles.
          hasArt: r.category in CATEGORY_TILE_META,
        };
      });
    categoryCache = { at: Date.now(), data };
    return data;
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<ProductDTO | null> {
  return prisma.product.findUnique({ where: { id }, select: SELECT });
}

export async function getRelated(id: string, limit = 8): Promise<ProductDTO[]> {
  const p = await prisma.product.findUnique({
    where: { id },
    select: { category: true, subCategory: true, tags: true },
  });
  if (!p) return [];
  return prisma.product.findMany({
    where: {
      id: { not: id },
      OR: [
        { subCategory: p.subCategory || undefined },
        { category: p.category },
      ],
      status: "Available",
    },
    orderBy: { rankScore: "desc" },
    take: limit,
    select: SELECT,
  });
}

export type ProductsListInput = {
  q?: string;
  category?: string;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating" | "discount";
  page?: number;
  pageSize?: number;
};

export async function listProducts(input: ProductsListInput) {
  const { q, category, sort = "relevance", page = 1, pageSize = 30 } = input;

  const where: Prisma.ProductWhereInput = { status: "Available" };

  if (category) {
    where.category = category;
  }
  if (q) {
    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 2)
      .slice(0, 6);
    if (tokens.length > 0) {
      where.OR = tokens.flatMap((t) => [
        { name: { contains: t, mode: "insensitive" as const } },
        { brand: { contains: t, mode: "insensitive" as const } },
        { tags: { has: t } },
      ]);
    }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (sort) {
      case "price-asc":  return [{ price: "asc" }];
      case "price-desc": return [{ price: "desc" }];
      case "rating":     return [{ rating: "desc" }, { ratingCount: "desc" }];
      case "discount":   return [{ rankScore: "desc" }];
      default:           return [{ rankScore: "desc" }, { ratingCount: "desc" }];
    }
  })();

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: SELECT,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function topByDiscount(limit = 12): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({
    where: { status: "Available", mrp: { gt: 0 } },
    orderBy: [{ rankScore: "desc" }],
    take: 200,
    select: SELECT,
  });
  return rows
    .map((p) => ({ p, pct: p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0 }))
    .filter((x) => x.pct > 0.05)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit)
    .map((x) => x.p);
}

export async function listByCategory(category: string, limit = 12): Promise<ProductDTO[]> {
  return prisma.product.findMany({
    where: { category, status: "Available" },
    orderBy: [{ rankScore: "desc" }],
    take: limit,
    select: SELECT,
  });
}

export async function resolveCategorySlug(slug: string): Promise<string | null> {
  if (slug === "search") return null;
  const cats = await listCategories();
  const exact = cats.find((c) => c.slug === slug);
  return exact?.name ?? unslugify(slug, cats.map((c) => c.name));
}

export async function fetchByIds(ids: string[]): Promise<ProductDTO[]> {
  if (ids.length === 0) return [];
  return prisma.product.findMany({
    where: { id: { in: ids } },
    select: SELECT,
  });
}
