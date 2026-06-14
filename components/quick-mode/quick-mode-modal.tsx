"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuickMode } from "@/lib/quick-mode-store";
import { QuickInputStep } from "@/components/quick-mode/input-step";
import { QuickThinkingStep } from "@/components/quick-mode/thinking-step";
import { QuickResultsStep } from "@/components/quick-mode/results-step";
import { Sparkles } from "lucide-react";

export type QuickStep = "input" | "thinking" | "results";

export type QuickResponse = {
  vibe_category: string;
  shopping_list: { query: string; quantity: number }[];
  carts: import("@/lib/services/tier-builder").CartTier[];
  usedFallback: boolean;
  budgetTier: "essentials" | "standard" | "premium";
};

export function QuickModeModal() {
  const open = useQuickMode((s) => s.open);
  const close = useQuickMode((s) => s.closeModal);
  const prefillIntent = useQuickMode((s) => s.prefillIntent);
  const prefillGroupSize = useQuickMode((s) => s.prefillGroupSize);
  const prefillBudget = useQuickMode((s) => s.prefillBudget);

  const [step, setStep] = useState<QuickStep>("input");
  const [data, setData] = useState<QuickResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setStep("input"); setData(null); setError(null); };
  const onClose = (next: boolean) => { if (!next) { close(); setTimeout(reset, 200); } };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 text-white"
          style={{ background: "linear-gradient(95deg,#131921,#37475a)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} fill="#febd69" stroke="none" />
            <DialogTitle className="text-[16px] font-extrabold tracking-wide">
              QUICK MODE
            </DialogTitle>
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#febd69] uppercase">
              · AI · Gemini
            </span>
          </div>
        </div>

        <div className="p-6">
          {step === "input" && (
            <QuickInputStep
              initialIntent={prefillIntent}
              initialGroupSize={prefillGroupSize}
              initialBudget={prefillBudget}
              onSubmit={async (payload) => {
                setStep("thinking");
                setError(null);
                const start = Date.now();
                try {
                  const res = await fetch("/api/quick", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = (await res.json()) as QuickResponse | { error: string };
                  if (!res.ok || "error" in json) throw new Error("Failed");
                  const elapsed = Date.now() - start;
                  const minWait = 2400;
                  if (elapsed < minWait) await new Promise((r) => setTimeout(r, minWait - elapsed));
                  setData(json);
                  setStep("results");
                } catch {
                  setError("Quick Mode could not respond. Try a different prompt.");
                  setStep("input");
                }
              }}
            />
          )}

          {step === "thinking" && <QuickThinkingStep />}

          {step === "results" && data && (
            <QuickResultsStep
              data={data}
              onClose={() => { close(); setTimeout(reset, 200); }}
              onBack={() => reset()}
            />
          )}

          {error && (
            <div className="mt-3 text-[13px] text-[#cc0c39]">{error}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
