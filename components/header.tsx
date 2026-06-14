"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, MapPin, Search, Menu } from "lucide-react";
import { useHydratedCart } from "@/hooks/use-hydrated-cart";
import { QuickModeButton } from "@/components/quick-mode/quick-mode-button";
import { slugify } from "@/lib/format";

type NavCategory = { name: string };

export function Header({ navCategories }: { navCategories: NavCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useHydratedCart();
  const [searchValue, setSearchValue] = useState("");

  const runSearch = () => {
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/category/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#131921] text-white">
      <div className="flex items-center gap-[14px] px-[18px] py-2 max-w-[1680px] mx-auto">
        <Link
          href="/"
          className="flex flex-col items-start cursor-pointer px-2 py-[6px] border border-transparent hover:border-white rounded leading-none"
        >
          <div className="flex items-baseline gap-[5px]">
            <span className="text-[25px] font-extrabold tracking-[-1.2px] text-white">amazon</span>
            <span className="text-[22px] font-extrabold tracking-[-0.5px] text-[#febd69]">picks</span>
          </div>
          <svg width="86" height="11" viewBox="0 0 86 11" className="-mt-px ml-[2px]">
            <path d="M2 3 Q 44 13 84 4" stroke="#ff9900" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M80 2.5 L85 4 L80.5 7.5" stroke="#ff9900" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1 cursor-pointer px-[6px] py-[6px] border border-transparent hover:border-white rounded"
        >
          <MapPin size={18} stroke="#cfd6dc" strokeWidth={1.8} />
          <div className="leading-[1.15]">
            <div className="text-[11px] text-[#cfd6dc]">Deliver to Garv</div>
            <div className="text-[13px] font-bold text-white">Connaught Place 110001</div>
          </div>
        </Link>

        <div className="flex-1 flex items-stretch h-[42px] rounded-lg overflow-hidden bg-white">
          <select
            className="border-0 bg-[#eef1f3] text-[#0f1111] text-[13px] px-3 font-[inherit] cursor-pointer outline-none w-[109px]"
            aria-label="Search category"
          >
            <option>All</option>
            {navCategories.slice(0, 5).map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search Amazon Picks"
            className="flex-1 border-0 outline-none text-[15px] px-[14px] font-[inherit] text-[#0f1111] bg-white"
          />
          <button
            onClick={runSearch}
            aria-label="Search"
            className="w-[52px] border-0 cursor-pointer flex items-center justify-center"
            style={{ background: "linear-gradient(#ffd97a,#febd69)" }}
          >
            <Search size={22} stroke="#131921" strokeWidth={2.2} />
          </button>
        </div>

        <QuickModeButton />

        <Link
          href="/orders"
          className="flex flex-col leading-[1.15] cursor-pointer px-[6px] py-[6px] border border-transparent hover:border-white rounded"
        >
          <span className="text-[11px] text-[#cfd6dc]">Hello, Garv</span>
          <span className="text-[13px] font-bold text-white">Account &amp; Lists ▾</span>
        </Link>

        <Link
          href="/cart"
          className="relative flex items-center gap-2 cursor-pointer px-2 py-[6px] border border-transparent hover:border-white rounded"
        >
          <div className="relative">
            <ShoppingCart size={30} stroke="#fff" strokeWidth={1.7} fill="none" />
            <span className="absolute -top-[6px] -right-[7px] min-w-[20px] h-5 px-[5px] bg-[#febd69] text-[#131921] text-[12px] font-extrabold rounded-[10px] flex items-center justify-center">
              {count}
            </span>
          </div>
          <span className="text-sm font-bold text-white">Cart</span>
        </Link>
      </div>

      <div className="bg-[#232f3e]">
        <div className="flex items-center gap-[2px] px-3 max-w-[1680px] mx-auto overflow-x-auto ap-no-scrollbar">
          <Link
            href="/"
            className="flex items-center gap-[7px] bg-transparent border border-transparent hover:border-white text-white text-sm font-bold px-[10px] py-[9px] cursor-pointer whitespace-nowrap rounded-[3px]"
          >
            <Menu size={18} stroke="#fff" strokeWidth={1.8} />
            All
          </Link>
          {navCategories.map((cat) => {
            const slug = slugify(cat.name);
            const active = pathname === `/category/${slug}`;
            return (
              <Link
                key={cat.name}
                href={`/category/${slug}`}
                className={`bg-transparent border ${active ? "border-white" : "border-transparent"} hover:border-white text-[#e7eaed] hover:text-white text-[13.5px] px-[10px] py-[9px] cursor-pointer whitespace-nowrap rounded-[3px]`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
