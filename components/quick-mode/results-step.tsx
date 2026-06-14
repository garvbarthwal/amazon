"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { getVibe } from "@/lib/theme";
import { formatRupees } from "@/lib/format";
import { ProductTile } from "@/components/product-tile";
import type { ProductDTO } from "@/lib/services/products";
import type { CartLineItem } from "@/lib/services/tier-builder";

export type QuickResponse = {
  vibe_category: string;
  shopping_list: { query: string; quantity: number }[];
  cart: {
    items: CartLineItem[];
    total: number;
    savings: number;
    itemCount: number;
    deliveryMin: number;
  };
  usedFallback: boolean;
};

export function QuickResultsStep({
  data,
  onClose,
  onBack,
}: {
  data: QuickResponse;
  onClose: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const addMany = useCart((s) => s.addMany);

  // Local editable cart, seeded from the API response.
  const [qCart, setQCart] = useState<Record<string, CartLineItem>>(() => {
    const seed: Record<string, CartLineItem> = {};
    for (const it of data.cart.items) seed[it.productId] = it;
    return seed;
  });

  // Re-seed if the user comes back with a fresh response.
  useEffect(() => {
    const seed: Record<string, CartLineItem> = {};
    for (const it of data.cart.items) seed[it.productId] = it;
    setQCart(seed);
  }, [data]);

  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<ProductDTO[]>([]);

  const lines = Object.values(qCart).filter((l) => l.qty > 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const eta = lines.length ? Math.max(...lines.map((l) => l.deliveryMin), 12) : 12;

  const vibe = getVibe(data.vibe_category);

  // Search the catalog as the user types.
  useEffect(() => {
    const q = addQuery.trim();
    if (!q) { setAddResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(q)}&pageSize=8`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d: { items: ProductDTO[] }) => {
          const inCart = new Set(Object.keys(qCart));
          setAddResults((d.items ?? []).filter((p) => !inCart.has(p.id)).slice(0, 6));
        })
        .catch(() => {});
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [addQuery, qCart]);

  const inc = (id: string) => setQCart((c) => ({ ...c, [id]: { ...c[id], qty: c[id].qty + 1 } }));
  const dec = (id: string) =>
    setQCart((c) => {
      const next = (c[id].qty ?? 0) - 1;
      if (next <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...c[id], qty: next } };
    });
  const removeLine = (id: string) =>
    setQCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  const addProduct = (p: ProductDTO) => {
    setQCart((c) => ({
      ...c,
      [p.id]: c[p.id]
        ? { ...c[p.id], qty: c[p.id].qty + 1 }
        : {
            productId: p.id,
            name: p.name,
            brand: p.brand,
            price: p.price,
            mrp: p.mrp,
            size: p.size,
            img: p.img,
            qty: 1,
            query: addQuery,
            deliveryMin: p.deliveryMin,
            tags: p.tags,
          },
    }));
    setAddQuery("");
    setAddResults([]);
  };

  const checkout = () => {
    if (lines.length === 0) { toast("Your cart is empty"); return; }
    addMany(lines.map((l) => ({ id: l.productId, qty: l.qty })));
    toast(`Added ${count} items to cart`);
    onClose();
    router.push("/checkout");
  };

  const hasAddResults = addResults.length > 0 && addQuery.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      {/* Vibe banner */}
      <div className="text-white px-[30px] py-5 flex items-center gap-4" style={{ background: vibe.gradient }}>
        <div className="text-[40px] leading-none">{vibe.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[22px] font-extrabold">{vibe.name}</div>
          <div className="text-[13px] text-white/85">
            Your cart is ready — adjust anything before checkout.
          </div>
        </div>
        <div className="hidden md:flex flex-wrap gap-[7px] justify-end max-w-[360px]">
          {data.shopping_list.map((s) => (
            <span
              key={s.query}
              className="bg-white/20 border border-white/30 text-[12px] font-bold px-[10px] py-[5px] rounded-[14px] whitespace-nowrap"
            >
              {s.query} ×{s.quantity}
            </span>
          ))}
        </div>
      </div>

      {/* Editable cart */}
      <div className="px-[30px] pt-[22px] pb-[6px]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[16px] font-extrabold">
            Your cart{" "}
            <span className="text-[13px] font-normal text-[#565959]">
              · {count} item{count === 1 ? "" : "s"} · {eta} min delivery
            </span>
          </div>
          {data.usedFallback && (
            <div className="text-[11px] text-[#8a8f94]">Built with rule-based fallback</div>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="flex flex-col gap-[10px] mb-4">
            {lines.map((l) => (
              <div
                key={l.productId}
                className="grid grid-cols-[52px_1fr_auto_auto] gap-[14px] items-center px-3 py-[10px] border border-[#ededed] rounded-[10px]"
              >
                <div className="w-[52px] h-[52px] rounded-lg overflow-hidden">
                  <ProductTile
                    product={{ name: l.name, brand: l.brand, size: l.size, tags: l.tags, img: l.img }}
                    size="thumb-xs"
                    showSize={false}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[#0f1111] leading-[1.25] line-clamp-1">{l.name}</div>
                  <div className="text-[11.5px] text-[#8a8f94] uppercase tracking-[0.04em]">{l.brand} · {l.size}</div>
                </div>
                <div className="flex items-center border border-[#d5d9d9] rounded-lg overflow-hidden">
                  <button onClick={() => dec(l.productId)} className="w-8 h-[30px] border-0 bg-[#f0f2f2] text-[16px] font-bold cursor-pointer">−</button>
                  <span className="w-[34px] text-center text-[14px] font-bold">{l.qty}</span>
                  <button onClick={() => inc(l.productId)} className="w-8 h-[30px] border-0 bg-[#f0f2f2] text-[16px] font-bold cursor-pointer">+</button>
                </div>
                <div className="flex flex-col items-end gap-[2px]">
                  <span className="text-[15px] font-extrabold whitespace-nowrap">₹{formatRupees(l.price * l.qty)}</span>
                  <button
                    onClick={() => removeLine(l.productId)}
                    className="bg-transparent border-0 text-[#8a8f94] hover:text-[#cc0c39] hover:underline text-[11px] cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[#565959] text-[14px] px-6 py-6 border border-dashed border-[#d5d9d9] rounded-[10px] mb-4">
            Your cart is empty — add an item below.
          </div>
        )}

        {/* Add any item */}
        <div className="relative mb-[6px]">
          <div className="relative">
            <Plus
              size={16}
              stroke="#8a8f94"
              className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Add any item — search milk, chips, cola…"
              className="w-full h-11 border-[1.5px] border-[#e0e0e0] rounded-[10px] pl-9 pr-[14px] text-[14px] outline-none box-border text-[#0f1111] focus:border-[#ff9900]"
            />
          </div>
          {hasAddResults && (
            <div className="absolute left-0 right-0 top-12 z-[5] bg-white border border-[#e0e0e0] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden max-h-[260px] overflow-y-auto">
              {addResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="flex items-center gap-3 w-full text-left border-0 bg-white hover:bg-[#fafafa] px-3 py-[9px] cursor-pointer border-b border-[#f3f3f3] last:border-b-0"
                >
                  <span className="w-[38px] h-[38px] shrink-0 rounded-md overflow-hidden">
                    <ProductTile product={p} size="thumb-xs" showSize={false} showBrand={false} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#0f1111] truncate">{p.name}</span>
                    <span className="text-[11px] text-[#8a8f94]">{p.brand}</span>
                  </span>
                  <span className="text-[13px] font-extrabold text-[#0f1111] whitespace-nowrap">₹{p.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkout bar */}
      <div className="px-[30px] py-[14px] pt-[18px] border-t border-[#f0f0f0] mt-2 flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="bg-transparent border-0 text-[#007185] text-[13px] font-bold cursor-pointer"
        >
          ← Edit request
        </button>
        <div className="flex items-center gap-[18px]">
          <div className="text-right">
            <div className="text-[12px] text-[#565959]">Subtotal</div>
            <div className="text-[22px] font-extrabold">₹{formatRupees(subtotal)}</div>
          </div>
          <button
            onClick={checkout}
            disabled={lines.length === 0}
            className="h-12 px-7 border-0 rounded-[24px] cursor-pointer text-[#0f1111] font-extrabold text-[15px] disabled:opacity-50"
            style={{ background: "linear-gradient(#ffb84d,#ff9900)" }}
          >
            Proceed to checkout →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
