export const formatRupees = (n: number): string =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

export const formatCount = (n: number): string =>
  new Intl.NumberFormat("en-IN").format(n);

export const discountPct = (price: number, mrp: number): number =>
  mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

export const starPct = (rating: number): string =>
  ((Math.max(0, Math.min(5, rating)) / 5) * 100).toFixed(1) + "%";

export const slugify = (s: string): string =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const unslugify = (slug: string, candidates: string[]): string | null =>
  candidates.find((c) => slugify(c) === slug) ?? null;

export const orderIdShort = (id: string): string =>
  "AP" + id.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-8).padStart(8, "0");
