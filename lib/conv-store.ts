"use client";

import { create } from "zustand";

export type ConvMessage = { role: "user" | "assistant"; text: string };
export type ConvStep = "chat" | "checkout" | "paying" | "done";
export type ConvPay = "upi" | "card" | "cod";
export type ConvOrder = { id: string; total: number; count: number; eta: number };

export type ConvCartLine = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  img: string;
  qty: number;
  subCategory?: string;
};

export type ConvQuestion = {
  key: string;
  prompt: string;
  options: string[];
};

type State = {
  open: boolean;
  step: ConvStep;
  messages: ConvMessage[];
  input: string;
  busy: boolean;
  cart: Record<string, ConvCartLine>;
  pay: ConvPay;
  order: ConvOrder | null;
  zoomedFromHero: boolean;

  pendingQuery: string;
  pendingParameters: Record<string, string>;
  pendingQuestions: ConvQuestion[];
  qIndex: number;

  openWithSeed: (seed: string) => void;
  close: () => void;
  reset: () => void;
  setInput: (v: string) => void;
  pushMessage: (m: ConvMessage) => void;
  setBusy: (b: boolean) => void;
  setCartLines: (lines: ConvCartLine[]) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  removeOne: (id: string) => void;
  setStep: (s: ConvStep) => void;
  setPay: (p: ConvPay) => void;
  setOrder: (o: ConvOrder | null) => void;
  clearCart: () => void;

  startQuery: (query: string, questions: ConvQuestion[]) => void;
  recordAnswer: (key: string, answer: string) => void;
  advanceQ: () => void;
  clearPending: () => void;
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

  pendingQuery: "",
  pendingParameters: {},
  pendingQuestions: [],
  qIndex: -1,

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
    pendingQuery: "", pendingParameters: {}, pendingQuestions: [], qIndex: -1,
  }),
  setInput: (v) => set({ input: v }),
  pushMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setBusy: (b) => set({ busy: b }),
  setCartLines: (lines) =>
    set(() => {
      const cart: Record<string, ConvCartLine> = {};
      for (const l of lines) cart[l.productId] = l;
      return { cart };
    }),
  inc: (id) =>
    set((s) => {
      const line = s.cart[id];
      if (!line) return s;
      return { cart: { ...s.cart, [id]: { ...line, qty: line.qty + 1 } } };
    }),
  dec: (id) =>
    set((s) => {
      const line = s.cart[id];
      if (!line) return s;
      const next = line.qty - 1;
      const cart = { ...s.cart };
      if (next <= 0) delete cart[id];
      else cart[id] = { ...line, qty: next };
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

  startQuery: (query, questions) =>
    set({ pendingQuery: query, pendingParameters: {}, pendingQuestions: questions, qIndex: 0 }),
  recordAnswer: (key, answer) =>
    set((s) => ({
      pendingParameters: { ...s.pendingParameters, [key]: answer },
    })),
  advanceQ: () => set((s) => ({ qIndex: s.qIndex + 1 })),
  clearPending: () =>
    set({ pendingQuery: "", pendingParameters: {}, pendingQuestions: [], qIndex: -1 }),
}));
