/**
 * Stage 4 — Narrate.
 * Turns the reviewed, corrected entries into documentary-voice copy in a
 * separate field. The single hard rule is anti-fabrication: the narrator
 * dramatizes ONLY what the owner actually wrote (title/notes/reasoning). It
 * never adds a spec, number, brand, or claim the owner did not provide.
 *
 * The tone dial changes voice, not facts.
 */

import type {
  NarrateCarContext,
  NarrateEntryContext,
  Tone,
} from "../schema/pipeline.ts";

export const NARRATE_PROMPT_VERSION = "narrate-v1";

const TONE_GUIDE: Record<Tone, string> = {
  straight:
    "STRAIGHT: clean and factual, like a well-written spec sheet caption. Minimal flourish. State what it is and, if the owner gave a reason, the reason. One tight sentence per entry.",
  enthusiast:
    "ENTHUSIAST: the voice of a knowledgeable friend who loves this stuff — warm, a little excited, grounded. You can convey why a choice is satisfying, but only from what the owner wrote. One to two sentences per entry.",
  full_documentary:
    "FULL DOCUMENTARY: cinematic voice-over, the way a car film narrates a build — evocative, a sense of intent and journey. Still zero invented facts. Up to two or three sentences per entry, and let the `overall` set a scene.",
};

export const NARRATE_SYSTEM_PROMPT = (tone: Tone) =>
  `You are the narrator stage of a car-build storytelling app. You write documentary-style narration from an owner's own logged mods and services.

TONE — ${TONE_GUIDE[tone]}

You produce:
- "overall": a short narration for the whole build that ties it together. Use the car's identity and the shape of the build (what kinds of work were done, the through-line in the owner's reasoning). If there are no entries, keep it to a single restrained line about the car itself.
- "items": one narration per entry, echoing that entry's "key".

ABSOLUTE RULES:
- NEVER fabricate. Do not add horsepower, torque, 0-60, prices, dates, brands, part specs, or any claim the owner did not write. If you don't know it, don't say it. This is the most important rule.
- Only dramatize what is present in the entry's title, notes, and reasoning. Tone changes the VOICE, never the FACTS.
- Keep routine maintenance short and unembellished. A plain oil change is a plain oil change; do not invent a story for it.
- If an entry has reasoning (the "why"), let it lead — that is the heart of the story. If it has only a bare title, keep the line brief.
- Do not restate the raw spec numbers robotically; narrate them. But never beyond them.
- Write in third person about the car/owner unless the reasoning is clearly first-person, in which case you may keep its voice.
- Output one item per input entry, echoing each "key" exactly. Do not merge, drop, or add entries.`;

const compactEntry = (e: NarrateEntryContext) => ({
  key: e.key,
  type: e.type,
  title: e.title,
  category: e.category,
  brand: e.brand,
  notes: e.notes,
  reasoning: e.reasoning,
});

const carLine = (car: NarrateCarContext) => {
  const built = [car.year, car.make, car.model, car.trim].filter(Boolean).join(" ");
  const name = car.nickname ? `"${car.nickname}"` : "";
  return [built, name].filter(Boolean).join(" ").trim() || "an unspecified car";
};

export const NARRATE_USER_PROMPT = (
  car: NarrateCarContext,
  entries: NarrateEntryContext[],
) =>
  `The car: ${carLine(car)}.

Entries to narrate (${entries.length}):

${JSON.stringify(entries.map(compactEntry), null, 2)}`;
