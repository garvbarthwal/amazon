"use client";

import { useState } from "react";
import { Minus, Plus, MapPin } from "lucide-react";

export type QuickInputPayload = {
  intent: string;
  groupSize: number;
  budgetTier: "essentials" | "standard" | "premium";
  zoneCode: string;
};

const CHIPS = [
  "movie night for 4, medium budget",
  "breakfast for 4 people",
  "weekly grocery restock for a family",
  "healthy snacks for the week",
  "hydration for a hot day",
];

const TIERS = [
  { v: "essentials" as const, label: "Essentials" },
  { v: "standard"   as const, label: "Standard" },
  { v: "premium"    as const, label: "Premium" },
];

export function QuickInputStep({
  initialIntent,
  initialGroupSize,
  initialBudget,
  onSubmit,
}: {
  initialIntent: string;
  initialGroupSize: number;
  initialBudget: "essentials" | "standard" | "premium";
  onSubmit: (p: QuickInputPayload) => void;
}) {
  const [intent, setIntent] = useState(initialIntent);
  const [people, setPeople] = useState(initialGroupSize);
  const [budget, setBudget] = useState<"essentials" | "standard" | "premium">(initialBudget);

  const submit = () => {
    if (!intent.trim()) return;
    onSubmit({ intent: intent.trim(), groupSize: people, budgetTier: budget, zoneCode: "110001" });
  };

  return (
    <div>
      <h2 className="text-[24px] font-extrabold mb-1">What do you need?</h2>
      <p className="text-[14px] text-[#565959] mb-4">
        Describe the plan in your own words. We’ll build three carts in seconds.
      </p>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="e.g. movie night for 4 people, medium budget"
        rows={3}
        className="w-full text-[15px] border border-[#d5d9d9] rounded-lg p-3 outline-none resize-none focus:border-[#ff9900]"
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setIntent(c)}
            className="text-[12.5px] bg-[#f3f4f4] hover:bg-[#eaeded] px-[10px] py-[6px] rounded-full border border-[#e7e7e7] cursor-pointer"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div>
          <div className="text-[12px] font-bold text-[#565959] uppercase tracking-[0.05em] mb-2">People</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPeople((n) => Math.max(1, n - 1))}
              className="w-8 h-8 rounded-full border border-[#d5d9d9] hover:bg-[#f3f4f4] flex items-center justify-center cursor-pointer"
              aria-label="Decrease people"
            ><Minus size={14} /></button>
            <span className="text-[20px] font-bold w-6 text-center">{people}</span>
            <button
              onClick={() => setPeople((n) => Math.min(20, n + 1))}
              className="w-8 h-8 rounded-full border border-[#d5d9d9] hover:bg-[#f3f4f4] flex items-center justify-center cursor-pointer"
              aria-label="Increase people"
            ><Plus size={14} /></button>
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-[#565959] uppercase tracking-[0.05em] mb-2">Budget</div>
          <div className="flex bg-[#f3f4f4] rounded-full p-[3px]">
            {TIERS.map((t) => (
              <button
                key={t.v}
                onClick={() => setBudget(t.v)}
                className="flex-1 text-[12.5px] font-bold py-[6px] rounded-full cursor-pointer"
                style={{
                  background: budget === t.v ? "#0f1111" : "transparent",
                  color: budget === t.v ? "#fff" : "#0f1111",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-[#565959] uppercase tracking-[0.05em] mb-2">Zone</div>
          <div className="flex items-center gap-2 text-[14px] text-[#0f1111] bg-[#f3f4f4] rounded-md px-3 py-[10px]">
            <MapPin size={14} stroke="#565959" /> Connaught Place 110001
          </div>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!intent.trim()}
        className="mt-6 w-full h-12 ap-cta-orange rounded-full text-[15px] font-bold text-[#131921] cursor-pointer disabled:opacity-50"
      >
        Build my carts →
      </button>
    </div>
  );
}
