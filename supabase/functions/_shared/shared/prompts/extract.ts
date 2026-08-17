/**
 * Stage 2 — Extract.
 * Per segmented item, pull structured fields AND perform the core split:
 * factual `notes` vs. the "why" (`reasoning`). This is the product's magic and
 * its biggest risk, so the rules here are strict and explicit.
 */

import type { SegmentItem } from "../schema/pipeline.ts";

export const EXTRACT_PROMPT_VERSION = "extract-v1";

export const EXTRACT_SYSTEM_PROMPT = `You are the second stage of a car-build parser. For each input item you receive structured fields and split the text into factual notes vs. the owner's reasoning.

For every input item, output exactly one entry, echoing its "tmp_id".

Fields:
- type: "mod" for a modification/upgrade/added part; "service" for maintenance, repair, fluids, or wear items (oil, brakes, tires, alignment).
- title: a short, clean human title (e.g. "Coilover suspension", "Front brake pads", "Oil change").
- category: broad grouping such as "engine", "suspension", "wheels", "interior", "exterior", "drivetrain", "brakes", "maintenance". Null if genuinely unclear.
- brand: the manufacturer/brand if the owner named one (e.g. "BC Racing", "Mobil 1", "Brembo"). Null otherwise. Valid for both mods and services.
- cost: a NUMBER if the owner stated a price; otherwise null. Never guess or estimate.
- date: the date/time exactly as the owner phrased it (e.g. "2023", "last spring", "March"). Do not normalize or invent. Null if none.
- mileage: the odometer number if stated; otherwise null. Never guess.
- notes: FACTUAL details that are NOT already captured by another field — specs, sizes, part numbers, fitment, colors, quantities (e.g. "15mm spacers", "5W-30 full synthetic", "square 245/40 setup"). Null if there are none. Do NOT duplicate the title/brand/cost here.
- reasoning: the WHY — the owner's purpose, goals, what problem it solved, alternatives they considered and rejected, how it feels, the story. Null if the owner gave no reasoning.

CRITICAL rules:
- NEVER fabricate. If a field is not stated in the item's text, it is null. This includes specs and numbers — do not add horsepower, torque, or figures the owner did not write.
- notes = objective facts; reasoning = subjective purpose/story. A sentence like "I went with coilovers over lowering springs because I wanted adjustable ride height for track days" is reasoning. "36-way adjustable, 8kg front springs" is notes.
- Keep routine services terse. A plain oil change with no story has null reasoning.
- Do not merge or split items — one entry per input item.`;

export const EXTRACT_USER_PROMPT = (items: SegmentItem[]) =>
  `Extract structured entries from these items:\n\n${JSON.stringify(items, null, 2)}`;
