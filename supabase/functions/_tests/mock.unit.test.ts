import { assert, assertEquals } from "jsr:@std/assert@^1";
import { callMockStructured } from "../_shared/mock.ts";
import { runSegment } from "../pipeline-segment/index.ts";
import { runExtract } from "../pipeline-extract/index.ts";
import { runNarrate } from "../narrate/index.ts";
import type { NarrateEntryContext } from "../_shared/shared/schema/index.ts";

// Drives the real run* functions with the mock provider, proving the mock
// returns Zod-valid output for every stage (the run* functions parse it).

Deno.test("mock: segment → extract yields valid entries from real text", async () => {
  const raw =
    "Swapped to BC coilovers because I wanted adjustable ride height for track days. " +
    "Also did an oil change and threw on Enkei RPF1 wheels.";

  const seg = await runSegment(raw, callMockStructured);
  assert(seg.items.length >= 2, "should segment into multiple items");

  const ext = await runExtract(seg.items, callMockStructured);
  assertEquals(ext.entries.length, seg.items.length);

  // The oil change should read as a service; the coilovers as a mod with a why.
  const service = ext.entries.find((e) => e.type === "service");
  const coilovers = ext.entries.find((e) => /coilover/i.test(e.title));
  assert(service, "oil change should be a service");
  assert(coilovers?.reasoning, "coilovers entry should carry reasoning");
});

Deno.test("mock: narrate echoes every key with a line", async () => {
  const entries: NarrateEntryContext[] = [
    { key: "e1", type: "mod", title: "Coilovers", category: "suspension", brand: null, notes: null, reasoning: "wanted adjustable ride height" },
    { key: "e2", type: "service", title: "Oil change", category: "maintenance", brand: null, notes: null, reasoning: null },
  ];
  const res = await runNarrate(
    { year: 1999, make: "Nissan", model: "Silvia", trim: null, nickname: null },
    entries,
    "enthusiast",
    callMockStructured,
  );
  assert(res.overall.length > 0);
  assertEquals(res.items.map((i) => i.key), ["e1", "e2"]);
  assert(res.items.every((i) => i.narration.length > 0));
});

Deno.test("mock: empty build segments to nothing", async () => {
  const seg = await runSegment("   ", callMockStructured);
  assertEquals(seg.items, []);
});
