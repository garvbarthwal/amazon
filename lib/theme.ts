export type VibeKey =
  | "party" | "movie" | "healthy" | "breakfast" | "hydration"
  | "comfort" | "restock" | "celebration" | "snack" | "default";

export type VibeTheme = {
  name: string;
  emoji: string;
  accent: string;
  soft: string;
  gradient: string;
};

export const VIBES: Record<VibeKey, VibeTheme> = {
  party:       { name: "Party",        emoji: "🎉", accent: "#e0218a", soft: "#fce4f1", gradient: "linear-gradient(120deg,#e0218a,#ff7847)" },
  movie:       { name: "Movie night",  emoji: "🍿", accent: "#7b2ff7", soft: "#efe7fd", gradient: "linear-gradient(120deg,#7b2ff7,#e0218a)" },
  healthy:     { name: "Healthy",      emoji: "🥗", accent: "#1f8a4c", soft: "#e3f5ea", gradient: "linear-gradient(120deg,#1f8a4c,#7bc47f)" },
  breakfast:   { name: "Breakfast",    emoji: "🍳", accent: "#d98300", soft: "#fdf0d8", gradient: "linear-gradient(120deg,#d98300,#ffc24d)" },
  hydration:   { name: "Hydration",    emoji: "💧", accent: "#0a9fc2", soft: "#dff3f8", gradient: "linear-gradient(120deg,#0a9fc2,#56c8e0)" },
  comfort:     { name: "Comfort food", emoji: "🍜", accent: "#c2560f", soft: "#fbe9dd", gradient: "linear-gradient(120deg,#c2560f,#ff9248)" },
  restock:     { name: "Home restock", emoji: "🛒", accent: "#2a5bd7", soft: "#e3eafb", gradient: "linear-gradient(120deg,#2a5bd7,#6f9bff)" },
  celebration: { name: "Celebration",  emoji: "🎊", accent: "#e0218a", soft: "#fce4f1", gradient: "linear-gradient(120deg,#e0218a,#ff7847)" },
  snack:       { name: "Snack run",    emoji: "🍫", accent: "#c2560f", soft: "#fbe9dd", gradient: "linear-gradient(120deg,#c2560f,#ff9248)" },
  default:     { name: "Picks",        emoji: "✦",  accent: "#ff9900", soft: "#fff3e0", gradient: "linear-gradient(120deg,#ff9900,#ff7847)" },
};

export const getVibe = (key: string | null | undefined): VibeTheme =>
  VIBES[(key as VibeKey) in VIBES ? (key as VibeKey) : "default"];

export const CATEGORY_TILE_META: Record<string, { icon: string; bg: string }> = {
  "Cold Drinks & Juices":          { icon: "🥤", bg: "#fdefe0" },
  "Snacks & Munchies":             { icon: "🍿", bg: "#fdf3df" },
  "Party & Celebrations":          { icon: "🎉", bg: "#fbe6ef" },
  "Dairy, Bread & Eggs":           { icon: "🥚", bg: "#eaf4ff" },
  "Breakfast & Instant Food":      { icon: "🥣", bg: "#eefaf0" },
  "Fruits & Vegetables":           { icon: "🥦", bg: "#edf9ee" },
  "Personal Care":                 { icon: "🧴", bg: "#f0eefc" },
  "Pharmacy & Wellness":           { icon: "💊", bg: "#e9f6f6" },
  "Atta, Rice, Oil & Dals":        { icon: "🌾", bg: "#fdf7e3" },
  "Munchies":                      { icon: "🍪", bg: "#fdf3df" },
  "Cleaning Essentials":           { icon: "🧽", bg: "#e9f0f8" },
  "Home & Office":                 { icon: "🏠", bg: "#f3f0fb" },
  "Baby Care":                     { icon: "👶", bg: "#fdeaee" },
  "Pet Care":                      { icon: "🐾", bg: "#f1f5e7" },
  "Tea, Coffee & More":            { icon: "☕", bg: "#f4ebe0" },
  "Sauces & Spreads":              { icon: "🍯", bg: "#fdf3df" },
  "Masala, Oil & More":            { icon: "🧂", bg: "#fdf7e3" },
  "Bakery & Biscuits":             { icon: "🥖", bg: "#fdf0d8" },
};

export const tileMeta = (name: string) =>
  CATEGORY_TILE_META[name] ?? { icon: "🛒", bg: "#f0f2f2" };
