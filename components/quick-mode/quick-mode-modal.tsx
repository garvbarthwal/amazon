"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useQuickMode } from "@/lib/quick-mode-store";
import { QuickInputStep } from "@/components/quick-mode/input-step";
import { QuickThinkingStep } from "@/components/quick-mode/thinking-step";
import { QuickResultsStep, type QuickResponse } from "@/components/quick-mode/results-step";

export type QuickStep = "input" | "thinking" | "results";

export function QuickModeModal() {
  const open = useQuickMode((s) => s.open);
  const close = useQuickMode((s) => s.closeModal);
  const prefillIntent = useQuickMode((s) => s.prefillIntent);
  const prefillGroupSize = useQuickMode((s) => s.prefillGroupSize);

  const [step, setStep] = useState<QuickStep>("input");
  const [data, setData] = useState<QuickResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intentLabel, setIntentLabel] = useState("");

  useEffect(() => {
    if (open) {
      setStep("input");
      setData(null);
      setError(null);
    }
  }, [open]);

  const finish = () => {
    close();
    setTimeout(() => {
      setStep("input");
      setData(null);
      setError(null);
    }, 200);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-5 py-10 overflow-auto"
      style={{ background: "rgba(15,20,28,0.62)", backdropFilter: "blur(3px)" }}
      onClick={finish}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[940px] bg-white rounded-[18px] overflow-hidden relative shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
      >
        <button
          onClick={finish}
          className="absolute top-4 right-4 z-[3] w-[34px] h-[34px] rounded-full border-0 bg-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.32)] text-white text-lg cursor-pointer flex items-center justify-center"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div
          className="text-white px-[30px] py-6 flex items-center gap-[14px]"
          style={{ background: "linear-gradient(120deg,#131921 0%,#232f3e 60%,#37475a 100%)" }}
        >
          <div
            className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#ff9900,#ff7847)", boxShadow: "0 4px 14px rgba(255,140,40,0.5)" }}
          >
            <Sparkles size={24} fill="#131921" stroke="none" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold tracking-[-0.3px]">
              Quick Mode{" "}
              <span className="text-[11px] font-bold bg-[rgba(255,153,0,0.2)] text-[#ffce8a] px-[7px] py-[2px] rounded-[5px] align-middle">
                AI · GEMINI
              </span>
            </div>
            <div className="text-[13px] text-[#c8d0d8]">
              From a single sentence to a ready-to-checkout cart.
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuickInputStep
                initialIntent={prefillIntent}
                initialGroupSize={prefillGroupSize}
                onSubmit={async (payload) => {
                  setIntentLabel(payload.intent);
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
                    const minWait = 1900;
                    if (elapsed < minWait) await new Promise((r) => setTimeout(r, minWait - elapsed));
                    setData(json);
                    setStep("results");
                  } catch {
                    setError("Quick Mode could not respond. Try a different prompt.");
                    setStep("input");
                  }
                }}
              />
              {error && (
                <div className="px-[30px] pb-4 text-[13px] text-[#cc0c39]">{error}</div>
              )}
            </motion.div>
          )}

          {step === "thinking" && (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuickThinkingStep intent={intentLabel} />
            </motion.div>
          )}

          {step === "results" && data && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuickResultsStep
                data={data}
                onClose={finish}
                onBack={() => setStep("input")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
