import type { StructuredCallOptions } from "./llm.ts";

/**
 * Minimal, dependency-free wrapper around the Gemini (Google Generative
 * Language) API with structured JSON output. Uses raw fetch so it runs cleanly
 * on the Supabase Edge (Deno) runtime.
 */

const DEFAULT_MODEL = "gemini-2.5-flash";

export const callGeminiStructured = async <T>(
  opts: StructuredCallOptions,
): Promise<T> => {
  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const model = opts.model ?? Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL;
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0,
        responseMimeType: "application/json",
        responseSchema: opts.geminiSchema,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== "STOP") {
    throw new Error(`Gemini stopped early: ${candidate.finishReason}`);
  }

  const text: string =
    candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (text.length === 0) {
    throw new Error("Gemini returned empty content");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON despite responseSchema");
  }
};
