"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useConv } from "@/lib/conv-store";

const CHIPS = [
  { label: "🎬 Movie night for 4", text: "snacks and cold drinks for movie night, 4 people" },
  { label: "🏠 Weekly home restock", text: "weekly grocery restock for a family of 3" },
  { label: "☀️ Summer hydration kit", text: "cold drinks and water for a hot day, 6 people" },
];

export function HeroQuick() {
  const [value, setValue] = useState("");
  const open = useConv((s) => s.openWithSeed);
  const isOpen = useConv((s) => s.open);

  // Clear local input when the modal closes so reopening starts fresh.
  useEffect(() => {
    if (!isOpen) setValue("");
  }, [isOpen]);

  const submit = () => open(value);

  return (
    <section
      className="relative overflow-hidden rounded-[14px] text-white px-[38px] py-[34px] mb-[22px]"
      style={{ background: "linear-gradient(120deg,#131921 0%,#232f3e 52%,#37475a 100%)" }}
    >
      <div
        className="absolute -right-10 -top-10 w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(255,153,0,0.35),transparent 70%)" }}
      />
      <div className="relative max-w-[760px]">
        <div
          className="inline-flex items-center gap-[7px] text-[#ffce8a] text-[12px] font-extrabold tracking-[0.06em] px-3 py-[6px] rounded-[20px] mb-[14px] uppercase"
          style={{ background: "rgba(255,153,0,0.16)" }}
        >
          <Sparkles size={14} fill="#ffce8a" stroke="none" />
          New · Powered by AI
        </div>
        <h1 className="m-0 mb-2 text-[38px] leading-[1.1] font-extrabold tracking-[-0.5px]">
          Tell us the plan.<br />Get the cart in seconds.
        </h1>
        <p className="m-0 mb-5 text-[16px] text-[#c8d0d8] max-w-[560px]">
          Skip the search and scroll. Describe what you need — “movie night for 4” — and our AI assistant builds a ready-to-checkout cart with you, right here.
        </p>
        <div className="flex gap-[10px] max-w-[620px]">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              // Open the conversational overlay the moment the user starts typing.
              if (!isOpen && e.target.value.trim().length > 0) open(e.target.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. movie night for 4 people"
            className="flex-1 h-[52px] border-0 rounded-[10px] px-[18px] text-[16px] outline-none text-[#0f1111] bg-white placeholder:text-[#8a8f94]"
          />
          <button
            onClick={submit}
            className="h-[52px] px-[26px] border-0 rounded-[10px] cursor-pointer text-[#131921] font-extrabold text-[16px] flex items-center gap-2"
            style={{ background: "linear-gradient(#ffd97a,#ff9900)" }}
          >
            Build my cart →
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => open(c.text)}
              className="text-[#e7eaed] text-[13px] px-[13px] py-[7px] rounded-[18px] cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
