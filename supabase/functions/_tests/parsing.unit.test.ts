import { assert, assertEquals, assertRejects } from "jsr:@std/assert@^1";
import { runSegment } from "../pipeline-segment/index.ts";
import { runExtract } from "../pipeline-extract/index.ts";
import type { StructuredLLM } from "../_shared/openai.ts";
import type { ExtractedEntry, SegmentItem } from "../_shared/shared/schema/index.ts";

// deno-lint-ignore no-explicit-any
const asLLM = (fn: (opts: unknown) => unknown): StructuredLLM => (fn as any);

function entry(tmp_id: string, over: Partial<ExtractedEntry> = {}): ExtractedEntry {
  return {
    tmp_id,
    type: "mod",
    title: `title ${tmp_id}`,
    category: null,
    brand: null,
    cost: null,
    date: null,
    mileage: null,
    notes: null,
    reasoning: null,
    ...over,
  };
}

Deno.test("runSegment assigns index-based tmp_ids and validates", async () => {
  const llm = asLLM(() => ({ items: [{ snippet: "coilovers" }, { snippet: "sway bar" }] }));
  const res = await runSegment("coilovers and a sway bar", llm);
  assertEquals(res.items, [
    { tmp_id: "item-1", snippet: "coilovers" },
    { tmp_id: "item-2", snippet: "sway bar" },
  ]);
});

Deno.test("runSegment short-circuits empty input without calling the model", async () => {
  let called = false;
  const llm = asLLM(() => {
    called = true;
    return { items: [] };
  });
  const res = await runSegment("   \n  ", llm);
  assertEquals(res.items, []);
  assert(!called, "model should not be called for empty input");
});

Deno.test("runSegment rejects malformed model output", async () => {
  const llm = asLLM(() => ({ items: [{}] })); // missing snippet
  await assertRejects(() => runSegment("something", llm));
});

Deno.test("runExtract reconciles to input order and drops unknown tmp_ids", async () => {
  const items: SegmentItem[] = [
    { tmp_id: "item-1", snippet: "a" },
    { tmp_id: "item-2", snippet: "b" },
  ];
  const llm = asLLM(() => ({
    entries: [
      entry("item-2", { type: "mod", title: "B" }),
      entry("ghost", { title: "hallucinated" }), // unknown -> dropped
      entry("item-1", { type: "service", title: "A" }),
    ],
  }));
  const res = await runExtract(items, llm);
  assertEquals(res.entries.map((e) => e.tmp_id), ["item-1", "item-2"]);
  assertEquals(res.entries[0].title, "A");
});

Deno.test("runExtract requires at least one input item", async () => {
  const llm = asLLM(() => ({ entries: [] }));
  await assertRejects(() => runExtract([], llm));
});

Deno.test("runExtract rejects an invalid entry type", async () => {
  const items: SegmentItem[] = [{ tmp_id: "item-1", snippet: "a" }];
  const llm = asLLM(() => ({
    entries: [{ ...entry("item-1"), type: "bogus" }],
  }));
  await assertRejects(() => runExtract(items, llm));
});

Deno.test("runExtract preserves the notes/reasoning split from the model", async () => {
  const items: SegmentItem[] = [{ tmp_id: "item-1", snippet: "cobb intake" }];
  const llm = asLLM(() => ({
    entries: [
      entry("item-1", {
        brand: "Cobb",
        notes: "dry filter, 3.5 inch inlet",
        reasoning: "chose Cobb over AEM for the tune integration",
      }),
    ],
  }));
  const res = await runExtract(items, llm);
  assertEquals(res.entries[0].notes, "dry filter, 3.5 inch inlet");
  assertEquals(res.entries[0].reasoning, "chose Cobb over AEM for the tune integration");
});
