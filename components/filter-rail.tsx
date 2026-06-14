"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { CategoryDTO } from "@/lib/services/products";

const SORTS = [
  { value: "relevance",  label: "Relevance" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating",     label: "Avg. customer review" },
  { value: "discount",   label: "Biggest discount" },
] as const;

export function FilterRail({
  categories,
  activeCategorySlug,
  activeSort,
  searchQuery,
}: {
  categories: CategoryDTO[];
  activeCategorySlug: string | null;
  activeSort: string;
  searchQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const onSortClick = (val: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set("sort", val);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <aside className="bg-white border border-[#e7e7e7] rounded-xl p-4 pb-2 lg:sticky lg:top-[118px]">
      <div className="text-[15px] font-extrabold mb-[10px]">Department</div>
      <div className="flex flex-col gap-[2px] mb-[18px] max-h-[40vh] overflow-y-auto">
        {categories.map((c) => {
          const active = !searchQuery && c.slug === activeCategorySlug;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="text-left text-sm px-2 py-[7px] rounded-md cursor-pointer"
              style={{
                color: active ? "#0f1111" : "#007185",
                fontWeight: active ? 800 : 400,
                background: active ? "#f3f4f4" : "transparent",
              }}
            >
              {c.name}{" "}
              <span className="text-[#8a8f94] text-[11px] font-normal">
                ({c.count.toLocaleString("en-IN")})
              </span>
            </Link>
          );
        })}
      </div>

      <div className="text-[15px] font-extrabold mb-[10px] border-t border-[#eee] pt-[14px]">
        Sort by
      </div>
      <div className="flex flex-col gap-[2px] pb-2">
        {SORTS.map((s) => {
          const active = s.value === activeSort;
          return (
            <button
              key={s.value}
              onClick={() => onSortClick(s.value)}
              className="text-left border-0 text-sm px-2 py-[7px] rounded-md cursor-pointer"
              style={{
                color: active ? "#0f1111" : "#007185",
                fontWeight: active ? 800 : 400,
                background: active ? "#f3f4f4" : "transparent",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
