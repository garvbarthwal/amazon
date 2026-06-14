import { ProductCard } from "@/components/product-card";
import type { ProductDTO } from "@/lib/services/products";
import Link from "next/link";

export function ProductRow({
  title,
  subtitle,
  seeAllHref,
  products,
}: {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  products: ProductDTO[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="bg-white border border-[#e7e7e7] rounded-xl p-[18px] pb-5 mb-[18px]">
      <div className="flex items-center justify-between mb-[14px]">
        <div>
          <h2 className="m-0 text-[21px] font-extrabold text-[#0f1111]">{title}</h2>
          {subtitle && <div className="text-[13px] text-[#565959] mt-[2px]">{subtitle}</div>}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-[#007185] text-sm font-bold hover:text-[#c45500]"
          >
            See all →
          </Link>
        )}
      </div>
      <div
        className="grid grid-flow-col auto-cols-[212px] gap-[14px] overflow-x-auto pb-[6px] ap-no-scrollbar"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[212px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
