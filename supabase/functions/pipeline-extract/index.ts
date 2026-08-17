import {
  type ExtractResult,
  extractResultSchema,
  type SegmentItem,
  segmentItemSchema,
  EXTRACT_JSON_SCHEMA,
  GEMINI_EXTRACT_SCHEMA,
} from "../_shared/shared/schema/index.ts";
import {
  EXTRACT_SYSTEM_PROMPT,
  EXTRACT_USER_PROMPT,
} from "../_shared/shared/prompts/index.ts";
import { defaultStructuredLLM, type StructuredLLM } from "../_shared/llm.ts";
import { handleCors, json } from "../_shared/http.ts";
import { z } from "npm:zod@^3.23.8";

/**
 * Stage 2 — Extract. Per item, pull structured fields and split factual `notes`
 * from `reasoning` (the "why"). Batched in a single call with explicit tmp_ids
 * to stay cheap while keeping items mappable.
 *
 * Returned entries are reconciled against the input: only entries whose tmp_id
 * matches an input item are kept, and they are re-ordered to match input order.
 * This defends against a model that drops, duplicates, or reorders items.
 */
export async function runExtract(
  items: SegmentItem[],
  llm: StructuredLLM = defaultStructuredLLM,
): Promise<ExtractResult> {
  const validItems = z.array(segmentItemSchema).min(1).parse(items);

  const raw = await llm<ExtractResult>({
    system: EXTRACT_SYSTEM_PROMPT,
    user: EXTRACT_USER_PROMPT(validItems),
    schemaName: "extract",
    jsonSchema: EXTRACT_JSON_SCHEMA,
    geminiSchema: GEMINI_EXTRACT_SCHEMA,
  });

  const parsed = extractResultSchema.parse(raw);

  // Reconcile against input tmp_ids, preserving input order.
  const byTmpId = new Map(parsed.entries.map((e) => [e.tmp_id, e]));
  const reconciled = validItems
    .map((item) => byTmpId.get(item.tmp_id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  return extractResultSchema.parse({ entries: reconciled });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    const pre = handleCors(req);
    if (pre) return pre;
    try {
      const body = await req.json();
      const items = Array.isArray(body?.items) ? body.items : [];
      const result = await runExtract(items);
      return json(result);
    } catch (err) {
      console.error("pipeline-extract error:", err);
      return json({ error: String(err instanceof Error ? err.message : err) }, 500);
    }
  });
}
