import { z } from "npm:zod@^3.23.8";

/**
 * The parsing pipeline contract — the single source of truth shared by the
 * Supabase Edge Functions (Deno) and the Expo app.
 *
 * Two staged AI calls:
 *   Stage 1 (segment) splits the user's freeform paragraph into distinct items.
 *   Stage 2 (extract) pulls structured fields per item AND sorts factual `notes`
 *   from the "why" (`reasoning`).
 *
 * Key principles enforced here (see build spec §2):
 *   - Missing data => null, never fabricated. Optional fields are `.nullable()`,
 *     NOT `.optional()`, so the model must explicitly emit null (matches OpenAI
 *     Structured Outputs strict mode, where every key is required).
 *   - `raw_text` (the user's words) is never carried in these derived shapes as
 *     something to overwrite; it only ever flows IN.
 */

export const ENTRY_TYPES = ["mod", "service"] as const;
export const entryTypeSchema = z.enum(ENTRY_TYPES);
export type EntryType = z.infer<typeof entryTypeSchema>;

/* ------------------------------------------------------------------ */
/* Stage 1 — Segment                                                   */
/* ------------------------------------------------------------------ */

export const segmentRequestSchema = z.object({
  /** Present once a car row exists; optional so the engine is testable standalone. */
  car_id: z.string().uuid().optional(),
  raw_text: z.string().min(1),
});
export type SegmentRequest = z.infer<typeof segmentRequestSchema>;

/**
 * What the model returns for Stage 1: snippets only. The stable `tmp_id` is
 * assigned server-side (deterministic, index-based) rather than trusting the
 * model to invent unique ids — see `pipeline-segment`.
 */
export const segmentModelOutputSchema = z.object({
  items: z.array(z.object({ snippet: z.string().min(1) })),
});
export type SegmentModelOutput = z.infer<typeof segmentModelOutputSchema>;

export const segmentItemSchema = z.object({
  tmp_id: z.string().min(1),
  snippet: z.string().min(1),
});
export type SegmentItem = z.infer<typeof segmentItemSchema>;

export const segmentResultSchema = z.object({
  items: z.array(segmentItemSchema),
});
export type SegmentResult = z.infer<typeof segmentResultSchema>;

/* ------------------------------------------------------------------ */
/* Stage 2 — Extract                                                   */
/* ------------------------------------------------------------------ */

export const extractRequestSchema = z.object({
  car_id: z.string().uuid().optional(),
  items: z.array(segmentItemSchema).min(1),
});
export type ExtractRequest = z.infer<typeof extractRequestSchema>;

/**
 * One extracted entry. `type` and `title` are always present; everything else
 * is nullable and MUST be null when the user's text does not state it.
 *
 * `notes`  = factual details not already captured by a structured field
 *            (e.g. "15mm spacers", part numbers, torque specs).
 * `reasoning` = the *why*: purpose, goals, alternatives considered/rejected,
 *            the story. This is the product's core magic.
 */
export const extractedEntrySchema = z.object({
  tmp_id: z.string().min(1),
  type: entryTypeSchema,
  title: z.string().min(1),
  category: z.string().nullable(),
  brand: z.string().nullable(),
  cost: z.number().nullable(),
  date: z.string().nullable(),
  mileage: z.number().nullable(),
  notes: z.string().nullable(),
  reasoning: z.string().nullable(),
});
export type ExtractedEntry = z.infer<typeof extractedEntrySchema>;

export const extractResultSchema = z.object({
  entries: z.array(extractedEntrySchema),
});
export type ExtractResult = z.infer<typeof extractResultSchema>;

/* ------------------------------------------------------------------ */
/* Stage 4 — Narrate                                                   */
/* ------------------------------------------------------------------ */

/**
 * The tone dial (build spec §6 step 4). Narration is *derived* copy stored in
 * its own field, never overwriting the user's words, and always regenerable —
 * so the dial can be re-rolled freely.
 */
export const TONES = ["straight", "enthusiast", "full_documentary"] as const;
export const toneSchema = z.enum(TONES);
export type Tone = z.infer<typeof toneSchema>;

/**
 * The compact per-entry context handed to the narrator. `key` is a short,
 * index-based handle assigned server-side (e.g. "e1") — never the real UUID —
 * so the model has a cheap, unmanglable token to echo back. `notes`/`reasoning`
 * are the only content the narrator may dramatize; it may not invent beyond them.
 */
export interface NarrateEntryContext {
  key: string;
  type: EntryType;
  title: string;
  category: string | null;
  brand: string | null;
  notes: string | null;
  reasoning: string | null;
}

/** Minimal car identity for the overall narration's framing. */
export interface NarrateCarContext {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  nickname: string | null;
}

/** One narrated line, mapped back to its entry by `key`. */
export const narratedItemSchema = z.object({
  key: z.string().min(1),
  narration: z.string(),
});
export type NarratedItem = z.infer<typeof narratedItemSchema>;

/**
 * What the narrator returns: one `overall` documentary line/paragraph for the
 * whole build, plus one narration per entry (echoing its `key`).
 */
export const narrateModelOutputSchema = z.object({
  overall: z.string(),
  items: z.array(narratedItemSchema),
});
export type NarrateModelOutput = z.infer<typeof narrateModelOutputSchema>;
