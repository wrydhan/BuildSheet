import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  type ComposeEntry,
  composeCallouts,
  criteriaForFacet,
  entryMatchesFacet,
  FACETS,
  type Facet,
  selectFacetEntries,
  selectTemplate,
  type TemplateMeta,
} from "../_shared/shared/index.ts";
import { handleCors, json } from "../_shared/http.ts";

/**
 * Compose a poster for a user-chosen facet (build spec §6 steps 5–7, minus the
 * pixel render). Authenticated: runs under the caller's RLS.
 *
 * Order of operations matters:
 *   1. Gather ALL entries that belong to the facet.
 *   2. Derive selection criteria from that full set (so we ask for a template
 *      with enough callout slots) and pick a template — falling back to the
 *      flexible one when nothing specialized fits.
 *   3. Cap the entries to the chosen template's slot count (richest win).
 *   4. Persist: replace any existing poster for this facet, then its callouts.
 *
 * The image layer is optional (graceful degradation): a poster with no photo is
 * valid. Text is always the user's typeset data, never generated pixels.
 */
async function handle(req: Request): Promise<Response> {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const carId = typeof body?.car_id === "string" ? body.car_id : null;
    const facet = body?.facet as Facet | undefined;
    const stylePreference = typeof body?.style_preference === "string"
      ? body.style_preference
      : null;
    const imageUrl = typeof body?.image_url === "string" ? body.image_url : null;
    const imageSource = typeof body?.image_source === "string"
      ? body.image_source
      : imageUrl
      ? "upload"
      : null;

    if (!carId) return json({ error: "car_id is required" }, 400);
    if (!facet || !FACETS.includes(facet)) {
      return json({ error: `facet must be one of ${FACETS.join(", ")}` }, 400);
    }

    // Ownership check (RLS also enforces it on every subsequent statement).
    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select("id")
      .eq("id", carId)
      .maybeSingle();
    if (carErr) return json({ error: carErr.message }, 400);
    if (!car) return json({ error: "Car not found" }, 404);

    const { data: entryRows, error: entriesErr } = await supabase
      .from("entries")
      .select("id, type, title, category, notes, reasoning, narration")
      .eq("car_id", carId)
      .order("created_at", { ascending: true });
    if (entriesErr) return json({ error: entriesErr.message }, 400);
    const entries = (entryRows ?? []) as ComposeEntry[];

    const { data: templateRows, error: templatesErr } = await supabase
      .from("templates")
      .select("*");
    if (templatesErr) return json({ error: templatesErr.message }, 400);
    const templates = (templateRows ?? []) as TemplateMeta[];
    if (templates.length === 0) {
      return json({ error: "No templates available" }, 500);
    }

    // 1–2: criteria from the full matching set, then select a template.
    const facetEntries = entries.filter((e) => entryMatchesFacet(e, facet));
    const criteria = criteriaForFacet(
      facet,
      facetEntries,
      !!imageUrl,
      stylePreference,
    );
    const template = selectTemplate(templates, criteria);
    if (!template) return json({ error: "Could not select a template" }, 500);

    // 3: cap to the chosen template's slots; 4: build callouts.
    const chosen = selectFacetEntries(entries, facet, template.callout_count);
    const callouts = composeCallouts(chosen);

    // Replace any existing poster for this facet (callouts cascade on delete).
    const del = await supabase
      .from("posters")
      .delete()
      .eq("car_id", carId)
      .eq("facet", facet);
    if (del.error) return json({ error: del.error.message }, 400);

    // Append after existing posters in the magazine order.
    const { count } = await supabase
      .from("posters")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId);

    const { data: poster, error: posterErr } = await supabase
      .from("posters")
      .insert({
        car_id: carId,
        template_id: template.id,
        facet,
        image_url: imageUrl,
        image_source: imageSource,
        display_order: count ?? 0,
      })
      .select("*")
      .single();
    if (posterErr) return json({ error: posterErr.message }, 400);

    let insertedCallouts: unknown[] = [];
    if (callouts.length > 0) {
      const { data: coData, error: coErr } = await supabase
        .from("callouts")
        .insert(callouts.map((c) => ({ ...c, poster_id: poster.id })))
        .select("*");
      if (coErr) return json({ error: coErr.message }, 400);
      insertedCallouts = coData ?? [];
    }

    return json({ poster, callouts: insertedCallouts, template });
  } catch (err) {
    console.error("compose-poster error:", err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
}

if (import.meta.main) {
  Deno.serve(handle);
}
