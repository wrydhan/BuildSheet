import { assertEquals, assertRejects } from "jsr:@std/assert@^1";
import { runNarrate } from "../narrate/index.ts";
import type { StructuredLLM } from "../_shared/openai.ts";
import type {
  NarrateCarContext,
  NarrateEntryContext,
} from "../_shared/shared/schema/index.ts";

// deno-lint-ignore no-explicit-any
const asLLM = (fn: (opts: unknown) => unknown): StructuredLLM => (fn as any);

const CAR: NarrateCarContext = {
  year: 1999,
  make: "Nissan",
  model: "Silvia",
  trim: "Spec-R",
  nickname: null,
};

function ctx(key: string, over: Partial<NarrateEntryContext> = {}): NarrateEntryContext {
  return {
    key,
    type: "mod",
    title: `title ${key}`,
    category: null,
    brand: null,
    notes: null,
    reasoning: null,
    ...over,
  };
}

Deno.test("runNarrate maps narration back to entries by key, in input order", async () => {
  const entries = [ctx("e1"), ctx("e2")];
  // Model returns items out of order; reconciliation must fix that.
  const llm = asLLM(() => ({
    overall: "A build with intent.",
    items: [
      { key: "e2", narration: "second" },
      { key: "e1", narration: "first" },
    ],
  }));
  const res = await runNarrate(CAR, entries, "enthusiast", llm);
  assertEquals(res.overall, "A build with intent.");
  assertEquals(res.items, [
    { key: "e1", narration: "first" },
    { key: "e2", narration: "second" },
  ]);
});

Deno.test("runNarrate fills a missing key with an empty narration", async () => {
  const entries = [ctx("e1"), ctx("e2")];
  const llm = asLLM(() => ({
    overall: "",
    items: [{ key: "e1", narration: "only one" }],
  }));
  const res = await runNarrate(CAR, entries, "straight", llm);
  assertEquals(res.items, [
    { key: "e1", narration: "only one" },
    { key: "e2", narration: "" },
  ]);
});

Deno.test("runNarrate ignores hallucinated keys not in the input", async () => {
  const entries = [ctx("e1")];
  const llm = asLLM(() => ({
    overall: "x",
    items: [
      { key: "ghost", narration: "should be dropped" },
      { key: "e1", narration: "kept" },
    ],
  }));
  const res = await runNarrate(CAR, entries, "full_documentary", llm);
  assertEquals(res.items, [{ key: "e1", narration: "kept" }]);
});

Deno.test("runNarrate handles zero entries (overall only)", async () => {
  const llm = asLLM(() => ({ overall: "Just the car, for now.", items: [] }));
  const res = await runNarrate(CAR, [], "enthusiast", llm);
  assertEquals(res.overall, "Just the car, for now.");
  assertEquals(res.items, []);
});

Deno.test("runNarrate rejects malformed model output", async () => {
  const llm = asLLM(() => ({ items: [{ key: "e1" }] })); // missing overall + narration
  await assertRejects(() => runNarrate(CAR, [ctx("e1")], "straight", llm));
});
