"use client";

import { create } from "zustand";

type QuickModeState = {
  open: boolean;
  prefillIntent: string;
  prefillGroupSize: number;
  openModal: (opts?: { intent?: string; groupSize?: number }) => void;
  closeModal: () => void;
};

export const useQuickMode = create<QuickModeState>((set) => ({
  open: false,
  prefillIntent: "",
  prefillGroupSize: 4,
  openModal: (opts = {}) =>
    set({
      open: true,
      prefillIntent: opts.intent ?? "",
      prefillGroupSize: opts.groupSize ?? 4,
    }),
  closeModal: () => set({ open: false }),
}));
