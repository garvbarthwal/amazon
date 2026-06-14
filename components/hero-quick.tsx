"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuickMode } from "@/lib/quick-mode-store";

const CHIPS = [
  "movie night for 4, medium budget",
  "breakfast for 4 people",
  "weekly grocery restock for a family",
];

export function HeroQuick() {
  const [value, setValue] = useState("");
  const open = useQuickMode((s) => s.openModal);

  const submit = () => {
    if (!value.trim()) return open();
    open({ intent: value.trim(), groupSize: 4, budget: "standard" });
  };

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffce8a">
            <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z" />
          </svg>
          New · Powered by AI
        </div>
        <h1 className="m-0 mb-2 text-[38px] leading-[1.1] font-extrabold tracking-[-0.5px]">
          Tell us the plan.<br />Get the cart in seconds.
        </h1>
        <p className="m-0 mb-5 text-[16px] text-[#c8d0d8] max-w-[560px]">
          Skip the search and scroll. Describe what you need — “movie night for 4, medium budget” — and Quick Mode builds a ready-to-checkout cart for you.
        </p>
        <div className="flex gap-[10px] max-w-[620px]">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. movie night for 4 people, medium budget"
            className="flex-1 h-[52px] border-0 rounded-[10px] px-[18px] text-[16px] outline-none text-[#0f1111]"
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
              key={c}
              onClick={() => open({ intent: c, groupSize: 4, budget: "standard" })}
              className="text-[#e7eaed] text-[13px] px-[13px] py-[7px] rounded-[18px] cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
