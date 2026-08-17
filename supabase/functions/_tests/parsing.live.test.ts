/**
 * Live evaluation of the parsing engine against the real LLM provider
 * (Gemini by default; set LLM_PROVIDER=openai to use OpenAI).
 *
 * Skipped automatically unless a provider key is set, so `deno test` stays green
 * offline. Run it explicitly with:
 *   deno test --env-file=supabase/functions/.env --allow-env --allow-net supabase/functions/
 *
 * Assertions are structural invariants the product depends on — not exact
 * strings — because model wording varies. The null-ness checks are the
 * anti-fabrication guardrail: a model that invents a cost/date/mileage on a bare
 * fixture fails the test.
 */
import { assert } from "jsr:@std/assert@^1";
import { runSegment } from "../pipeline-segment/index.ts";
import { runExtract } from "../pipeline-extract/index.ts";
import { FIXTURES } from "./fixtures.ts";

const LIVE = Boolean(
  Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY") ||
    Deno.env.get("OPENAI_API_KEY"),
);

for (const fx of FIXTURES) {
  Deno.test({
    name: `live: ${fx.name}`,
    ignore: !LIVE,
    fn: async () => {
      const seg = await runSegment(fx.raw_text);
      const count = seg.items.length;

      assert(
        count >= fx.minItems && count <= fx.maxItems,
        `${fx.name}: segmented ${count} items, expected ${fx.minItems}-${fx.maxItems}`,
      );

      if (count === 0) return;

      const { entries } = await runExtract(seg.items);
      const inputIds = new Set(seg.items.map((i) => i.tmp_id));

      // eslint-disable-next-line no-console
      console.log(`\n[${fx.name}]`, JSON.stringify(entries, null, 2));

      for (const e of entries) {
        assert(e.title.trim().length > 0, `${fx.name}: entry has empty title`);
        assert(e.type === "mod" || e.type === "service", `${fx.name}: bad type ${e.type}`);
        assert(inputIds.has(e.tmp_id), `${fx.name}: entry has unknown tmp_id ${e.tmp_id}`);
      }

      if (fx.expectAllCostsNull) {
        assert(entries.every((e) => e.cost === null), `${fx.name}: fabricated a cost`);
      }
      if (fx.expectAllDatesNull) {
        assert(entries.every((e) => e.date === null), `${fx.name}: fabricated a date`);
      }
      if (fx.expectAllMileageNull) {
        assert(entries.every((e) => e.mileage === null), `${fx.name}: fabricated mileage`);
      }
      if (fx.expectReasoning) {
        assert(
          entries.some((e) => e.reasoning !== null && e.reasoning.trim().length > 0),
          `${fx.name}: expected at least one entry with reasoning`,
        );
      }
      if (fx.expectTypes) {
        const present = new Set(entries.map((e) => e.type));
        for (const t of fx.expectTypes) {
          assert(present.has(t), `${fx.name}: expected a '${t}' entry`);
        }
      }
    },
  });
}
