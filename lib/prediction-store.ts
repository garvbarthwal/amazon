"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HistoryEntry = { id: string; ts: number };

type State = {
  history: HistoryEntry[];
  removed: string[];
  snooze: Record<string, number>;
  skipSession: string[];
  appendOrder: (productIds: string[]) => void;
  remove: (id: string) => void;
  snoozeOne: (id: string, untilTs: number) => void;
  skipOne: (id: string) => void;
  clearSession: () => void;
};

export const usePredictionStore = create<State>()(
  persist(
    (set) => ({
      history: [],
      removed: [],
      snooze: {},
      skipSession: [],
      appendOrder: (productIds) =>
        set((s) => {
          if (productIds.length === 0) return s;
          const now = Date.now();
          return {
            history: [...s.history, ...productIds.map((id) => ({ id, ts: now }))],
            skipSession: s.skipSession.filter((x) => !productIds.includes(x)),
          };
        }),
      remove: (id) =>
        set((s) => ({ removed: Array.from(new Set([...s.removed, id])) })),
      snoozeOne: (id, untilTs) =>
        set((s) => ({ snooze: { ...s.snooze, [id]: untilTs } })),
      skipOne: (id) =>
        set((s) => ({ skipSession: Array.from(new Set([...s.skipSession, id])) })),
      clearSession: () => set({ skipSession: [] }),
    }),
    {
      name: "ap_pred_v1",
      partialize: (s) => ({ history: s.history, removed: s.removed, snooze: s.snooze }),
    },
  ),
);
