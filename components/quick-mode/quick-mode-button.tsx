"use client";

import { Sparkles } from "lucide-react";
import { useQuickMode } from "@/lib/quick-mode-store";

export function QuickModeButton() {
  const open = useQuickMode((s) => s.openModal);
  return (
    <button
      onClick={() => open()}
      className="flex items-center gap-[7px] h-[42px] px-4 border-0 rounded-[22px] cursor-pointer text-[#131921] font-extrabold text-sm"
      style={{
        background: "linear-gradient(95deg,#ff9900,#ff7847)",
        boxShadow: "0 2px 10px rgba(255,140,40,0.45)",
      }}
    >
      <Sparkles size={18} fill="#131921" stroke="none" />
      Quick Mode
      <span className="text-[11px] font-bold bg-[rgba(19,25,33,0.16)] px-[6px] py-[2px] rounded-[5px]">
        AI
      </span>
    </button>
  );
}
