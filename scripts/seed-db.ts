import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { products as seedProducts, type SeedProduct } from "../seed";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

const STOPWORDS = new Set([
  "the", "and", "with", "for", "from", "of", "on", "in", "by", "to", "or", "a", "an",
  "is", "at", "as", "be", "no", "up", "do", "it", "g", "kg", "ml", "l", "pcs", "pack",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "100", "200", "250", "500",
]);

const COMMON_BRANDS = new Set([
  "AASHIRVAAD", "AMUL", "BRITANNIA", "PARLE", "MAGGI", "MAGGIE", "NESTLE", "NESCAFE",
  "TATA", "FORTUNE", "DABUR", "PATANJALI", "HALDIRAM", "BIKAJI", "BINGO", "KURKURE",
  "LAY", "LAYS", "PEPSI", "COKE", "FANTA", "SPRITE", "LIMCA", "BISLERI", "AQUAFINA",
  "TROPICANA", "REAL", "FROOTI", "MAAZA", "CADBURY", "HERSHEY", "FERRERO", "OREO",
  "KELLOGG", "QUAKER", "PILLSBURY", "ITC", "SAFFOLA", "MOTHER", "DAIRY", "MOTHER'S",
  "RAJDHANI", "HORLICKS", "BOOST", "BOURNVITA", "PEDIGREE", "WHISKAS", "DRIVE",
  "VIM", "SURF", "ARIEL", "TIDE", "HARPIC", "LIZOL", "DETTOL", "LIFEBUOY", "SAVLON",
  "DOVE", "PONDS", "POND'S", "NIVEA", "HIMALAYA", "BIOTIQUE", "MAMA", "JOHNSON",
  "JOHNSON'S", "PAMPERS", "HUGGIES", "MAMYPOKO", "MOMS", "WHISPER", "STAYFREE",
  "VIVEL", "SANTOOR", "HAMAM", "MEDIMIX", "CHANDRIKA", "MYSORE", "SANDAL", "AXE",
  "GILLETTE", "VENUS", "OLD", "SPICE", "DENVER", "PARK", "AVENUE", "FOGG", "WILD",
  "STONE", "SET", "WET", "ENGAGE", "PEPSODENT", "COLGATE", "CLOSEUP", "SENSODYNE",
  "ORAL-B", "ORAL", "VICCO", "MEMBO", "ORAJEL", "PRINGLES", "DORITOS", "ACT",
  "LIPTON", "RED", "BULL", "MOUNTAIN", "DEW", "7UP", "THUMS", "MIRINDA", "BOVONTO",
  "SLICE", "MINUTE", "MAID", "TANG", "RASNA",
]);

const FILLER_WORDS = new Set([
  "no", "maida", "made", "from", "100", "with", "pouch", "carton", "bottle", "pack",
  "box", "sachet", "tin", "can", "powder", "premium", "select", "classic", "original",
  "regular", "fresh", "new", "ready", "natural", "instant", "mini", "big", "small",
  "large", "medium", "single", "double", "twin", "family", "value", "saver",
]);

function deriveBrand(name: string): string {
  if (!name) return "BRAND";
  const cleaned = name.replace(/[^A-Za-z0-9 '\-/]/g, " ").trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "BRAND";

  for (const t of tokens) {
    const upper = t.toUpperCase();
    if (COMMON_BRANDS.has(upper) || COMMON_BRANDS.has(upper.replace(/'S$/, ""))) {
      return upper;
    }
  }

  const first = tokens[0]!;
  if (first.length >= 3 && first === first.toUpperCase() && /[A-Z]/.test(first)) return first;
  return first.toUpperCase();
}

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !FILLER_WORDS.has(w));
}

function deriveTags(name: string, subCategory: string, deliveryMin: number): string[] {
  const tags = new Set<string>();
  if (subCategory) tags.add(subCategory.toLowerCase());
  for (const t of tokenize(name).slice(0, 8)) tags.add(t);
  if (deliveryMin <= 10) tags.add("fast-delivery");
  return Array.from(tags);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function deliveryMinFor(id: string): number {
  return 8 + (hashCode(id) % 13);
}

function rankScore(rating: number, ratingCount: number): number {
  return Math.log10((ratingCount || 0) + 1) * (rating || 0);
}

async function main() {
  console.log(`Wiping existing Product rows…`);
  try {
    const wiped = await prisma.product.deleteMany({});
    console.log(`  deleted ${wiped.count}`);
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2021") {
      console.log(`  Product table missing — run \`npx prisma migrate dev\` first.`);
      process.exit(1);
    }
    throw e;
  }

  console.log(`Seeding ${seedProducts.length} products…`);
  const start = Date.now();

  const BATCH = 1000;
  let processed = 0;
  const byCat: Record<string, number> = {};

  for (let i = 0; i < seedProducts.length; i += BATCH) {
    const batch = seedProducts.slice(i, i + BATCH);
    const rows = batch.map((p: SeedProduct) => {
      const deliveryMin = deliveryMinFor(p.id);
      byCat[p.category] = (byCat[p.category] ?? 0) + 1;
      return {
        id: p.id,
        name: p.name,
        brand: deriveBrand(p.name),
        category: p.category || "Uncategorised",
        subCategory: p.subCategory || "",
        size: p.quantity || "",
        price: Math.max(1, Math.round(p.price)),
        mrp: Math.max(Math.round(p.originalPrice) || Math.round(p.price), Math.round(p.price)),
        rating: Number.isFinite(p.rating) ? p.rating : 4.0,
        ratingCount: Math.max(0, Math.round(p.reviewCount)),
        deliveryMin,
        status: p.status || "Available",
        tags: deriveTags(p.name, p.subCategory, deliveryMin),
        rankScore: rankScore(p.rating, p.reviewCount),
        img: p.image || "",
      };
    });

    await prisma.product.createMany({ data: rows, skipDuplicates: true });
    processed += rows.length;
    if (processed % 5000 === 0 || processed === seedProducts.length) {
      console.log(`  …${processed}/${seedProducts.length}`);
    }
  }

  const took = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${took}s. Counts by category:`);
  Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${v.toString().padStart(5)} ${k}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
