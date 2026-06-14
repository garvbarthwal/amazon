"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartState = {
  items: Record<string, number>;
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  addMany: (entries: { id: string; qty: number }[]) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      add: (id, qty = 1) =>
        set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + qty } })),
      remove: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.items;
          return { items: rest };
        }),
      inc: (id) =>
        set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 } })),
      dec: (id) =>
        set((s) => {
          const next = (s.items[id] ?? 0) - 1;
          if (next <= 0) {
            const { [id]: _, ...rest } = s.items;
            return { items: rest };
          }
          return { items: { ...s.items, [id]: next } };
        }),
      setQty: (id, qty) =>
        set((s) => {
          if (qty <= 0) {
            const { [id]: _, ...rest } = s.items;
            return { items: rest };
          }
          return { items: { ...s.items, [id]: qty } };
        }),
      addMany: (entries) =>
        set((s) => {
          const items = { ...s.items };
          for (const e of entries) items[e.id] = (items[e.id] ?? 0) + e.qty;
          return { items };
        }),
      clear: () => set({ items: {} }),
    }),
    { name: "ap_cart_v1" },
  ),
);

export const cartCount = (items: Record<string, number>): number =>
  Object.values(items).reduce((a, b) => a + b, 0);

export const cartIds = (items: Record<string, number>): string[] =>
  Object.keys(items);
