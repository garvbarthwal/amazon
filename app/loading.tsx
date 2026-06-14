import { ProductCardSkeleton } from "@/components/product-card";

export default function Loading() {
  return (
    <main className="max-w-[1500px] mx-auto p-[18px]">
      <div className="h-[260px] rounded-[14px] bg-[#1a232f] animate-pulse mb-[22px]" />
      <div className="grid grid-cols-5 gap-[14px] mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-[10px] bg-white border border-[#e7e7e7] animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, r) => (
        <section key={r} className="bg-white border border-[#e7e7e7] rounded-xl p-[18px] mb-[18px]">
          <div className="h-6 w-1/4 bg-[#eee] rounded mb-[14px] animate-pulse" />
          <div className="grid grid-flow-col auto-cols-[212px] gap-[14px] overflow-x-auto pb-[6px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[212px]"><ProductCardSkeleton /></div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
