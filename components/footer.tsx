"use client";

import Link from "next/link";

const COLUMNS: { title: string; links: string[] }[] = [
  {
    title: "Get to Know Us",
    links: ["About Amazon Picks", "Careers", "Press Releases", "Amazon Science", "Sustainability"],
  },
  {
    title: "Make Money with Us",
    links: [
      "Sell on Amazon Picks",
      "Become an Affiliate",
      "Advertise Your Products",
      "Self-Publish with Us",
      "Become a Delivery Partner",
    ],
  },
  {
    title: "Amazon Picks Payment",
    links: [
      "Amazon Pay",
      "Amazon Pay Later",
      "Amazon Business Card",
      "Shop with Points",
      "Gift Cards",
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      "Your Account",
      "Your Orders",
      "Shipping Rates & Policies",
      "Returns & Replacements",
      "Help Center",
    ],
  },
];

const BOTTOM_LINKS = [
  "Conditions of Use",
  "Privacy Notice",
  "Interest-Based Ads",
  "Bulletin Board",
  "Cookies Notice",
];

export function Footer() {
  return (
    <footer className="text-white mt-10">
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full bg-[#37475a] hover:bg-[#485769] text-white text-[13px] py-3 cursor-pointer border-0 transition-colors"
      >
        Back to top
      </button>

      {/* Column links */}
      <div className="bg-[#232f3e] py-10">
        <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[15px] font-bold mb-3">{col.title}</div>
              <ul className="flex flex-col gap-[6px]">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="/"
                      className="text-[12.5px] text-[#dddde2] hover:underline"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Logo + region strip */}
      <div className="bg-[#131921] border-t border-[#3a4553] py-6">
        <div className="max-w-[1500px] mx-auto px-6 flex flex-wrap items-center gap-5">
          <Link
            href="/"
            className="flex flex-col items-start cursor-pointer leading-none border border-[#3a4553] hover:border-white rounded px-2 py-[6px]"
          >
            <div className="flex items-baseline gap-[5px]">
              <span className="text-[20px] font-extrabold tracking-[-1px] text-white">amazon</span>
              <span className="text-[18px] font-extrabold tracking-[-0.4px] text-[#febd69]">picks</span>
            </div>
            <svg width="68" height="9" viewBox="0 0 86 11" className="-mt-px ml-[2px]">
              <path d="M2 3 Q 44 13 84 4" stroke="#ff9900" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d="M80 2.5 L85 4 L80.5 7.5" stroke="#ff9900" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex flex-wrap gap-[10px] text-[12px]">
            <button className="border border-[#3a4553] hover:border-white rounded px-3 py-[6px] bg-transparent text-white cursor-pointer">
              🌐 English
            </button>
            <button className="border border-[#3a4553] hover:border-white rounded px-3 py-[6px] bg-transparent text-white cursor-pointer">
              ₹ INR — Indian Rupee
            </button>
            <button className="border border-[#3a4553] hover:border-white rounded px-3 py-[6px] bg-transparent text-white cursor-pointer">
              🇮🇳 India
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#0f1111] py-6">
        <div className="max-w-[1500px] mx-auto px-6 flex flex-col items-center gap-[10px] text-center">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {BOTTOM_LINKS.map((l) => (
              <li key={l}>
                <Link href="/" className="text-[11.5px] text-[#dddde2] hover:underline">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
          <div className="text-[11.5px] text-[#999] leading-[1.6]">
            © 1996–2026, Amazon Picks Services Pvt. Ltd. or its affiliates ·{" "}
            Quick-commerce demo built for Amazon HackOn 6.0 · Not affiliated with Amazon.com, Inc.
          </div>
        </div>
      </div>
    </footer>
  );
}
