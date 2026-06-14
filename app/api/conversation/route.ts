import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { invokeLLM, isLLMConfigured } from "@/lib/gemini";
import { fallbackDecompose } from "@/lib/services/intent";
import { retrieveCandidates } from "@/lib/services/retrieval";
import { fetchByIds } from "@/lib/services/products";

const ConversationRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40),
  cart: z.record(z.string(), z.number().int().nonnegative()).default({}),
  zoneCode: z.string().min(3).max(10).default("110001"),
});

const ResponseSchema = z.object({
  reply: z.string().min(1),
  add: z
    .array(
      z.object({
        id: z.string(),
        qty: z.number().int().min(1).max(10),
      }),
    )
    .default([]),
  remove: z.array(z.string()).default([]),
});

const SYSTEM_PROMPT = [
  'You are "Amazon Picks", a warm, concise quick-commerce shopping assistant.',
  "You may ONLY recommend products that exist in the catalog the user provides.",
  "Reply with STRICT minified JSON only — no markdown, no prose, no code fences:",
  '{"reply":"<1-2 friendly sentences>","add":[{"id":"<catalog id>","qty":<int>}],"remove":["<catalog id>"]}.',
  "Rules:",
  "- Only use ids that exist in the catalog. If unsure, omit the item.",
  "- Only add items the customer clearly wants now.",
  "- Keep reply short and natural; do not list ids in the reply.",
  '- If the user asks for something not in the catalog, suggest the closest available item in the reply and either add it or wait for confirmation.',
].join(" ");

function tryParseJSON(s: string): unknown {
  const t = s.trim();
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function buildCatalogBrief(): Promise<{ brief: string; ids: Set<string> }> {
  // Pull a usefully sized slice of the catalog ranked by rankScore.
  // Brief format per line: id|name (brand) size ₹price
  const { items } = await import("@/lib/services/products").then((m) =>
    m.listProducts({ pageSize: 60, sort: "relevance" }),
  );
  const lines: string[] = [];
  const ids = new Set<string>();
  for (const p of items) {
    lines.push(`${p.id}|${p.name} (${p.brand}) ${p.size} ₹${p.price}`);
    ids.add(p.id);
  }
  return { brief: lines.join("\n"), ids };
}

async function ruleFallback(lastUserText: string): Promise<{
  reply: string;
  add: { id: string; qty: number }[];
  remove: string[];
}> {
  const dec = fallbackDecompose(lastUserText, 4);
  const add: { id: string; qty: number }[] = [];
  const names: string[] = [];
  for (const item of dec.shopping_list) {
    const cands = await retrieveCandidates(item.query, 4);
    const top = cands[0];
    if (top) {
      add.push({ id: top.id, qty: Math.max(1, item.quantity || 1) });
      names.push(top.name);
    }
  }
  const reply =
    names.length > 0
      ? `Added ${names.slice(0, 3).join(", ")}${names.length > 3 ? " and a couple more" : ""} to your cart. Anything else?`
      : "I can help with that — try naming a few things like cola, chips, milk or popcorn.";
  return { reply, add, remove: [] };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ConversationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { messages, cart } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUser?.text ?? "";

  let validIds: Set<string> | null = null;
  let usedFallback = false;
  let result: { reply: string; add: { id: string; qty: number }[]; remove: string[] };

  try {
    if (!isLLMConfigured()) throw new Error("LLM not configured");
    const { brief, ids } = await buildCatalogBrief();
    validIds = ids;

    const cartLines = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => `${id}×${q}`)
      .join(", ");
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.text}`)
      .join("\n");

    const userMsg = [
      "CATALOG (id|name (brand) size ₹price):",
      brief,
      "",
      cartLines ? `CURRENT CART: ${cartLines}` : "CURRENT CART: empty",
      "",
      "CONVERSATION:",
      transcript,
      "",
      "Reply now as the assistant.",
    ].join("\n");

    const raw = await invokeLLM({ system: SYSTEM_PROMPT, user: userMsg, maxTokens: 500, temperature: 0.4 });
    const json = tryParseJSON(raw);
    const v = ResponseSchema.safeParse(json);
    if (!v.success) throw new Error("Invalid LLM JSON");
    result = v.data;
  } catch {
    usedFallback = true;
    result = await ruleFallback(lastUserText);
  }

  // Validate any returned ids against the catalog.
  if (!validIds) {
    const all = await fetchByIds(
      Array.from(
        new Set([...result.add.map((a) => a.id), ...result.remove]),
      ),
    );
    validIds = new Set(all.map((p) => p.id));
  }
  const add = result.add.filter((a) => validIds!.has(a.id));
  const remove = result.remove.filter((id) => validIds!.has(id));

  return NextResponse.json({ reply: result.reply, add, remove, usedFallback });
}
