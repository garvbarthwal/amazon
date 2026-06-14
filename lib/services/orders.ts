import { prisma } from "@/lib/db";
import { fetchByIds } from "@/lib/services/products";

export type CartLine = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  size: string;
  img: string;
  qty: number;
  deliveryMin: number;
};

export type OrderItemSnapshot = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  qty: number;
  img: string;
  size: string;
};

export type OrderTotals = {
  subtotal: number;
  savings: number;
  total: number;
  deliveryMin: number;
};

export async function buildLines(
  items: { productId: string; qty: number }[],
): Promise<CartLine[]> {
  const products = await fetchByIds(items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  return items
    .map((i) => {
      const p = byId.get(i.productId);
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        mrp: p.mrp,
        size: p.size,
        img: p.img,
        qty: i.qty,
        deliveryMin: p.deliveryMin,
      };
    })
    .filter((x): x is CartLine => Boolean(x));
}

export function totalsFromLines(lines: CartLine[]): OrderTotals {
  let subtotal = 0;
  let savings = 0;
  let maxEta = 0;
  for (const l of lines) {
    subtotal += l.price * l.qty;
    if (l.mrp > l.price) savings += (l.mrp - l.price) * l.qty;
    if (l.deliveryMin > maxEta) maxEta = l.deliveryMin;
  }
  return { subtotal, savings, total: subtotal, deliveryMin: maxEta };
}

export async function createOrder(
  items: { productId: string; qty: number }[],
  paymentMethod: "upi" | "card" | "cod",
) {
  const lines = await buildLines(items);
  if (lines.length === 0) throw new Error("Cart is empty or invalid");

  const totals = totalsFromLines(lines);
  const snapshot: OrderItemSnapshot[] = lines.map((l) => ({
    productId: l.productId,
    name: l.name,
    brand: l.brand,
    price: l.price,
    qty: l.qty,
    img: l.img,
    size: l.size,
  }));

  const address = {
    name: "Garv",
    line1: "Flat 402, Kailash Apartments",
    line2: "Connaught Place",
    city: "New Delhi",
    pin: "110001",
  };

  return prisma.order.create({
    data: {
      userId: "garv",
      items: snapshot as unknown as object,
      subtotal: totals.subtotal,
      savings: totals.savings,
      total: totals.total,
      paymentMethod,
      zoneCode: "110001",
      deliveryMin: totals.deliveryMin || 13,
      address: address as unknown as object,
    },
  });
}

export async function listOrdersForUser(userId = "garv") {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({ where: { id } });
}
