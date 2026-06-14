"use client";

import { useState } from "react";
import { Sparkles, Minus, Plus, MapPin } from "lucide-react";

const CHIPS = [
  { label: "🎬 Movie night for 4", text: "movie night for 4 people" },
  { label: "🍳 Breakfast for 2", text: "breakfast essentials for 2" },
  { label: "🎉 Birthday party at home", text: "birthday party snacks and drinks for 8" },
  { label: "💧 Summer hydration", text: "cold drinks and water for a hot day, 6 people" },
];

export function QuickInputStep({
  initialIntent,
  initialGroupSize,
  onSubmit,
}: {
  initialIntent: string;
  initialGroupSize: number;
  onSubmit: (p: { intent: string; groupSize: number; zoneCode: string }) => void;
}) {
  const [intent, setIntent] = useState(initialIntent);
  const [people, setPeople] = useState(initialGroupSize);

  const submit = () => {
    if (!intent.trim()) return;
    onSubmit({ intent: intent.trim(), groupSize: people, zoneCode: "110001" });
  };

  return (
    <div className="px-[30px] pt-[26px] pb-[30px]">
      <label className="text-[14px] font-bold text-[#0f1111] block mb-2">What do you need?</label>
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="e.g. movie night for 4 people"
        className="w-full min-h-[74px] resize-none border-2 border-[#e0e0e0] rounded-[12px] px-4 py-[14px] text-[16px] outline-none box-border text-[#0f1111] focus:border-[#ff9900]"
      />

      <div className="flex flex-wrap gap-2 mt-3 mb-[22px]">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            onClick={() => setIntent(c.text)}
            className="bg-[#f3f4f4] hover:bg-[#fff3e0] border border-[#e0e0e0] hover:border-[#ffb84d] text-[#37475a] text-[13px] px-[13px] py-[7px] rounded-[18px] cursor-pointer transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-6 items-center py-4 border-t border-b border-[#f0f0f0] mb-[22px]">
        <div>
          <div className="text-[12px] font-bold text-[#8a8f94] uppercase tracking-[0.05em] mb-[7px]">People</div>
          <div className="flex items-center border border-[#d5d9d9] rounded-[10px] overflow-hidden w-fit">
            <button
              onClick={() => setPeople((n) => Math.max(1, n - 1))}
              className="w-9 h-9 border-0 bg-[#f0f2f2] text-lg font-bold cursor-pointer flex items-center justify-center"
              aria-label="Decrease people"
            ><Minus size={14} /></button>
            <span className="w-[42px] text-center text-[16px] font-extrabold">{people}</span>
            <button
              onClick={() => setPeople((n) => Math.min(20, n + 1))}
              className="w-9 h-9 border-0 bg-[#f0f2f2] text-lg font-bold cursor-pointer flex items-center justify-center"
              aria-label="Increase people"
            ><Plus size={14} /></button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-bold text-[#8a8f94] uppercase tracking-[0.05em] mb-[7px]">Zone</div>
          <div className="inline-flex items-center gap-[6px] bg-[#eef1f3] px-3 py-2 rounded-[10px] text-[13px] font-bold text-[#37475a]">
            <MapPin size={13} stroke="#37475a" /> Connaught Place · 110001
          </div>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!intent.trim()}
        className="w-full h-[52px] border-0 rounded-[26px] cursor-pointer text-[#131921] font-extrabold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50"
        style={{
          background: "linear-gradient(95deg,#ff9900,#ff7847)",
          boxShadow: "0 6px 18px rgba(255,140,40,0.4)",
        }}
      >
        <Sparkles size={18} fill="#131921" stroke="none" /> Build my cart
      </button>
      <div className="flex justify-center gap-[18px] mt-[18px] text-[12px] text-[#8a8f94]">
        <span>① Decompose intent</span>
        <span>② Hybrid search</span>
        <span>③ One ready cart</span>
      </div>
    </div>
  );
}
