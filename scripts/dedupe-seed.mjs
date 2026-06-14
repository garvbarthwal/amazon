import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SEED = resolve(ROOT, "seed.ts");

const src = readFileSync(SEED, "utf8");
const marker = "export const products: SeedProduct[] = ";
const markerAt = src.indexOf(marker);
if (markerAt === -1) throw new Error("Cannot locate products array in seed.ts");
const arrStart = markerAt + marker.length;
const arrEnd = src.lastIndexOf("];");
if (src[arrStart] !== "[") throw new Error("Expected '[' at array start");
const arrText = src.slice(arrStart, arrEnd + 1);
const products = JSON.parse(arrText);

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const byKey = new Map();
let dropped = 0;

for (const p of products) {
  const key = `${norm(p.name)}|${norm(p.quantity)}`;
  const existing = byKey.get(key);
  if (!existing) {
    byKey.set(key, p);
    continue;
  }
  dropped++;
  // Prefer the cheaper price; on tie, the one with more reviews; on tie, the first.
  const better =
    p.price < existing.price
      ? p
      : p.price > existing.price
        ? existing
        : (p.reviewCount ?? 0) > (existing.reviewCount ?? 0)
          ? p
          : existing;
  byKey.set(key, better);
}

const deduped = Array.from(byKey.values());

const header = src.slice(0, arrStart);
const footer = src.slice(arrEnd + 1);
writeFileSync(SEED, header + JSON.stringify(deduped, null, 2) + footer, "utf8");

console.log(`Original:  ${products.length}`);
console.log(`Dropped:   ${dropped}`);
console.log(`Remaining: ${deduped.length}`);
