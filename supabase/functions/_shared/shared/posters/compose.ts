import type { SelectionCriteria, TextCapacity } from "../templates/types.ts";
import {
  entryMatchesFacet,
  FACET_IMAGE_MODE,
  FACET_MOODS,
  type Facet,
} from "./facets.ts";

/**
 * Poster composition (build spec §6 steps 5 & 7): turn a facet's entries into
 * the callouts a template will typeset, and derive the criteria used to pick a
 * template. Pure and deterministic — the Edge Function persists the result.
 *
 * Text on a poster is ALWAYS the user's structured data, typeset — never
 * AI-generated pixels (§7). These helpers only choose and order that data.
 */

export interface ComposeEntry {
  id: string;
  type: "mod" | "service";
  title: string;
  category: string | null;
  notes: string | null;
  reasoning: string | null;
  narration: string | null;
}

/** A callout to persist (mirrors public.callouts minus poster_id/id). */
export interface ComposedCallout {
  entry_id: string | null;
  label: string;
  narration: string | null;
  slot: string;
  kind: "entry" | "info";
}

/** The best line to show for an entry: narration if present, else its own words. */
function calloutLine(entry: ComposeEntry): string | null {
  return entry.narration ?? entry.reasoning ?? entry.notes ?? null;
}

/** Score an entry's richness so the fullest stories get scarce callout slots. */
function richness(entry: ComposeEntry): number {
  return (
    (entry.narration?.length ?? 0) +
    (entry.reasoning?.length ?? 0) * 0.5 +
    (entry.notes?.length ?? 0) * 0.25
  );
}

/**
 * Pick and order the entries that become callouts for a facet, capped at the
 * template's slot count. When there are more entries than slots, the richest
 * (most story) win the slots; ties keep input order for stability.
 */
export function selectFacetEntries(
  entries: ComposeEntry[],
  facet: Facet,
  slots: number,
): ComposeEntry[] {
  const matching = entries.filter((e) => entryMatchesFacet(e, facet));
  if (matching.length <= slots) return matching;

  return matching
    .map((entry, index) => ({ entry, index, r: richness(entry) }))
    .sort((a, b) => (b.r !== a.r ? b.r - a.r : a.index - b.index))
    .slice(0, slots)
    .sort((a, b) => a.index - b.index) // restore input order for display
    .map((x) => x.entry);
}

/** Build the callouts for the chosen entries. */
export function composeCallouts(entries: ComposeEntry[]): ComposedCallout[] {
  return entries.map((entry, i) => ({
    entry_id: entry.id,
    label: entry.title,
    narration: calloutLine(entry),
    slot: String(i + 1),
    kind: "entry" as const,
  }));
}

/** Estimate how much body copy a facet's content needs a template to hold. */
function textAmountFor(entries: ComposeEntry[]): TextCapacity {
  const total = entries.reduce(
    (sum, e) => sum + (calloutLine(e)?.length ?? 0),
    0,
  );
  if (entries.length <= 2 && total < 200) return "low";
  if (entries.length <= 5 && total < 700) return "medium";
  return "high";
}

/**
 * Derive template-selection criteria from a facet's content and whether an image
 * is available. `image` combines availability with the facet's preferred mode:
 * an overall/exterior shot is a hero, a subsystem shot is a detail crop.
 */
export function criteriaForFacet(
  facet: Facet,
  entries: ComposeEntry[],
  hasImage: boolean,
  stylePreference?: string | null,
): SelectionCriteria {
  return {
    textAmount: textAmountFor(entries),
    calloutCount: entries.length,
    image: hasImage ? FACET_IMAGE_MODE[facet] : "none",
    stylePreference: stylePreference ?? null,
    moods: FACET_MOODS[facet],
  };
}
