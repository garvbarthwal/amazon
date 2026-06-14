"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { getVibe } from "@/lib/theme";
import { formatRupees } from "@/lib/format";
import type { CartTier } from "@/lib/services/tier-builder";
import type { QuickResponse } from "@/components/quick-mode/quick-mode-modal";

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
  const vibe = getVibe(data.vibe_category);

  const choose = (cart: CartTier) => {
    if (cart.items.length === 0) return;
    addMany(cart.items.map((i) => ({ id: i.productId, qty: i.qty })));
    onClose();
    router.push("/checkout");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className="relative rounded-xl text-white px-6 py-5 mb-4 overflow-hidden"
        style={{ background: vibe.gradient }}
      >
        <div className="flex items-center gap-3">
          <div className="text-[36px] leading-none">{vibe.emoji}</div>
          <div>
            <div className="text-[12px] uppercase font-extrabold tracking-[0.08em] text-white/80">Vibe</div>
            <div className="text-[22px] font-extrabold leading-tight">{vibe.name}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {data.shopping_list.map((s) => (
            <span
              key={s.query}
              className="text-[12px] bg-white/15 text-white border border-white/25 px-[10px] py-[4px] rounded-full"
            >
              {s.query} × {s.quantity}
            </span>
          ))}
        </div>
        {data.usedFallback && (
          <div className="text-[11px] text-white/80 mt-3">
            Built with rule-based fallback — Gemini unavailable.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.carts.map((cart) => {
          const recommended = cart.key === data.budgetTier;
          const empty = cart.items.length === 0;
          return (
            <motion.div
              key={cart.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl bg-white p-4 flex flex-col"
              style={{
                border: recommended ? `2px solid ${vibe.accent}` : "1px solid #e7e7e7",
                boxShadow: recommended ? `0 6px 18px ${vibe.soft}` : "none",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[18px] font-extrabold">{cart.title}</h3>
                {recommended && (
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-[0.1em] px-[8px] py-[3px] rounded-full"
                    style={{ background: vibe.accent, color: "#fff" }}
                  >
                    Recommended
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#565959] mb-3">
                {cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""} · ETA {cart.deliveryMin} min
              </div>

              {empty ? (
                <div className="text-[13px] text-[#8a8f94] py-4 text-center bg-[#f7f8f8] rounded-md">
                  No matching products in this tier.
                </div>
              ) : (
                <ul className="flex flex-col gap-2 mb-3 max-h-[260px] overflow-y-auto pr-1">
                  {cart.items.map((it) => (
                    <li key={it.productId} className="flex items-center gap-2 text-[13px]">
                      <div className="w-9 h-9 rounded-md bg-[#f7f8f8] overflow-hidden shrink-0">
                        {it.img && <img src={it.img} alt="" className="w-full h-full object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="line-clamp-1 font-bold text-[13px]">{it.name}</div>
                        <div className="text-[11px] text-[#8a8f94]">
                          {it.size} · qty {it.qty} · ₹{formatRupees(it.price)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-[#eee] mt-auto pt-3">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[12px] text-[#565959]">Total</span>
                  <span className="text-[20px] font-extrabold">₹{formatRupees(cart.total)}</span>
                </div>
                <button
                  onClick={() => choose(cart)}
                  disabled={empty}
                  className="w-full h-10 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-50"
                  style={{
                    background: recommended ? vibe.accent : "linear-gradient(#ffd97a,#ff9900)",
                    color: recommended ? "#fff" : "#131921",
                  }}
                >
                  Choose &amp; checkout
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between items-center text-[13px]">
        <button onClick={onBack} className="text-[#007185] hover:text-[#c45500] cursor-pointer bg-transparent border-0">
          ← Try a different prompt
        </button>
        <button onClick={onClose} className="text-[#565959] cursor-pointer bg-transparent border-0">
          Close
        </button>
      </div>
    </motion.div>
  );
}
