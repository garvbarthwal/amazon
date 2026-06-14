"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Clock } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { usePredictionStore } from "@/lib/prediction-store";
import { ProductTile } from "@/components/product-tile";
import { formatRupees } from "@/lib/format";
import type { ProductDTO } from "@/lib/services/products";

type Eligible = { product: ProductDTO; intervalDays: number };

const DAY_MS = 86_400_000;

function seedHistory(items: Eligible[], now: number) {
  // 4 prior orders, last one placed *just past* one cadence ago so the demo
  // reads "Due now" or "Due tomorrow" out of the box.
  const out: { id: string; ts: number }[] = [];
  for (const it of items) {
    const cad = it.intervalDays;
    for (let k = 4; k >= 1; k--) {
      out.push({ id: it.product.id, ts: now - Math.round((k * cad + cad * 0.12) * DAY_MS) });
    }
  }
  return out;
}

export function PredictiveSection() {
  const [eligible, setEligible] = useState<Eligible[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const history = usePredictionStore((s) => s.history);
  const removed = usePredictionStore((s) => s.removed);
  const snooze = usePredictionStore((s) => s.snooze);
  const skipSession = usePredictionStore((s) => s.skipSession);
  const appendOrder = usePredictionStore((s) => s.appendOrder);
  const removePred = usePredictionStore((s) => s.remove);
  const snoozeOne = usePredictionStore((s) => s.snoozeOne);
  const skipOne = usePredictionStore((s) => s.skipOne);

  const add = useCart((s) => s.add);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/predictions/eligible")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: Eligible[] }) => {
        if (cancelled) return;
        setEligible(d.items ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  // Seed order history once eligible items load and history is empty.
  useEffect(() => {
    if (!loaded || eligible.length === 0) return;
    if (history.length > 0) return;
    usePredictionStore.setState({ history: seedHistory(eligible, Date.now()) });
  }, [loaded, eligible, history.length]);

  // Tick once a minute so the "Due now / Due tomorrow" labels stay correct
  // if the modal is open across the boundary.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const cards = useMemo(() => {
    if (!loaded) return [];
    const removedSet = new Set(removed);
    const skipSet = new Set(skipSession);
    const out: Array<{
      product: ProductDTO;
      intervalDays: number;
      daysUntil: number;
      lastDays: number;
      dueLabel: string;
    }> = [];
    for (const it of eligible) {
      const id = it.product.id;
      if (removedSet.has(id) || skipSet.has(id)) continue;
      if (snooze[id] && now < snooze[id]) continue;
      const ordered = history.filter((h) => h.id === id).sort((a, b) => a.ts - b.ts);
      if (ordered.length === 0) continue;
      const last = ordered[ordered.length - 1].ts;
      const daysUntil = Math.round((last + it.intervalDays * DAY_MS - now) / DAY_MS);
      if (daysUntil > 1) continue;
      out.push({
        product: it.product,
        intervalDays: it.intervalDays,
        daysUntil,
        lastDays: Math.max(1, Math.round((now - last) / DAY_MS)),
        dueLabel: daysUntil <= 0 ? "Due now" : "Due tomorrow",
      });
    }
    return out.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [loaded, eligible, history, removed, snooze, skipSession, now]);

  if (!loaded || cards.length === 0) return null;

  return (
    <section className="bg-white border border-[#e7e7e7] rounded-xl px-[18px] pt-[18px] pb-5 mb-[22px]">
      <div className="flex items-center gap-[10px] flex-wrap">
        <h2 className="m-0 text-[21px] font-extrabold text-[#0f1111]">
          Buy it again, right on time
        </h2>
        <span className="inline-flex items-center gap-[5px] bg-[#eef4ff] text-[#2a5bd7] text-[11px] font-extrabold tracking-[0.05em] px-[9px] py-[4px] rounded-[20px] uppercase">
          <Sparkles size={12} fill="#2a5bd7" stroke="none" />
          Predicted for you
        </span>
      </div>
      <div className="text-[13px] text-[#565959] mt-1 mb-4">
        Based on how often you reorder — refill before you run out.
      </div>
      <div className="grid grid-flow-col auto-cols-[250px] gap-[14px] overflow-x-auto pb-[6px] ap-no-scrollbar">
        {cards.map((c) => (
          <div
            key={c.product.id}
            className="border border-[#e3e3e3] rounded-xl p-3 bg-white flex flex-col"
          >
            <div className="flex gap-3 items-center mb-[10px]">
              <div className="w-[66px] h-[66px] shrink-0 rounded-lg overflow-hidden">
                <ProductTile product={c.product} size="thumb-sm" showSize={false} />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-[5px] bg-[#e7f6ec] text-[#007600] text-[10.5px] font-extrabold px-[8px] py-[3px] rounded-[12px] mb-[6px]">
                  <Clock size={11} stroke="#007600" strokeWidth={2.4} />
                  {c.dueLabel}
                </div>
                <div className="text-[13.5px] font-bold text-[#0f1111] leading-[1.25] line-clamp-2">
                  {c.product.name}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-[3px]">
              <span className="text-[12px] text-[#565959]">
                {c.intervalDays === 1 ? "Every day" : `Every ${c.intervalDays} days`}
              </span>
              <span className="text-[16px] font-extrabold text-[#0f1111]">₹{formatRupees(c.product.price)}</span>
            </div>
            <div className="text-[11px] text-[#8a8f94] mb-[10px]">
              {c.lastDays === 1 ? "Ordered yesterday" : `Last ordered ${c.lastDays} days ago`}
            </div>
            <button
              onClick={() => {
                add(c.product.id, 1);
                appendOrder([c.product.id]);
                skipOne(c.product.id);
                toast(`Added ${c.product.name.slice(0, 30)}${c.product.name.length > 30 ? "…" : ""} to cart`);
              }}
              className="w-full h-9 ap-cta-yellow rounded-[20px] text-[13.5px] font-bold text-[#0f1111] cursor-pointer mb-2"
            >
              Add to cart
            </button>
            <div className="flex items-center justify-between">
              <button
                onClick={() => { skipOne(c.product.id); toast("Skipped — back next cycle"); }}
                className="bg-transparent border-0 text-[#007185] hover:underline text-[12px] cursor-pointer px-1 py-[2px]"
              >
                Skip
              </button>
              <button
                onClick={() => { snoozeOne(c.product.id, Date.now() + DAY_MS); toast("Snoozed — we'll remind you tomorrow"); }}
                className="bg-transparent border-0 text-[#007185] hover:underline text-[12px] cursor-pointer px-1 py-[2px]"
              >
                Snooze
              </button>
              <button
                onClick={() => { removePred(c.product.id); toast(`We'll stop predicting ${c.product.name.slice(0, 24)}`); }}
                className="bg-transparent border-0 text-[#8a8f94] hover:text-[#cc0c39] hover:underline text-[12px] cursor-pointer px-1 py-[2px]"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
