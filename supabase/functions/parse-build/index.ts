import { createClient } from "jsr:@supabase/supabase-js@2";
import { extractResultSchema } from "../_shared/shared/schema/index.ts";
import { runSegment } from "../pipeline-segment/index.ts";
import { runExtract } from "../pipeline-extract/index.ts";
import { handleCors, json } from "../_shared/http.ts";

/**
 * Orchestrator for the text pipeline (build spec §6, steps 1–3). Authenticated:
 * it runs as the calling user (their JWT is forwarded to PostgREST), so RLS is
 * the ownership guarantee — a caller can only touch their own car.
 *
 * It does three things:
 *   1. Persists the user's verbatim `raw_text` (the source of truth) on the car.
 *   2. Segments then extracts entries from that text.
 *   3. Returns the extracted entries for the ★ user-review step.
 *
 * Crucially it does NOT write `entries`. Nothing derived is committed until the
 * user has reviewed and corrected it; the app persists entries after review.
 */
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

    // A user-scoped client: every query runs under the caller's RLS policies.
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
    const rawText = typeof body?.raw_text === "string" ? body.raw_text : "";
    if (!carId) {
      return json({ error: "car_id is required" }, 400);
    }

    // Persist the user's words. RLS scopes this to the owner: a non-owner update
    // matches zero rows, so `updated` is null and we 404 without leaking existence.
    const { data: updated, error: updateErr } = await supabase
      .from("cars")
      .update({ raw_text: rawText })
      .eq("id", carId)
      .select("id")
      .maybeSingle();
    if (updateErr) {
      return json({ error: updateErr.message }, 400);
    }
    if (!updated) {
      return json({ error: "Car not found" }, 404);
    }

    // Empty/whitespace text is a valid state (graceful degradation): no items.
    const segmented = await runSegment(rawText);
    if (segmented.items.length === 0) {
      return json({ entries: [] });
    }

    const extracted = await runExtract(segmented.items);
    return json(extractResultSchema.parse(extracted));
  } catch (err) {
    console.error("parse-build error:", err);
    return json(
      { error: String(err instanceof Error ? err.message : err) },
      500,
    );
  }
}

if (import.meta.main) {
  Deno.serve(handle);
}
