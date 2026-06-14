"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import type { ProductDTO } from "@/lib/services/products";

export function ProductDetailClient({ product }: { product: ProductDTO }) {
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items[product.id] ?? 0);

  const onAdd = () => {
    add(product.id, qty);
    toast(`Added ${qty} × ${product.name.slice(0, 32)}${product.name.length > 32 ? "…" : ""}`);
  };

  const onBuyNow = () => {
    if (inCart === 0) add(product.id, qty);
    router.push("/checkout");
  };

  return (
    <aside className="bg-white border border-[#e7e7e7] rounded-xl p-4 lg:sticky lg:top-[120px] h-fit">
      <div className="text-[28px] font-bold text-[#0f1111] mb-1">₹{product.price}</div>
      <div className="text-[14px] text-[#007600] font-bold mb-3">
        FREE delivery in {product.deliveryMin} min
      </div>
      <div className="text-[18px] font-bold text-[#007600] mb-4">In stock</div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-[#0f1111]">Quantity:</span>
        <div className="flex items-center border border-[#d5d9d9] rounded-md overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 bg-[#f3f4f4] text-lg font-bold cursor-pointer"
            aria-label="Decrease quantity"
          >−</button>
          <span className="px-3 text-sm font-bold w-10 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="w-8 h-8 bg-[#f3f4f4] text-lg font-bold cursor-pointer"
            aria-label="Increase quantity"
          >+</button>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="w-full h-[38px] ap-cta-yellow rounded-full text-sm font-semibold text-[#0f1111] cursor-pointer mb-2"
      >
        Add to cart
      </button>
      <button
        onClick={onBuyNow}
        className="w-full h-[38px] ap-cta-orange rounded-full text-sm font-bold text-[#131921] cursor-pointer mb-3"
      >
        Buy now
      </button>

      <div className="text-[12px] text-[#565959] leading-[1.45]">
        Sold by Amazon Picks Fulfillment · Eligible for return within 7 days.
      </div>
    </aside>
  );
}
