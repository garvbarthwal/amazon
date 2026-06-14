"use client";

import { create } from "zustand";

export type ConvMessage = { role: "user" | "assistant"; text: string };
export type ConvStep = "chat" | "checkout" | "paying" | "done";
export type ConvPay = "upi" | "card" | "cod";
export type ConvOrder = { id: string; total: number; count: number; eta: number };

type State = {
  open: boolean;
  step: ConvStep;
  messages: ConvMessage[];
  input: string;
  busy: boolean;
  cart: Record<string, number>;
  pay: ConvPay;
  order: ConvOrder | null;
  zoomedFromHero: boolean;

  openWithSeed: (seed: string) => void;
  close: () => void;
  reset: () => void;
  setInput: (v: string) => void;
  pushMessage: (m: ConvMessage) => void;
  setBusy: (b: boolean) => void;
  applyPatch: (patch: { add: { id: string; qty: number }[]; remove: string[] }) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  removeOne: (id: string) => void;
  setStep: (s: ConvStep) => void;
  setPay: (p: ConvPay) => void;
  setOrder: (o: ConvOrder | null) => void;
  clearCart: () => void;
};

const WELCOME: ConvMessage = {
  role: "assistant",
  text:
    "Hi 👋 Tell me what you need and I'll build your cart right here — try “snacks and cold drinks for movie night” or “breakfast for tomorrow”.",
};

export const useConv = create<State>((set, get) => ({
  open: false,
  step: "chat",
  messages: [],
  input: "",
  busy: false,
  cart: {},
  pay: "upi",
  order: null,
  zoomedFromHero: false,

  openWithSeed: (seed) => {
    const cur = get();
    set({
      open: true,
      step: "chat",
      input: seed.trim(),
      messages: cur.messages.length === 0 ? [WELCOME] : cur.messages,
      zoomedFromHero: true,
    });
  },
  close: () => set({ open: false, zoomedFromHero: false }),
  reset: () => set({
    messages: [WELCOME], cart: {}, input: "", step: "chat", order: null, busy: false,
  }),
  setInput: (v) => set({ input: v }),
  pushMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setBusy: (b) => set({ busy: b }),
  applyPatch: ({ add, remove }) =>
    set((s) => {
      const cart = { ...s.cart };
      for (const a of add) {
        cart[a.id] = (cart[a.id] ?? 0) + Math.max(1, a.qty);
      }
      for (const id of remove) delete cart[id];
      return { cart };
    }),
  inc: (id) => set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } })),
  dec: (id) =>
    set((s) => {
      const next = (s.cart[id] ?? 0) - 1;
      const cart = { ...s.cart };
      if (next <= 0) delete cart[id];
      else cart[id] = next;
      return { cart };
    }),
  removeOne: (id) =>
    set((s) => {
      const cart = { ...s.cart };
      delete cart[id];
      return { cart };
    }),
  setStep: (step) => set({ step }),
  setPay: (pay) => set({ pay }),
  setOrder: (order) => set({ order }),
  clearCart: () => set({ cart: {} }),
}));
