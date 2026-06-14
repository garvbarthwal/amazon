"use client";

import { create } from "zustand";

type QuickModeState = {
  open: boolean;
  prefillIntent: string;
  prefillGroupSize: number;
  prefillBudget: "essentials" | "standard" | "premium";
  openModal: (opts?: {
    intent?: string;
    groupSize?: number;
    budget?: "essentials" | "standard" | "premium";
  }) => void;
  closeModal: () => void;
};

export const useQuickMode = create<QuickModeState>((set) => ({
  open: false,
  prefillIntent: "",
  prefillGroupSize: 4,
  prefillBudget: "standard",
  openModal: (opts = {}) =>
    set({
      open: true,
      prefillIntent: opts.intent ?? "",
      prefillGroupSize: opts.groupSize ?? 4,
      prefillBudget: opts.budget ?? "standard",
    }),
  closeModal: () => set({ open: false }),
}));
