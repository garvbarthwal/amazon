import { NextRequest, NextResponse } from "next/server";
import { CreateOrderSchema } from "@/lib/schemas";
import { createOrder, listOrdersForUser } from "@/lib/services/orders";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const order = await createOrder(parsed.data.items, parsed.data.paymentMethod);
    return NextResponse.json({ orderId: order.id, deliveryMin: order.deliveryMin });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Order failed" }, { status: 400 });
  }
}

export async function GET() {
  const orders = await listOrdersForUser("garv");
  return NextResponse.json(orders);
}
