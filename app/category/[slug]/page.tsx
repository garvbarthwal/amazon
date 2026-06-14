import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { FilterRail } from "@/components/filter-rail";
import {
  listProducts,
  resolveCategorySlug,
  listCategories,
} from "@/lib/services/products";
import { ProductsQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const isSearch = slug === "search";

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "relevance";

  let categoryName: string | null = null;
  if (!isSearch) {
    categoryName = await resolveCategorySlug(slug);
    if (!categoryName) notFound();
  }

  const parsed = ProductsQuerySchema.safeParse({
    q: isSearch ? q : undefined,
    category: !isSearch ? categoryName ?? undefined : undefined,
    sort: sortRaw,
    page: typeof sp.page === "string" ? sp.page : undefined,
  });
  if (!parsed.success) notFound();

  const [{ items, total }, cats] = await Promise.all([
    listProducts(parsed.data),
    listCategories(),
  ]);

  const title = isSearch ? (q ?? "Search") : categoryName!;

  return (
    <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
      <nav className="text-[13px] text-[#565959] mb-[14px]">
        <Link href="/" className="text-[#007185]">Home</Link>
        <span className="mx-[7px] text-[#aaa]">/</span>
        <span className="text-[#0f1111] font-semibold">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-5 items-start">
        <FilterRail
          categories={cats}
          activeCategorySlug={isSearch ? null : slug}
          activeSort={parsed.data.sort}
          searchQuery={isSearch ? q ?? "" : undefined}
        />

        <section>
          <div className="flex items-end justify-between mb-[14px]">
            <h1 className="m-0 text-[28px] font-extrabold text-[#0f1111]">{title}</h1>
            <span className="text-sm text-[#565959]">{total.toLocaleString("en-IN")} items</span>
          </div>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-[14px]">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#e7e7e7] rounded-xl p-16 text-center text-[#565959]">
              <div className="text-[40px] mb-[10px]">🔍</div>
              <div className="text-[18px] font-bold text-[#0f1111] mb-[6px]">
                No results for “{title}”
              </div>
              <div className="text-sm">Try a different search or browse a category above.</div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
