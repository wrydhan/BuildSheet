import {
  type SegmentModelOutput,
  segmentModelOutputSchema,
  type SegmentResult,
  segmentResultSchema,
  SEGMENT_JSON_SCHEMA,
  GEMINI_SEGMENT_SCHEMA,
} from "../_shared/shared/schema/index.ts";
import {
  SEGMENT_SYSTEM_PROMPT,
  SEGMENT_USER_PROMPT,
} from "../_shared/shared/prompts/index.ts";
import { defaultStructuredLLM, type StructuredLLM } from "../_shared/llm.ts";
import { handleCors, json } from "../_shared/http.ts";

/**
 * Stage 1 — Segment. Splits the owner's freeform text into distinct items.
 * The stable `tmp_id` is assigned here (index-based) rather than trusting the
 * model, so extract can reliably map results back.
 *
 * Exported for direct unit testing; the HTTP server is only started when this
 * module is the program entry point (`import.meta.main`).
 */
export async function runSegment(
  rawText: string,
  llm: StructuredLLM = defaultStructuredLLM,
): Promise<SegmentResult> {
  const trimmed = rawText?.trim() ?? "";
  if (trimmed.length === 0) {
    return segmentResultSchema.parse({ items: [] });
  }

  const raw = await llm<SegmentModelOutput>({
    system: SEGMENT_SYSTEM_PROMPT,
    user: SEGMENT_USER_PROMPT(trimmed),
    schemaName: "segment",
    jsonSchema: SEGMENT_JSON_SCHEMA,
    geminiSchema: GEMINI_SEGMENT_SCHEMA,
  });

  const model = segmentModelOutputSchema.parse(raw);
  const items = model.items.map((it, i) => ({
    tmp_id: `item-${i + 1}`,
    snippet: it.snippet,
  }));
  return segmentResultSchema.parse({ items });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    const pre = handleCors(req);
    if (pre) return pre;
    try {
      const body = await req.json();
      const rawText = typeof body?.raw_text === "string" ? body.raw_text : "";
      const result = await runSegment(rawText);
      return json(result);
    } catch (err) {
      console.error("pipeline-segment error:", err);
      return json({ error: String(err instanceof Error ? err.message : err) }, 500);
    }
  });
}
