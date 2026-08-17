import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  GEMINI_NARRATE_SCHEMA,
  NARRATE_JSON_SCHEMA,
  type NarrateCarContext,
  type NarrateEntryContext,
  type NarrateModelOutput,
  narrateModelOutputSchema,
  type Tone,
  toneSchema,
} from "../_shared/shared/schema/index.ts";
import {
  NARRATE_SYSTEM_PROMPT,
  NARRATE_USER_PROMPT,
} from "../_shared/shared/prompts/index.ts";
import { defaultStructuredLLM, type StructuredLLM } from "../_shared/llm.ts";
import { handleCors, json } from "../_shared/http.ts";

/** Narration is creative, so it runs warm — warmer as the tone gets bolder. */
const TONE_TEMPERATURE: Record<Tone, number> = {
  straight: 0.4,
  enthusiast: 0.7,
  full_documentary: 0.85,
};

/**
 * Stage 4 — Narrate (pure compute; exported for direct unit testing). Given the
 * car identity, the keyed entries, and a tone, produce the overall narration and
 * one line per entry. Output is reconciled against the input keys so a dropped
 * or hallucinated key can never mis-map narration onto the wrong entry.
 */
export async function runNarrate(
  car: NarrateCarContext,
  entries: NarrateEntryContext[],
  tone: Tone,
  llm: StructuredLLM = defaultStructuredLLM,
): Promise<NarrateModelOutput> {
  const raw = await llm<NarrateModelOutput>({
    system: NARRATE_SYSTEM_PROMPT(tone),
    user: NARRATE_USER_PROMPT(car, entries),
    schemaName: "narrate",
    jsonSchema: NARRATE_JSON_SCHEMA,
    geminiSchema: GEMINI_NARRATE_SCHEMA,
    temperature: TONE_TEMPERATURE[tone],
  });

  const parsed = narrateModelOutputSchema.parse(raw);
  const byKey = new Map(parsed.items.map((it) => [it.key, it.narration]));
  const items = entries.map((e) => ({
    key: e.key,
    narration: byKey.get(e.key) ?? "",
  }));
  return narrateModelOutputSchema.parse({ overall: parsed.overall, items });
}

type CarRow = NarrateCarContext & { id: string };
type EntryRow = {
  id: string;
  type: "mod" | "service";
  title: string;
  category: string | null;
  brand: string | null;
  notes: string | null;
  reasoning: string | null;
};

async function handle(req: Request): Promise<Response> {
  const pre = handleCors(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const carId = typeof body?.car_id === "string" ? body.car_id : null;
    const toneParsed = toneSchema.safeParse(body?.tone);
    if (!carId) return json({ error: "car_id is required" }, 400);
    if (!toneParsed.success) {
      return json({ error: "tone must be straight | enthusiast | full_documentary" }, 400);
    }
    const tone = toneParsed.data;

    // RLS scopes both reads to the owner.
    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select("id, year, make, model, trim, nickname")
      .eq("id", carId)
      .maybeSingle();
    if (carErr) return json({ error: carErr.message }, 400);
    if (!car) return json({ error: "Car not found" }, 404);

    const { data: entryRows, error: entriesErr } = await supabase
      .from("entries")
      .select("id, type, title, category, brand, notes, reasoning")
      .eq("car_id", carId)
      .order("created_at", { ascending: true });
    if (entriesErr) return json({ error: entriesErr.message }, 400);

    // Short, unmanglable keys (e1, e2, …) mapped back to real UUIDs.
    const rows = (entryRows ?? []) as EntryRow[];
    const contexts: NarrateEntryContext[] = rows.map((e, i) => ({
      key: `e${i + 1}`,
      type: e.type,
      title: e.title,
      category: e.category,
      brand: e.brand,
      notes: e.notes,
      reasoning: e.reasoning,
    }));
    const idByKey = new Map(contexts.map((c, i) => [c.key, rows[i].id]));

    const carCtx: NarrateCarContext = {
      year: (car as CarRow).year,
      make: (car as CarRow).make,
      model: (car as CarRow).model,
      trim: (car as CarRow).trim,
      nickname: (car as CarRow).nickname,
    };

    const result = await runNarrate(carCtx, contexts, tone);

    // Persist. Narration is post-review and freely regenerable, so it commits
    // directly. Empty strings are stored as null (a bare entry has no line).
    const carUpdate = await supabase
      .from("cars")
      .update({ tone, narration: result.overall.trim() || null })
      .eq("id", carId);
    if (carUpdate.error) return json({ error: carUpdate.error.message }, 400);

    const perEntry: Array<{ id: string; narration: string | null }> = [];
    await Promise.all(
      result.items.map(async (item) => {
        const id = idByKey.get(item.key);
        if (!id) return;
        const narration = item.narration.trim() || null;
        perEntry.push({ id, narration });
        const upd = await supabase
          .from("entries")
          .update({ narration })
          .eq("id", id);
        if (upd.error) throw upd.error;
      }),
    );

    return json({ overall: result.overall, tone, entries: perEntry });
  } catch (err) {
    console.error("narrate error:", err);
    return json(
      { error: String(err instanceof Error ? err.message : err) },
      500,
    );
  }
}

if (import.meta.main) {
  Deno.serve(handle);
}
