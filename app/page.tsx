import Link from "next/link";
import { HeroQuick } from "@/components/hero-quick";
import { ProductRow } from "@/components/product-row";
import { PredictiveSection } from "@/components/predictive-section";
import {
  listCategories,
  listByCategory,
  topByDiscount,
} from "@/lib/services/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cats = await listCategories();
  // Only show category tiles whose category has bespoke art (icon + bg)
  // in the theme map. Categories that fall back to the generic 🛒/grey
  // would look like placeholders, so hide them from the home grid.
  const tiles = cats.filter((c) => c.hasArt).slice(0, 5);
  const pickRow = (preferred: string[]): { name: string } | null => {
    for (const want of preferred) {
      const m = cats.find((c) => c.name.toLowerCase().includes(want.toLowerCase()));
      if (m) return { name: m.name };
    }
    return cats[0] ?? null;
  };
  const drinkCat = pickRow(["cold drink", "drink", "juice", "beverage"]);
  const snackCat = pickRow(["snack", "munch", "chip", "biscuit"]);

  const [deals, drinkRow, snackRow] = await Promise.all([
    topByDiscount(12),
    drinkCat ? listByCategory(drinkCat.name, 12) : Promise.resolve([]),
    snackCat && snackCat.name !== drinkCat?.name
      ? listByCategory(snackCat.name, 12)
      : Promise.resolve([]),
  ]);

  return (
    <main className="max-w-[1500px] mx-auto p-[18px]">
      <HeroQuick />

      <PredictiveSection />

      {tiles.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[14px] mb-6">
          {tiles.map((t) => (
            <Link
              key={t.slug}
              href={`/category/${t.slug}`}
              className="bg-white border border-[#e7e7e7] rounded-[10px] p-4 cursor-pointer ap-card-hover block"
            >
              <div
                className="h-[64px] rounded-lg flex items-center justify-center mb-[10px] text-[28px]"
                style={{ background: t.bg }}
              >
                {t.icon}
              </div>
              <div className="text-[13.5px] font-bold text-[#0f1111] leading-[1.25]">{t.name}</div>
              <div className="text-[12px] text-[#007185] mt-[3px]">Shop now →</div>
            </Link>
          ))}
        </section>
      )}

      <ProductRow
        title="Today's top deals"
        subtitle="Lowest prices, delivered in minutes"
        seeAllHref={drinkCat ? `/category/${cats.find(c=>c.name===drinkCat.name)?.slug ?? ""}` : undefined}
        products={deals}
      />
      {drinkCat && (
        <ProductRow
          title={drinkCat.name}
          subtitle="Chilled and ready to go"
          seeAllHref={`/category/${cats.find(c=>c.name===drinkCat.name)?.slug ?? ""}`}
          products={drinkRow}
        />
      )}
      {snackCat && snackCat.name !== drinkCat?.name && (
        <ProductRow
          title={snackCat.name}
          subtitle="Perfect for the binge"
          seeAllHref={`/category/${cats.find(c=>c.name===snackCat.name)?.slug ?? ""}`}
          products={snackRow}
        />
      )}
    </main>
  );
}
