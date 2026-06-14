"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useHydratedCart } from "@/hooks/use-hydrated-cart";
import { formatRupees } from "@/lib/format";
import type { ProductDTO } from "@/lib/services/products";

export function CartView() {
  const { items, count, hydrated } = useHydratedCart();
  const inc = useCart((s) => s.inc);
  const dec = useCart((s) => s.dec);
  const remove = useCart((s) => s.remove);

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    const ids = Object.keys(items);
    if (ids.length === 0) {
      setProducts([]);
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
          <div className="bg-white border border-[#e7e7e7] rounded-xl p-6 h-[300px] animate-pulse" />
          <div className="bg-white border border-[#e7e7e7] rounded-xl p-6 h-[200px] animate-pulse" />
        </div>
      </main>
    );
  }

  if (count === 0) {
    return (
      <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
        <div className="bg-white border border-[#e7e7e7] rounded-xl p-16 text-center">
          <div className="text-[44px] mb-3">🛒</div>
          <h1 className="text-[24px] font-bold text-[#0f1111] mb-2">Your Amazon Picks cart is empty</h1>
          <p className="text-[#565959] mb-5">Browse a category, or let Quick Mode build a cart for you in seconds.</p>
          <Link href="/" className="inline-block ap-cta-orange rounded-full px-6 py-3 text-sm font-bold text-[#131921]">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const lines = products
    .map((p) => ({ p, qty: items[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  const subtotal = lines.reduce((sum, l) => sum + l.p.price * l.qty, 0);
  const savings = lines.reduce((sum, l) => sum + Math.max(0, l.p.mrp - l.p.price) * l.qty, 0);
  const savingsPct = subtotal > 0 ? Math.round((savings / (subtotal + savings)) * 100) : 0;

  return (
    <main className="max-w-[1500px] mx-auto px-[18px] pt-[14px] pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <section className="bg-white border border-[#e7e7e7] rounded-xl p-5">
          <h1 className="text-[28px] font-extrabold mb-1">Shopping Cart</h1>
          <div className="text-[13px] text-[#007185] mb-4 border-b border-[#eee] pb-3">
            Deselect all items
          </div>
          <ul className="flex flex-col">
            {lines.map(({ p, qty }) => (
              <li
                key={p.id}
                className="grid grid-cols-[120px_1fr_auto] gap-4 py-4 border-b border-[#eee] last:border-b-0 items-start"
              >
                <Link href={`/product/${p.id}`} className="block w-[120px] h-[120px] bg-[#f7f8f8] rounded-md overflow-hidden">
                  {p.img ? (
                    <img src={p.img} alt={p.name} className="w-full h-full object-contain p-2 bg-white" />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundImage: "repeating-linear-gradient(45deg,#f2f3f3 0 10px,#f7f8f8 10px 20px)" }} />
                  )}
                </Link>
                <div className="min-w-0">
                  <Link href={`/product/${p.id}`} className="text-[15px] font-bold text-[#0f1111] hover:text-[#c45500] line-clamp-2">
                    {p.name}
                  </Link>
                  <div className="text-[12px] text-[#8a8f94] mt-1">
                    <span className="font-bold">{p.brand}</span> · {p.size}
                  </div>
                  <div className="text-[13px] text-[#007600] font-bold mt-1">
                    In stock · {p.deliveryMin} min delivery
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-[#d5d9d9] rounded-md overflow-hidden">
                      <button onClick={() => dec(p.id)} className="w-8 h-8 bg-[#f3f4f4] cursor-pointer text-lg font-bold" aria-label="Decrease">−</button>
                      <span className="px-3 text-sm font-bold w-10 text-center">{qty}</span>
                      <button onClick={() => inc(p.id)} className="w-8 h-8 bg-[#f3f4f4] cursor-pointer text-lg font-bold" aria-label="Increase">+</button>
                    </div>
                    <button onClick={() => remove(p.id)} className="text-[13px] text-[#007185] hover:text-[#c45500] cursor-pointer bg-transparent border-0">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-bold text-[#0f1111]">₹{formatRupees(p.price * qty)}</div>
                  {p.mrp > p.price && (
                    <div className="text-[12px] text-[#8a8f94] line-through">₹{formatRupees(p.mrp * qty)}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="text-right pt-3 text-[18px]">
            Subtotal ({count} item{count > 1 ? "s" : ""}):{" "}
            <span className="font-bold">₹{formatRupees(subtotal)}</span>
          </div>
        </section>

        <aside className="bg-white border border-[#e7e7e7] rounded-xl p-5 lg:sticky lg:top-[120px]">
          <div className="bg-[#e3f5ea] text-[13px] text-[#007600] px-3 py-2 rounded-md mb-3">
            ✓ Your order qualifies for <span className="font-bold">FREE express delivery</span>
          </div>
          <div className="text-[18px] mb-1">
            Subtotal ({count} item{count > 1 ? "s" : ""}): <span className="font-bold">₹{formatRupees(subtotal)}</span>
          </div>
          {savings > 0 && (
            <div className="text-[14px] text-[#007600] font-bold mb-3">
              You save ₹{formatRupees(savings)} ({savingsPct}%)
            </div>
          )}
          <Link
            href="/checkout"
            className="block w-full text-center ap-cta-orange rounded-full py-2 text-sm font-bold text-[#131921] mb-2"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/"
            className="block w-full text-center bg-white border border-[#d5d9d9] hover:bg-[#f7f8f8] rounded-full py-2 text-sm text-[#0f1111]"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}
