"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const STAGES = [
  "Understanding your intent",
  "Classifying the vibe",
  "Searching the catalog",
  "Assembling 3 carts",
];

export function QuickThinkingStep() {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const ticks = STAGES.map((_, i) =>
      window.setTimeout(() => setDone(i + 1), 600 * (i + 1)),
    );
    return () => ticks.forEach(clearTimeout);
  }, []);

  return (
    <div className="py-2">
      <h2 className="text-[20px] font-extrabold mb-1">Building your carts</h2>
      <p className="text-[14px] text-[#565959] mb-5">
        We’re thinking through your request — this usually takes a few seconds.
      </p>

      <ul className="flex flex-col gap-3">
        {STAGES.map((label, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <li
              key={label}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
              style={{
                borderColor: isDone ? "#cfe9d6" : isActive ? "#ffe2b3" : "#eee",
                background: isDone ? "#e3f5ea" : isActive ? "#fff8eb" : "#fafafa",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: isDone ? "#007600" : isActive ? "#ff9900" : "#e7e7e7",
                }}
              >
                {isDone ? (
                  <Check size={16} stroke="#fff" strokeWidth={3} />
                ) : (
                  <span
                    className={isActive ? "block w-3 h-3 rounded-full bg-white animate-pulse" : "block w-2 h-2 rounded-full bg-[#bbb]"}
                  />
                )}
              </div>
              <span
                className="text-[14px]"
                style={{
                  color: isDone || isActive ? "#0f1111" : "#8a8f94",
                  fontWeight: isDone ? 700 : 500,
                }}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
