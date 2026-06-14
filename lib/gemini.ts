import { GoogleGenAI } from "@google/genai";

const MODEL_ID = process.env.GEMINI_MODEL_ID ?? "gemini-2.0-flash";

let cachedClient: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

export async function invokeLLM(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const res = await client().models.generateContent({
    model: MODEL_ID,
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 600,
      responseMimeType: "application/json",
    },
  });
  const out = (res.text ?? "").trim();
  if (!out) throw new Error("Empty response from Gemini");
  return out;
}
