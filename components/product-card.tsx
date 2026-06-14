"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { discountPct, formatCount, starPct } from "@/lib/format";
import type { ProductDTO } from "@/lib/services/products";

export function ProductCard({ product }: { product: ProductDTO }) {
  const router = useRouter();
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const add = useCart((s) => s.add);
  const inc = useCart((s) => s.inc);
  const dec = useCart((s) => s.dec);

  const [imgError, setImgError] = useState(false);
  const pct = discountPct(product.price, product.mrp);
  const showImg = !!product.img && !imgError;

  const onOpen = () => router.push(`/product/${product.id}`);
  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    add(product.id, 1);
    toast(`Added ${product.name.slice(0, 36)}${product.name.length > 36 ? "…" : ""} to cart`);
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-white border border-[#e7e7e7] rounded-lg p-[10px] ap-card-hover">
      <div className="relative h-[170px] rounded-md overflow-hidden bg-[#f7f8f8] mb-2">
        {!showImg && (
          <div
            className="absolute inset-0 flex items-center justify-center p-[14px] text-center"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,#f2f3f3 0 10px,#f7f8f8 10px 20px)" }}
          >
            <span className="font-mono text-[11px] text-[#9aa0a6] leading-[1.4] line-clamp-3">
              {product.name}
            </span>
          </div>
        )}
        {showImg && (
          <Image
            src={product.img}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 220px"
            className="object-contain p-2 bg-white"
            onError={() => setImgError(true)}
            unoptimized
          />
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-[rgba(19,25,33,0.88)] text-white text-[11px] font-bold px-[8px] py-[3px] rounded-[20px] z-10">
          <span className="w-[6px] h-[6px] rounded-full bg-[#46e07f] inline-block" />
          {product.deliveryMin} min
        </div>
        {pct > 0 && (
          <div className="absolute top-2 right-2 bg-[#cc0c39] text-white text-[11px] font-extrabold px-[7px] py-[3px] rounded-[4px] z-10">
            -{pct}%
          </div>
        )}
      </div>

      <div onClick={onOpen} className="cursor-pointer flex-1 flex flex-col">
        <div className="text-[11px] font-bold tracking-[0.04em] text-[#8a8f94] uppercase mb-[2px]">
          {product.brand}
        </div>
        <div className="text-[14px] text-[#0f1111] leading-[1.35] mb-[6px] line-clamp-2 min-h-[38px]">
          {product.name}
        </div>
        <div className="text-[12px] text-[#8a8f94] mb-[6px]">{product.size}</div>
        <div className="flex items-center gap-[6px] mb-2">
          <span className="relative inline-block text-[13px] tracking-[1px] text-[#e3e6e6] h-4">
            ★★★★★
            <span
              className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-[#ffa41c]"
              style={{ width: starPct(product.rating) }}
            >
              ★★★★★
            </span>
          </span>
          <span className="text-[12px] text-[#007185]">({formatCount(product.ratingCount)})</span>
        </div>
        <div className="flex items-baseline gap-[6px] mt-auto">
          <span className="text-[13px] text-[#0f1111]">₹</span>
          <span className="text-[21px] font-bold text-[#0f1111] leading-none">{product.price}</span>
          {pct > 0 && (
            <span className="text-[12px] text-[#8a8f94] line-through">₹{product.mrp}</span>
          )}
        </div>
      </div>

      <div className="mt-[10px]">
        {qty > 0 ? (
          <div className="flex items-center justify-between h-9 ap-cta-yellow rounded-[20px] overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); dec(product.id); }}
              className="w-11 h-full border-0 bg-transparent text-xl font-bold text-[#3b2f00] cursor-pointer"
              aria-label="Decrease"
            >−</button>
            <span className="text-[15px] font-bold text-[#0f1111]">{qty}</span>
            <button
              onClick={(e) => { e.stopPropagation(); inc(product.id); }}
              className="w-11 h-full border-0 bg-transparent text-xl font-bold text-[#3b2f00] cursor-pointer"
              aria-label="Increase"
            >+</button>
          </div>
        ) : (
          <button
            onClick={onAdd}
            className="w-full h-9 ap-cta-yellow rounded-[20px] text-sm font-semibold text-[#0f1111] cursor-pointer"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#e7e7e7] rounded-lg p-[10px] h-[370px] flex flex-col gap-2">
      <div className="h-[170px] rounded-md bg-[#f7f8f8] animate-pulse" />
      <div className="h-3 w-1/3 bg-[#eee] rounded animate-pulse" />
      <div className="h-4 w-full bg-[#eee] rounded animate-pulse" />
      <div className="h-4 w-2/3 bg-[#eee] rounded animate-pulse" />
      <div className="mt-auto h-9 bg-[#eee] rounded-[20px] animate-pulse" />
    </div>
  );
}
