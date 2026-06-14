import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getOrder } from "@/lib/services/orders";
import { formatRupees, orderIdShort } from "@/lib/format";

export const dynamic = "force-dynamic";

type Snap = { productId: string; name: string; brand: string; price: number; qty: number; img: string; size: string };

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const items = order.items as unknown as Snap[];
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const short = orderIdShort(order.id);

  return (
    <main className="max-w-[760px] mx-auto px-[18px] pt-10 pb-10">
      <div className="bg-white border border-[#e7e7e7] rounded-xl p-10 text-center">
        <div className="w-[68px] h-[68px] rounded-full bg-[#e3f5ea] mx-auto mb-4 flex items-center justify-center">
          <Check size={36} stroke="#007600" strokeWidth={3} />
        </div>
        <h1 className="text-[28px] font-extrabold mb-2 text-[#0f1111]">
          Order placed, thank you!
        </h1>
        <p className="text-[#565959] mb-6">
          A confirmation will be on its way. Your order will arrive in ~{order.deliveryMin} minutes.
        </p>

        <div className="bg-[#f7f8f8] border border-[#e7e7e7] rounded-lg p-5 text-left mb-6">
          <div className="grid grid-cols-2 gap-2 text-[14px]">
            <div className="text-[#565959]">Order ID</div>
            <div className="font-bold text-right">{short}</div>
            <div className="text-[#565959]">Arriving in</div>
            <div className="font-bold text-right">{order.deliveryMin} min</div>
            <div className="text-[#565959]">Items</div>
            <div className="font-bold text-right">{itemCount}</div>
            <div className="text-[#565959]">Payment</div>
            <div className="font-bold text-right uppercase">{order.paymentMethod}</div>
            <div className="text-[#565959]">Total paid</div>
            <div className="font-bold text-right text-[#cc0c39]">₹{formatRupees(order.total)}</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/" className="ap-cta-orange rounded-full px-6 py-3 text-sm font-bold text-[#131921]">
            Continue shopping
          </Link>
          <Link href="/orders" className="bg-white border border-[#d5d9d9] rounded-full px-6 py-3 text-sm font-bold text-[#0f1111] hover:bg-[#f7f8f8]">
            View all orders
          </Link>
        </div>
      </div>
    </main>
  );
}
