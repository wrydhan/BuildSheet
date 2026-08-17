import { assertEquals } from "jsr:@std/assert@^1";
import {
  type ComposeEntry,
  composeCallouts,
  criteriaForFacet,
  entryMatchesFacet,
  selectFacetEntries,
  suggestFacets,
} from "../_shared/shared/posters/index.ts";

function ce(over: Partial<ComposeEntry> & { id: string }): ComposeEntry {
  return {
    type: "mod",
    title: `title ${over.id}`,
    category: null,
    notes: null,
    reasoning: null,
    narration: null,
    ...over,
  };
}

Deno.test("entryMatchesFacet folds neighbouring categories", () => {
  assertEquals(entryMatchesFacet({ type: "mod", category: "turbo" }, "engine"), true);
  assertEquals(entryMatchesFacet({ type: "mod", category: "coilovers" }, "suspension"), true);
  assertEquals(entryMatchesFacet({ type: "mod", category: "brakes" }, "suspension"), true);
  assertEquals(entryMatchesFacet({ type: "mod", category: "tires" }, "wheels"), true);
  assertEquals(entryMatchesFacet({ type: "mod", category: "engine" }, "wheels"), false);
});

Deno.test("entryMatchesFacet: overall matches all; maintenance matches services", () => {
  assertEquals(entryMatchesFacet({ type: "mod", category: "wheels" }, "overall"), true);
  assertEquals(entryMatchesFacet({ type: "service", category: null }, "maintenance"), true);
  assertEquals(entryMatchesFacet({ type: "mod", category: "wheels" }, "maintenance"), false);
});

Deno.test("suggestFacets leads with overall and ranks the rest by count", () => {
  const entries: ComposeEntry[] = [
    ce({ id: "1", category: "coilovers" }),
    ce({ id: "2", category: "sway bar" }), // suspension
    ce({ id: "3", category: "wheels" }),
    ce({ id: "4", type: "service", category: "oil" }),
  ];
  const s = suggestFacets(entries);
  assertEquals(s[0].facet, "overall");
  assertEquals(s[0].count, 4);
  // suspension (2) should outrank wheels (1) and maintenance (1)
  assertEquals(s[1].facet, "suspension");
  assertEquals(s[1].count, 2);
});

Deno.test("suggestFacets returns nothing for no entries", () => {
  assertEquals(suggestFacets([]), []);
});

Deno.test("selectFacetEntries caps at slot count, keeping the richest in order", () => {
  const entries: ComposeEntry[] = [
    ce({ id: "1", category: "engine", narration: "short" }),
    ce({ id: "2", category: "engine", narration: "a much longer and richer story about the tune" }),
    ce({ id: "3", category: "engine", reasoning: "medium length reasoning here" }),
    ce({ id: "4", category: "wheels" }), // not engine
  ];
  const chosen = selectFacetEntries(entries, "engine", 2);
  // Keeps 2 richest engine entries (#2, #3) but restores input order.
  assertEquals(chosen.map((e) => e.id), ["2", "3"]);
});

Deno.test("composeCallouts prefers narration, numbers slots from 1", () => {
  const chosen: ComposeEntry[] = [
    ce({ id: "a", title: "Coilovers", narration: "Dropped for the track." }),
    ce({ id: "b", title: "Oil change", reasoning: null, notes: "5W-30" }),
  ];
  const callouts = composeCallouts(chosen);
  assertEquals(callouts[0], {
    entry_id: "a",
    label: "Coilovers",
    narration: "Dropped for the track.",
    slot: "1",
    kind: "entry",
  });
  assertEquals(callouts[1].narration, "5W-30"); // falls back to notes
  assertEquals(callouts[1].slot, "2");
});

Deno.test("criteriaForFacet maps facet + image availability", () => {
  const few: ComposeEntry[] = [ce({ id: "1", narration: "x" })];
  const overall = criteriaForFacet("overall", few, true, "90s_jdm");
  assertEquals(overall.image, "hero"); // overall shot is a hero
  assertEquals(overall.textAmount, "low");
  assertEquals(overall.stylePreference, "90s_jdm");

  const engineNoImg = criteriaForFacet("engine", few, false);
  assertEquals(engineNoImg.image, "none");
});
