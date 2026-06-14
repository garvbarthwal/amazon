"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const STAGES = [
  "Understanding your intent",
  "Classifying the vibe",
  "Searching the catalog",
  "Assembling your cart",
];

export function QuickThinkingStep({ intent }: { intent: string }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const ticks = [600, 1150, 1650, 1900].map((ms, i) =>
      window.setTimeout(() => setDone(i + 1), ms),
    );
    return () => ticks.forEach(clearTimeout);
  }, []);

  return (
    <div className="px-[30px] py-[46px] pb-[50px] text-center">
      <div
        className="w-16 h-16 mx-auto mb-[22px] rounded-full"
        style={{
          border: "4px solid #f0e0c8",
          borderTopColor: "#ff9900",
          animation: "ap-spin 0.9s linear infinite",
        }}
      />
      <div className="text-[19px] font-extrabold mb-1">Building your cart…</div>
      <div className="text-[13px] text-[#565959] mb-[26px]">
        Turning “{intent}” into a shopping plan.
      </div>
      <div className="max-w-[340px] mx-auto flex flex-col gap-[14px] text-left">
        {STAGES.map((label, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <div
              key={label}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: isDone || isActive ? 1 : 0.5 }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0"
                style={{
                  background: isDone ? "#007600" : isActive ? "#fff" : "#eef1f3",
                  color: isDone ? "#fff" : isActive ? "#ff9900" : "#8a8f94",
                  border: isActive ? "2px solid #ff9900" : "none",
                }}
              >
                {isDone ? <Check size={14} stroke="#fff" strokeWidth={3} /> : isActive ? "●" : i + 1}
              </span>
              <span
                className="text-[14px]"
                style={{
                  color: isDone || isActive ? "#0f1111" : "#8a8f94",
                  fontWeight: isDone ? 700 : isActive ? 800 : 400,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
