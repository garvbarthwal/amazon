"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      duration={2400}
      toastOptions={{
        style: {
          background: "#0f1111",
          color: "#ffffff",
          border: "1px solid #232f3e",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          borderRadius: "8px",
          padding: "12px 16px",
        },
      }}
    />
  );
}
