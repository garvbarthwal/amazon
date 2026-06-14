import Link from "next/link";
import { listOrdersForUser } from "@/lib/services/orders";
import { formatRupees, orderIdShort } from "@/lib/format";
import { ProductTile } from "@/components/product-tile";

export const dynamic = "force-dynamic";

type Snap = { productId: string; name: string; brand: string; price: number; qty: number; img: string; size: string };

export default async function OrdersPage() {
  const orders = await listOrdersForUser("garv");

  return (
    <main className="max-w-[1100px] mx-auto px-[18px] pt-[14px] pb-10">
      <h1 className="text-[28px] font-extrabold mb-5">Your Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white border border-[#e7e7e7] rounded-xl p-16 text-center">
          <div className="text-[40px] mb-2">📦</div>
          <div className="text-[18px] font-bold text-[#0f1111] mb-2">No orders yet</div>
          <Link href="/" className="text-[#007185] hover:text-[#c45500] font-bold">Start shopping →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const items = o.items as unknown as Snap[];
            const itemCount = items.reduce((s, i) => s + i.qty, 0);
            return (
              <div key={o.id} className="bg-white border border-[#e7e7e7] rounded-xl">
                <div className="bg-[#f7f8f8] border-b border-[#e7e7e7] rounded-t-xl px-5 py-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-[12px]">
                  <div>
                    <div className="text-[#565959] uppercase tracking-wide">Order placed</div>
                    <div className="text-[14px]">{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                  </div>
                  <div>
                    <div className="text-[#565959] uppercase tracking-wide">Total</div>
                    <div className="text-[14px] font-bold">₹{formatRupees(o.total)}</div>
                  </div>
                  <div>
                    <div className="text-[#565959] uppercase tracking-wide">Ship to</div>
                    <div className="text-[14px] text-[#007185]">Garv Sharma</div>
                  </div>
                  <div className="md:text-right">
                    <div className="text-[#565959] uppercase tracking-wide">Order #</div>
                    <div className="text-[13px] font-mono">{orderIdShort(o.id)}</div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
                  <div>
                    <div className="text-[#007600] font-bold text-[15px] mb-2">
                      Arriving in ~{o.deliveryMin} min
                    </div>
                    <ul className="flex flex-col gap-3">
                      {items.slice(0, 4).map((i) => (
                        <li key={i.productId + i.qty} className="flex items-center gap-3 text-[13px]">
                          <div className="w-14 h-14 rounded-md overflow-hidden shrink-0">
                            <ProductTile product={{ name: i.name, brand: i.brand, size: i.size, img: i.img }} size="thumb-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/product/${i.productId}`} className="text-[#007185] hover:text-[#c45500] line-clamp-1 font-bold">{i.name}</Link>
                            <div className="text-[#8a8f94]">{i.size} · qty {i.qty} · ₹{formatRupees(i.price)}</div>
                          </div>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-[12px] text-[#565959]">+ {items.length - 4} more item{items.length - 4 > 1 ? "s" : ""}</li>
                      )}
                    </ul>
                  </div>
                  <div className="text-right text-[13px] text-[#565959]">
                    <div>{itemCount} item{itemCount > 1 ? "s" : ""}</div>
                    <div className="uppercase">{o.paymentMethod}</div>
                    <div className="capitalize text-[#007600] font-bold mt-2">{o.status}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
