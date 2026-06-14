"use client";

import { useState } from "react";
import { tileTint } from "@/lib/theme";

type Sizes = "card" | "thumb-md" | "thumb-sm" | "thumb-xs";

const SIZE_PRESET: Record<Sizes, { brand: string; name: string; size: string; pad: string }> = {
  card:     { brand: "9.5px", name: "15px",  size: "11px",  pad: "p-4" },
  "thumb-md": { brand: "9px",   name: "11px",  size: "10px",  pad: "p-[6px]" },
  "thumb-sm": { brand: "8px",   name: "9.5px", size: "9px",   pad: "p-[5px]" },
  "thumb-xs": { brand: "7px",   name: "8px",   size: "8px",   pad: "p-[4px]" },
};

export function ProductTile({
  product,
  size = "thumb-md",
  className = "",
  showBrand = true,
  showSize = true,
}: {
  product: { name: string; brand: string; size?: string | null; tags?: string[] | null; img?: string | null };
  size?: Sizes;
  className?: string;
  showBrand?: boolean;
  showSize?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const tint = tileTint(product);
  const showImg = !!product.img && !imgError;
  const preset = SIZE_PRESET[size];

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center text-center box-border ${preset.pad} ${className}`}
      style={{ background: tint.bg }}
    >
      <div className="flex flex-col items-center justify-center leading-[1.18]">
        {showBrand && product.brand && (
          <span
            className="font-extrabold uppercase tracking-[0.09em]"
            style={{ fontSize: preset.brand, color: tint.fg, opacity: 0.62, marginBottom: 3 }}
          >
            {product.brand}
          </span>
        )}
        <span
          className="font-extrabold leading-[1.18] line-clamp-3"
          style={{ fontSize: preset.name, color: tint.fg }}
        >
          {product.name}
        </span>
        {showSize && product.size && (
          <span
            className="font-semibold"
            style={{ fontSize: preset.size, color: tint.fg, opacity: 0.72, marginTop: 4 }}
          >
            {product.size}
          </span>
        )}
      </div>
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.img!}
          alt={product.name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-contain p-2 bg-white"
        />
      )}
    </div>
  );
}
