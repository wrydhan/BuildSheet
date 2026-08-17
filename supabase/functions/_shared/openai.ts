import type { StructuredCallOptions, StructuredLLM } from "./llm.ts";

/**
 * Minimal, dependency-free wrapper around OpenAI Chat Completions with
 * Structured Outputs (strict JSON schema). Uses raw fetch so it runs cleanly on
 * the Supabase Edge (Deno) runtime with no SDK. One of the providers behind the
 * `StructuredLLM` dispatcher in `llm.ts`.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-2024-08-06"; // first GA model with Structured Outputs

export const callOpenAIStructured: StructuredLLM = async <T>(
  opts: StructuredCallOptions,
): Promise<T> => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const model = opts.model ?? Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL;

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: opts.schemaName, strict: true, schema: opts.jsonSchema },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const choice = data?.choices?.[0]?.message;
  if (choice?.refusal) {
    throw new Error(`OpenAI refused the request: ${choice.refusal}`);
  }
  const content = choice?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("OpenAI returned empty content");
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("OpenAI returned invalid JSON despite strict schema");
  }
};
