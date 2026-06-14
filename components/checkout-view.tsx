"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { usePredictionStore } from "@/lib/prediction-store";
import { isRecurring } from "@/lib/recurring";
import { useHydratedCart } from "@/hooks/use-hydrated-cart";
import { formatRupees } from "@/lib/format";
import type { ProductDTO } from "@/lib/services/products";
import { ProductTile } from "@/components/product-tile";

type PayMethod = "upi" | "card" | "cod";
type DeliverySpeed = "express" | "standard";

export function CheckoutView() {
  const router = useRouter();
  const { items, hydrated } = useHydratedCart();
  const clear = useCart((s) => s.clear);
  const appendOrder = usePredictionStore((s) => s.appendOrder);

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pay, setPay] = useState<PayMethod>("upi");
  const [speed, setSpeed] = useState<DeliverySpeed>("express");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const ids = Object.keys(items);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: ProductDTO[] }) => setProducts(d.items ?? []))
      .finally(() => setLoading(false));
  }, [hydrated, JSON.stringify(items)]);

  if (!hydrated || loading) {
    return (
      <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <div className="bg-white border border-[#e7e7e7] rounded-xl p-6 h-[500px] animate-pulse" />
          <div className="bg-white border border-[#e7e7e7] rounded-xl p-6 h-[300px] animate-pulse" />
        </div>
      </main>
    );
  }

  const lines = products
    .map((p) => ({ p, qty: items[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  if (lines.length === 0) {
    return (
      <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
        <div className="bg-white border border-[#e7e7e7] rounded-xl p-16 text-center">
          <h1 className="text-[24px] font-bold mb-2">Your cart is empty</h1>
          <Link href="/" className="text-[#007185] hover:text-[#c45500] font-bold">
            Continue shopping →
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const eta = Math.max(...lines.map((l) => l.p.deliveryMin), 13);

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.p.id, qty: l.qty })),
          paymentMethod: pay,
        }),
      });
      if (!res.ok) throw new Error("Order failed");
      const { orderId } = (await res.json()) as { orderId: string };
      // Record any recurring/replenishable items into the prediction history
      // so the "Buy it again" nudge moves their next due date forward.
      const recurringIds = lines.filter((l) => isRecurring(l.p)).map((l) => l.p.id);
      appendOrder(recurringIds);
      clear();
      router.push(`/order/${orderId}`);
    } catch {
      setPlacing(false);
      alert("We could not place your order. Please try again.");
    }
  };

  return (
    <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
      <h1 className="text-[28px] font-extrabold mb-4">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <section className="bg-white border border-[#e7e7e7] rounded-xl divide-y divide-[#eee]">
          <div className="p-5">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-[#febd69] font-extrabold text-[20px] leading-none">1</span>
              <h2 className="text-[18px] font-bold">Delivery address</h2>
            </div>
            <div className="text-[14px] text-[#0f1111] leading-[1.55] pl-7">
              <div className="font-bold">Garv Sharma</div>
              <div>Flat 402, Kailash Apartments</div>
              <div>Connaught Place, New Delhi 110001</div>
              <div className="text-[13px] text-[#007185] mt-2 cursor-pointer">Change address</div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-[#febd69] font-extrabold text-[20px] leading-none">2</span>
              <h2 className="text-[18px] font-bold">Delivery speed</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              <button
                onClick={() => setSpeed("express")}
                className="text-left rounded-lg p-4 cursor-pointer"
                style={{
                  border: speed === "express" ? "2px solid #ff9900" : "1px solid #d5d9d9",
                  background: speed === "express" ? "#fff8eb" : "#fff",
                }}
              >
                <div className="text-[14px] font-bold">Express · {eta} min FREE</div>
                <div className="text-[12px] text-[#565959] mt-1">Fastest. No delivery fee.</div>
              </button>
              <button
                onClick={() => setSpeed("standard")}
                className="text-left rounded-lg p-4 cursor-pointer"
                style={{
                  border: speed === "standard" ? "2px solid #ff9900" : "1px solid #d5d9d9",
                  background: speed === "standard" ? "#fff8eb" : "#fff",
                }}
              >
                <div className="text-[14px] font-bold">Standard · 2 hrs</div>
                <div className="text-[12px] text-[#565959] mt-1">Schedule for later today.</div>
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-[#febd69] font-extrabold text-[20px] leading-none">3</span>
              <h2 className="text-[18px] font-bold">Payment method</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 pl-7">
              {(
                [
                  { v: "upi" as const,  label: "UPI",  hint: "Pay with any UPI app" },
                  { v: "card" as const, label: "Card", hint: "Credit / Debit / EMI" },
                  { v: "cod" as const,  label: "Cash on delivery", hint: "Pay when it arrives" },
                ]
              ).map((opt) => {
                const active = pay === opt.v;
                return (
                  <button
                    key={opt.v}
                    onClick={() => setPay(opt.v)}
                    className="text-left rounded-lg p-4 cursor-pointer"
                    style={{
                      border: active ? "2px solid #ff9900" : "1px solid #d5d9d9",
                      background: active ? "#fff8eb" : "#fff",
                    }}
                  >
                    <div className="text-[14px] font-bold">{opt.label}</div>
                    <div className="text-[12px] text-[#565959] mt-1">{opt.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5">
            <div className="text-[14px] font-bold mb-3">Items in this order ({itemCount})</div>
            <ul className="flex flex-col gap-3">
              {lines.map(({ p, qty }) => (
                <li key={p.id} className="flex items-center gap-3 text-[13px]">
                  <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
                    <ProductTile product={p} size="thumb-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 font-bold">{p.name}</div>
                    <div className="text-[#8a8f94]">{p.size} · qty {qty}</div>
                  </div>
                  <div className="font-bold">₹{formatRupees(p.price * qty)}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="bg-white border border-[#e7e7e7] rounded-xl p-5 lg:sticky lg:top-[120px]">
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full ap-cta-orange rounded-full py-3 text-sm font-bold text-[#131921] cursor-pointer disabled:opacity-60"
          >
            {placing ? "Placing order…" : "Place your order"}
          </button>
          <div className="text-[11px] text-[#565959] mt-2 leading-[1.5]">
            By placing your order, you agree to Amazon Picks’ terms and conditions and the privacy notice.
          </div>
          <div className="border-t border-[#eee] my-4" />
          <h3 className="text-[16px] font-bold mb-3">Order summary</h3>
          <div className="text-[14px] flex justify-between mb-2">
            <span>Items ({itemCount}):</span>
            <span>₹{formatRupees(subtotal)}</span>
          </div>
          <div className="text-[14px] flex justify-between mb-2">
            <span>Delivery:</span>
            <span className="text-[#007600] font-bold">FREE</span>
          </div>
          <div className="border-t border-[#eee] my-3" />
          <div className="text-[18px] flex justify-between text-[#cc0c39] font-bold">
            <span>Order total:</span>
            <span>₹{formatRupees(subtotal)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
