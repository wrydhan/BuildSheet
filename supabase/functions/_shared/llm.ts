import type { GeminiSchema, JSONSchema } from "./shared/schema/index.ts";
import { callOpenAIStructured } from "./openai.ts";
import { callGeminiStructured } from "./gemini.ts";
import { callMockStructured } from "./mock.ts";

/**
 * Provider-agnostic structured-LLM contract. Each call supplies both provider
 * schema formats; the active provider (LLM_PROVIDER env, default "gemini") uses
 * the one it understands. `StructuredLLM` is the injection point — tests pass a
 * deterministic mock so parsing logic runs without network or spend.
 *
 * LLM_PROVIDER values:
 *   "gemini" (default) — real Gemini, needs GEMINI_API_KEY.
 *   "openai"           — real OpenAI, needs OPENAI_API_KEY.
 *   "mock"             — keyless deterministic stub for testing the app with no
 *                        API key or spend (see mock.ts).
 */
export interface StructuredCallOptions {
  system: string;
  user: string;
  schemaName: string;
  /** OpenAI strict JSON schema (used when LLM_PROVIDER=openai). */
  jsonSchema?: JSONSchema;
  /** Gemini responseSchema (used when LLM_PROVIDER=gemini, the default). */
  geminiSchema?: GeminiSchema;
  model?: string;
  temperature?: number;
}

export type StructuredLLM = <T>(opts: StructuredCallOptions) => Promise<T>;

export const defaultStructuredLLM: StructuredLLM = (opts) => {
  const provider = Deno.env.get("LLM_PROVIDER") ?? "gemini";
  if (provider === "mock") return callMockStructured(opts);
  if (provider === "openai") return callOpenAIStructured(opts);
  return callGeminiStructured(opts);
};
