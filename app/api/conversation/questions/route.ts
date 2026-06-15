import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { invokeLLM, isLLMConfigured } from "@/lib/gemini";

const RequestSchema = z.object({
  query: z.string().min(1).max(2000),
});

const QuestionSchema = z.object({
  key: z.string().min(1).max(40),
  prompt: z.string().min(1).max(160),
  options: z.array(z.string().min(1).max(40)).min(2).max(5),
});

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1).max(3),
});

export type ConvQuestionDTO = z.infer<typeof QuestionSchema>;

const SYSTEM_PROMPT = [
  "You are a shopping assistant. Given a user's shopping query, produce 2-3 SHORT clarifying questions that will help build a better cart.",
  "Each question MUST be specific to the user's query — do not ask generic group-size/taste/healthy questions unless the query is literally about food for a group.",
  "If the query is about baby care, ask about age, skin sensitivity, or brand preference.",
  "If the query is about cleaning, ask about surface type, fragrance, or pet-safety.",
  "If the query is about a dish or meal, ask about people count, dietary restrictions, or spice level.",
  "If the query is about pet supplies, ask about pet type, age, or size.",
  "Return JSON: each question has a snake_case `key` (e.g. baby_age, surface_type), a friendly `prompt` ending with '?', and 3-4 short selectable `options`.",
  "Reply with STRICT minified JSON only — no markdown, no prose, no code fences:",
  '{"questions":[{"key":"...","prompt":"...","options":["...","..."]}]}',
].join(" ");

// Keyword-routed fallback used when Gemini isn't configured or fails.
type Topic =
  | "baby" | "pet" | "cleaning" | "personal_care" | "healthcare"
  | "beverage" | "breakfast" | "party" | "movie" | "meal" | "default";

const TOPIC_RULES: Array<{ topic: Topic; pattern: RegExp }> = [
  { topic: "baby",          pattern: /\b(baby|infant|toddler|newborn|diaper|wipe|formula|baby care)\b/i },
  { topic: "pet",           pattern: /\b(dog|cat|puppy|kitten|pet|aquarium|fish food)\b/i },
  { topic: "cleaning",      pattern: /\b(clean|detergent|floor|disinfect|laundry|toilet|mop|wipe down)\b/i },
  { topic: "personal_care", pattern: /\b(skincare|skin care|shampoo|soap|deodorant|face wash|moisturiz|moisturis)\b/i },
  { topic: "healthcare",    pattern: /\b(healthcare|medicine|first aid|pharmacy|wellness|sanitiz|antiseptic|band[- ]?aid)\b/i },
  { topic: "beverage",      pattern: /\b(drink|cold drink|cola|juice|water|hydrat|soda|beverage)\b/i },
  { topic: "breakfast",     pattern: /\b(breakfast|morning|cereal|brunch)\b/i },
  { topic: "party",         pattern: /\b(party|birthday|celebrat|anniversary)\b/i },
  { topic: "movie",         pattern: /\b(movie|cinema|film|netflix|popcorn night)\b/i },
  { topic: "meal",          pattern: /\b(dinner|lunch|meal|cook|recipe|dish|biryani|curry|pasta|pizza)\b/i },
];

const QUESTION_BANK: Record<Topic, ConvQuestionDTO[]> = {
  baby: [
    { key: "baby_age",     prompt: "What's the baby's age?",                options: ["0-6 months", "6-12 months", "1-2 years", "2+ years"] },
    { key: "skin_type",    prompt: "Any skin sensitivities to consider?",   options: ["sensitive", "normal", "eczema-prone", "not sure"] },
    { key: "brand_pref",   prompt: "Any brand preference?",                 options: ["Himalaya", "Johnson's", "Mamaearth", "no preference"] },
  ],
  pet: [
    { key: "pet_type",     prompt: "What kind of pet?",                     options: ["dog", "cat", "small pet", "fish"] },
    { key: "pet_age",      prompt: "How old is your pet?",                  options: ["puppy/kitten", "adult", "senior"] },
    { key: "pet_size",     prompt: "What size?",                            options: ["small", "medium", "large"] },
  ],
  cleaning: [
    { key: "surface",      prompt: "What surface or area is this for?",     options: ["floors", "kitchen", "bathroom", "all-purpose"] },
    { key: "fragrance",    prompt: "Fragrance preference?",                  options: ["fresh/citrus", "floral", "unscented"] },
    { key: "pet_safe",     prompt: "Should it be pet/child safe?",           options: ["yes", "no", "doesn't matter"] },
  ],
  personal_care: [
    { key: "skin_type",    prompt: "What's your skin type?",                options: ["oily", "dry", "combination", "sensitive"] },
    { key: "concern",      prompt: "Any specific concern?",                  options: ["acne", "anti-aging", "hydration", "general"] },
    { key: "preference",   prompt: "Any preference?",                        options: ["natural/ayurvedic", "fragrance-free", "no preference"] },
  ],
  healthcare: [
    { key: "for_whom",     prompt: "Who is this for?",                       options: ["adult", "child", "elderly", "everyone"] },
    { key: "category",     prompt: "What kind of items do you need?",        options: ["first aid", "daily wellness", "pain relief", "sanitisers"] },
    { key: "brand_pref",   prompt: "Any brand preference?",                  options: ["Dettol", "Savlon", "Himalaya", "no preference"] },
  ],
  beverage: [
    { key: "group_size",   prompt: "How many people?",                       options: ["1-2", "3-4", "5-8", "8+"] },
    { key: "type",         prompt: "What kind of drinks?",                   options: ["soft drinks", "juices", "water", "mixed"] },
    { key: "sugar",        prompt: "Sugar preference?",                      options: ["regular", "diet/zero", "no preference"] },
  ],
  breakfast: [
    { key: "group_size",   prompt: "How many people?",                       options: ["1", "2", "4", "6+"] },
    { key: "diet",         prompt: "Veg or non-veg?",                        options: ["veg", "non-veg", "both"] },
    { key: "style",        prompt: "Quick or full breakfast?",               options: ["grab-and-go", "full meal", "mix"] },
  ],
  party: [
    { key: "guest_count",  prompt: "How many guests?",                       options: ["under 5", "5-10", "10-20", "20+"] },
    { key: "vibe",         prompt: "What's the vibe?",                       options: ["kids party", "casual", "formal"] },
    { key: "focus",        prompt: "Snacks-heavy or drinks-heavy?",          options: ["snacks", "drinks", "both equally"] },
  ],
  movie: [
    { key: "group_size",   prompt: "How many people?",                       options: ["1-2", "3-4", "5+"] },
    { key: "taste",        prompt: "Sweet, savoury, or both?",               options: ["sweet", "savoury", "both"] },
    { key: "drinks",       prompt: "Want drinks too?",                       options: ["soft drinks", "juices", "water only", "no"] },
  ],
  meal: [
    { key: "group_size",   prompt: "How many people?",                       options: ["1-2", "3-4", "5-8", "8+"] },
    { key: "diet",         prompt: "Veg or non-veg?",                        options: ["veg", "non-veg", "both"] },
    { key: "spice",        prompt: "Spice level?",                           options: ["mild", "medium", "spicy"] },
  ],
  default: [
    { key: "group_size",   prompt: "How many people is this for?",           options: ["1", "2", "4", "6+"] },
    { key: "budget",       prompt: "Any budget in mind?",                    options: ["budget", "mid-range", "premium", "no limit"] },
    { key: "preference",   prompt: "Any specific preference?",                options: ["yes", "no", "skip"] },
  ],
};

function classify(query: string): Topic {
  for (const r of TOPIC_RULES) if (r.pattern.test(query)) return r.topic;
  return "default";
}

function fallbackQuestions(query: string): ConvQuestionDTO[] {
  return QUESTION_BANK[classify(query)];
}

function tryParseJSON(s: string): unknown {
  const t = s.trim();
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { query } = parsed.data;
  console.log("→ POST /api/conversation/questions", JSON.stringify({ query }));

  if (!isLLMConfigured()) {
    const fb = fallbackQuestions(query);
    console.log("← rule-based fallback (no LLM key)", JSON.stringify({ topic: classify(query), questions: fb }));
    return NextResponse.json({ questions: fb, usedFallback: true });
  }

  try {
    const raw = await invokeLLM({
      system: SYSTEM_PROMPT,
      user: `User query: "${query}"\n\nReturn 2-3 query-specific clarifying questions as JSON now.`,
      maxTokens: 400,
      temperature: 0.5,
    });
    const json = tryParseJSON(raw);
    const v = ResponseSchema.safeParse(json);
    if (!v.success) throw new Error("invalid LLM JSON");
    console.log("← LLM", JSON.stringify(v.data));
    return NextResponse.json({ questions: v.data.questions, usedFallback: false });
  } catch (err) {
    const fb = fallbackQuestions(query);
    console.log("← rule-based fallback", (err as Error).message, JSON.stringify({ topic: classify(query), questions: fb }));
    return NextResponse.json({ questions: fb, usedFallback: true });
  }
}
