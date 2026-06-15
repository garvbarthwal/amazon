import { z } from "zod";

export const QuickRequestSchema = z.object({
  intent: z.string().min(1).max(500),
  groupSize: z.number().int().min(1).max(20).default(2),
  zoneCode: z.string().min(3).max(10).default("110001"),
});

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(50),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  paymentMethod: z.enum(["upi", "card", "cod"]).default("upi"),
});

export const ProductsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["relevance", "price-asc", "price-desc", "rating", "discount"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(30),
});
