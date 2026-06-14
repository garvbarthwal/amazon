import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelated } from "@/lib/services/products";
import { ProductRow } from "@/components/product-row";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductTile } from "@/components/product-tile";
import { discountPct, formatCount, starPct, slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const related = await getRelated(id, 10);
  const pct = discountPct(product.price, product.mrp);
  const youSave = product.mrp - product.price;

  return (
    <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
      <nav className="text-[13px] text-[#565959] mb-[14px]">
        <Link href="/" className="text-[#007185]">Home</Link>
        <span className="mx-[7px] text-[#aaa]">/</span>
        <Link href={`/category/${slugify(product.category)}`} className="text-[#007185]">
          {product.category}
        </Link>
        <span className="mx-[7px] text-[#aaa]">/</span>
        <span className="text-[#0f1111] font-semibold">{product.name}</span>
      </nav>

      <section className="bg-white border border-[#e7e7e7] rounded-xl p-5 grid grid-cols-1 lg:grid-cols-[72px_480px_1fr_320px] gap-5">
        <div className="hidden lg:flex flex-col gap-2">
          <div className="w-[72px] h-[72px] rounded-md border-2 border-[#ff9900] overflow-hidden">
            <ProductTile product={product} size="thumb-sm" showSize={false} />
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden h-[420px] lg:h-[480px]">
          <ProductTile product={product} size="card" />
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-bold tracking-[0.04em] text-[#8a8f94] uppercase mb-1">
            {product.brand}
          </div>
          <h1 className="m-0 text-[26px] font-bold leading-[1.25] text-[#0f1111] mb-2">
            {product.name}
          </h1>
          <Link href={`/category/${slugify(product.category)}`} className="text-[14px] text-[#007185]">
            Visit the {product.brand} store
          </Link>
          <div className="flex items-center gap-2 mt-3 mb-3">
            <span className="relative inline-block text-[16px] tracking-[2px] text-[#e3e6e6]">
              ★★★★★
              <span className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-[#ffa41c]" style={{ width: starPct(product.rating) }}>
                ★★★★★
              </span>
            </span>
            <span className="text-[13px] text-[#007185]">
              {product.rating.toFixed(1)} · {formatCount(product.ratingCount)} ratings
            </span>
          </div>
          <div className="border-t border-[#eee] my-3" />
          <div className="flex items-baseline gap-3 mb-2">
            {pct > 0 && (
              <span className="bg-[#cc0c39] text-white text-[14px] font-bold px-2 py-[2px] rounded">-{pct}%</span>
            )}
            <span className="text-[14px] text-[#0f1111]">₹</span>
            <span className="text-[34px] font-bold text-[#0f1111] leading-none">{product.price}</span>
          </div>
          {pct > 0 && (
            <div className="text-[13px] text-[#565959]">
              M.R.P.: <span className="line-through">₹{product.mrp}</span>{" "}
              <span className="text-[#007600] font-bold">You save ₹{youSave}</span>
            </div>
          )}
          <div className="border-t border-[#eee] my-3" />
          <table className="text-[13px] border-collapse">
            <tbody>
              <tr><td className="text-[#565959] pr-3 py-1">Brand</td><td>{product.brand}</td></tr>
              <tr><td className="text-[#565959] pr-3 py-1">Category</td><td>{product.category}</td></tr>
              {product.subCategory && <tr><td className="text-[#565959] pr-3 py-1">Sub-category</td><td>{product.subCategory}</td></tr>}
              <tr><td className="text-[#565959] pr-3 py-1">Pack size</td><td>{product.size || "—"}</td></tr>
            </tbody>
          </table>
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mt-3">
              {product.tags.slice(0, 8).map((t) => (
                <span key={t} className="text-[12px] text-[#0f1111] bg-[#f3f4f4] px-[10px] py-[4px] rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <ProductDetailClient product={product} />
      </section>

      {related.length > 0 && (
        <div className="mt-5">
          <ProductRow
            title="Frequently bought together"
            subtitle="Customers also like these in the same aisle"
            products={related}
          />
        </div>
      )}
    </main>
  );
}
