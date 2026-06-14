import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { QuickModeModal } from "@/components/quick-mode/quick-mode-modal";
import { listCategories } from "@/lib/services/products";

export const metadata: Metadata = {
  title: "Amazon Picks — Quick-commerce, fast",
  description:
    "Tell us the plan. Get the cart in seconds. Quick Mode AI builds ready-to-checkout carts.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await listCategories();
  const navCategories = categories.slice(0, 8).map((c) => ({ name: c.name }));

  return (
    <html lang="en">
      <body>
        <Header navCategories={navCategories} />
        {children}
        <QuickModeModal />
        <Toaster />
      </body>
    </html>
  );
}
