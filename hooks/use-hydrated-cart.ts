"use client";

import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart-store";

export function useHydratedCart() {
  const items = useCart((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return {
    items: hydrated ? items : ({} as Record<string, number>),
    count: hydrated ? cartCount(items) : 0,
    hydrated,
  };
}
