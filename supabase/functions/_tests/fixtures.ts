/**
 * Real, messy fixture blobs covering the graceful-degradation matrix:
 * bare vs deep builds, sparse/ambiguous text, costs/dates/mileage present vs
 * absent, mod-heavy vs service-heavy, and factual vs "why"-heavy entries.
 *
 * Expectations are intentionally structural (counts, null-ness, presence of
 * reasoning) rather than exact strings — LLM wording varies, but these
 * invariants are what the product actually depends on. The null-ness
 * expectations double as the anti-fabrication guardrail: if the model invents a
 * cost/date/mileage the user never wrote, the corresponding test fails.
 */

export interface Fixture {
  name: string;
  raw_text: string;
  /** Inclusive bounds on how many items segmentation should produce. */
  minItems: number;
  maxItems: number;
  /** At least one extracted entry should carry non-null reasoning. */
  expectReasoning: boolean;
  /** No entry may have a non-null cost (nothing priced in the text). */
  expectAllCostsNull?: boolean;
  expectAllDatesNull?: boolean;
  expectAllMileageNull?: boolean;
  /** These entry types should all appear among the results. */
  expectTypes?: Array<"mod" | "service">;
}

export const FIXTURES: Fixture[] = [
  {
    name: "bare-single-mod",
    raw_text: "Threw on a set of Enkei RPF1 wheels.",
    minItems: 1,
    maxItems: 1,
    expectReasoning: false,
    expectAllCostsNull: true,
    expectAllDatesNull: true,
    expectAllMileageNull: true,
    expectTypes: ["mod"],
  },
  {
    name: "two-mods-one-sentence",
    raw_text: "New coilovers and a bigger front sway bar.",
    minItems: 2,
    maxItems: 2,
    expectReasoning: false,
    expectAllCostsNull: true,
    expectTypes: ["mod"],
  },
  {
    name: "bare-single-service",
    raw_text: "Changed the oil.",
    minItems: 1,
    maxItems: 1,
    expectReasoning: false,
    expectAllCostsNull: true,
    expectAllDatesNull: true,
    expectAllMileageNull: true,
    expectTypes: ["service"],
  },
  {
    name: "cost-date-mileage-present",
    raw_text:
      "Put in BC Racing coilovers for $1200 last spring at around 45k miles.",
    minItems: 1,
    maxItems: 1,
    expectReasoning: false,
    expectTypes: ["mod"],
  },
  {
    name: "service-heavy",
    raw_text:
      "Regular maintenance this year: oil change with Mobil 1 5W-30, new Brembo front pads, rotated the tires, and flushed the brake fluid.",
    minItems: 3,
    maxItems: 5,
    expectReasoning: false,
    expectTypes: ["service"],
  },
  {
    name: "mod-with-why",
    raw_text:
      "I swapped to coilovers over lowering springs because I wanted adjustable ride height for the occasional track weekend.",
    minItems: 1,
    maxItems: 1,
    expectReasoning: true,
    expectAllCostsNull: true,
    expectTypes: ["mod"],
  },
  {
    name: "reasoning-and-facts-mixed",
    raw_text:
      "Installed a Cobb intake — went with Cobb over the AEM because of the tune integration. It's a dry filter, 3.5 inch inlet.",
    minItems: 1,
    maxItems: 1,
    expectReasoning: true,
    expectAllCostsNull: true,
    expectTypes: ["mod"],
  },
  {
    name: "specs-heavy-notes",
    raw_text:
      "Running 245/40R18 tires with 15mm spacers up front, and I dropped it about 1.5 inches.",
    minItems: 2,
    maxItems: 3,
    expectReasoning: false,
    expectAllCostsNull: true,
    expectTypes: ["mod"],
  },
  {
    name: "date-and-mileage-service",
    raw_text: "Timing belt and water pump done at 90k miles back in 2021.",
    minItems: 1,
    maxItems: 2,
    expectReasoning: false,
    expectAllCostsNull: true,
    expectTypes: ["service"],
  },
  {
    name: "sparse-ambiguous",
    raw_text: "Did some stuff to make it faster and it sounds a lot meaner now.",
    minItems: 0,
    maxItems: 3,
    expectReasoning: false,
    expectAllCostsNull: true,
    expectAllDatesNull: true,
    expectAllMileageNull: true,
  },
  {
    name: "non-build-chatter",
    raw_text: "Honestly I love this car so much, best decision I ever made.",
    minItems: 0,
    maxItems: 1,
    expectReasoning: false,
    expectAllCostsNull: true,
  },
  {
    name: "deep-build",
    raw_text:
      "Where to start. It's got a Cobb Stage 2 tune which is why I added the Cobb downpipe and a bigger top-mount intercooler to keep temps down on long pulls. Suspension is BC Racing coilovers set pretty aggressive, plus Whiteline endlinks. Wheels are 18x9.5 Enkei RPF1 wrapped in Michelin PS4S, 255/35. I upgraded to StopTech 4-piston front brakes because the stock ones faded hard at track days. Interior I added Recaro seats and a short shifter. For maintenance I do oil every 5k with Motul, and I just did the timing components and a new clutch at 78k because it was slipping under boost.",
    minItems: 8,
    maxItems: 14,
    expectReasoning: true,
    expectTypes: ["mod", "service"],
  },
];
