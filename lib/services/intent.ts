import { ClaudeIntentSchema, type ClaudeIntent } from "@/lib/schemas";
import { invokeLLM, isLLMConfigured } from "@/lib/gemini";

const SYSTEM_PROMPT = [
  "You are a shopping-intent decomposition engine for a quick-commerce grocery app.",
  "Given a raw intent plus groupSize, respond with STRICT minified JSON only (no markdown, no prose):",
  '{"vibe_category":"<one word: party|movie|healthy|breakfast|comfort|hydration|restock|celebration|snack>","shopping_list":[{"query":"<2-4 word generic product search>","quantity":<integer>}]}.',
  "Decompose into 3-6 grocery queries, scale quantities for groupSize people, use generic queries (e.g. \"cola soft drink\",\"potato chips\",\"popcorn\",\"chocolate\",\"milk\",\"bread\") not brand names.",
  "Quantities must be sensible household amounts: pantry staples (milk, bread, eggs, cereal, butter) = ceil(groupSize/2) clamped 1..4; drinks/snacks/chocolate = groupSize clamped 2..8; one-off items (popcorn) fixed 2.",
  "Return only relevant items for the intent — never add unrelated products.",
].join(" ");

export type DecomposedIntent = ClaudeIntent & { usedFallback: boolean };

const PANTRY_STAPLES = ["milk", "bread", "egg", "cereal", "corn flake", "butter", "atta", "flour", "rice"];
const DRINKS_SNACKS = ["chip", "snack", "chocolate", "cola", "drink", "juice", "popcorn", "biscuit", "cookie", "noodle"];
const FIXED_TWO = ["popcorn"];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function scaleQuantity(query: string, groupSize: number): number {
  const q = query.toLowerCase();
  if (FIXED_TWO.some((k) => q.includes(k))) return 2;
  if (PANTRY_STAPLES.some((k) => q.includes(k))) return clamp(Math.ceil(groupSize / 2), 1, 4);
  if (DRINKS_SNACKS.some((k) => q.includes(k))) return clamp(groupSize, 2, 8);
  return clamp(Math.ceil(groupSize / 2), 1, 4);
}

export function fallbackDecompose(intent: string, groupSize: number): ClaudeIntent {
  const t = intent.toLowerCase();
  const n = Math.max(1, Math.floor(groupSize));

  if (/(movie|party|game night|match|celebrat|friends|binge|birthday|b-day)/.test(t)) {
    return {
      vibe_category: /movie/.test(t) ? "movie" : "party",
      shopping_list: [
        { query: "cola soft drink", quantity: Math.max(2, n) },
        { query: "potato chips", quantity: Math.max(2, Math.ceil(n * 0.8)) },
        { query: "popcorn", quantity: 2 },
        { query: "chocolate", quantity: 2 },
      ],
    };
  }
  if (/(breakfast|morning)/.test(t)) {
    return {
      vibe_category: "breakfast",
      shopping_list: [
        { query: "milk", quantity: clamp(Math.ceil(n / 2), 1, 4) },
        { query: "bread", quantity: clamp(Math.ceil(n / 4), 1, 2) },
        { query: "eggs", quantity: clamp(Math.ceil(n / 2), 1, 4) },
        { query: "corn flakes cereal", quantity: 1 },
      ],
    };
  }
  if (/(healthy|detox|fresh juice|fruit)/.test(t)) {
    return {
      vibe_category: "healthy",
      shopping_list: [
        { query: "orange juice", quantity: 1 },
        { query: "mixed fruit juice", quantity: 1 },
        { query: "water", quantity: 2 },
      ],
    };
  }
  if (/(hydrat|summer|hot day|thirsty|water)/.test(t)) {
    return {
      vibe_category: "hydration",
      shopping_list: [
        { query: "water", quantity: Math.max(2, n) },
        { query: "soft drink", quantity: n },
        { query: "juice", quantity: 2 },
      ],
    };
  }
  if (/(restock|weekly|grocery|household|family)/.test(t)) {
    return {
      vibe_category: "restock",
      shopping_list: [
        { query: "milk", quantity: 2 },
        { query: "bread", quantity: 1 },
        { query: "eggs", quantity: 1 },
        { query: "butter", quantity: 1 },
        { query: "noodles", quantity: 1 },
      ],
    };
  }
  return {
    vibe_category: "snack",
    shopping_list: [
      { query: "chips snacks", quantity: 2 },
      { query: "cold drink", quantity: 2 },
      { query: "chocolate", quantity: 1 },
    ],
  };
}

function tryParseJSON(s: string): unknown {
  const trimmed = s.trim();
  try { return JSON.parse(trimmed); } catch {}
  const m = trimmed.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export async function decomposeIntent(
  intent: string,
  groupSize: number,
): Promise<DecomposedIntent> {
  if (!isLLMConfigured()) {
    return { ...fallbackDecompose(intent, groupSize), usedFallback: true };
  }
  try {
    const userMsg = JSON.stringify({ intent, groupSize });
    const raw = await invokeLLM({ system: SYSTEM_PROMPT, user: userMsg, maxTokens: 500, temperature: 0.2 });
    const parsed = tryParseJSON(raw);
    const validated = ClaudeIntentSchema.safeParse(parsed);
    if (!validated.success) throw new Error("Schema mismatch");

    const items = validated.data.shopping_list.map((item) => ({
      query: item.query,
      quantity: Math.max(1, Math.min(item.quantity, scaleQuantity(item.query, groupSize) + 2)),
    }));

    return {
      vibe_category: validated.data.vibe_category,
      shopping_list: items,
      usedFallback: false,
    };
  } catch {
    return { ...fallbackDecompose(intent, groupSize), usedFallback: true };
  }
}
