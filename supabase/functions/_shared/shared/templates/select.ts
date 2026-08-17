import type {
  SelectionCriteria,
  TemplateMeta,
  TextCapacity,
} from "./types.ts";

/**
 * Template selection (build spec §6 step 5): match the content's shape (text
 * amount, callout count, image availability) and the user's style preference
 * against each template's metadata, and pick the best.
 *
 * Design: EVERY template is scored, including the flexible fallback. The
 * fallback is authored to be robust (high capacity, many callout slots, an
 * image mode that tolerates a cropped part or none), so it scores neutrally and
 * therefore *wins only when no specialized template fits well* — which is
 * exactly "fall back to the flexible template if nothing fits", with no magic
 * threshold. A matching style preference is a strong boost, so an explicit user
 * choice reliably beats the fallback.
 */

const CAPACITY_RANK: Record<TextCapacity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function scoreTemplate(
  template: TemplateMeta,
  criteria: SelectionCriteria,
): number {
  let score = 0;

  // Text capacity: fitting is good; being far too small is bad; being much
  // larger than needed is a mild waste.
  const need = CAPACITY_RANK[criteria.textAmount];
  const cap = CAPACITY_RANK[template.text_capacity];
  score += cap >= need ? 3 - (cap - need) * 0.5 : -2 * (need - cap);

  // Callout slots: enough is good; too few loses a slot's worth each.
  score += template.callout_count >= criteria.calloutCount
    ? 2
    : -1.5 * (criteria.calloutCount - template.callout_count);

  // Image fit.
  if (template.image_mode === "hero") {
    if (criteria.image === "hero") score += 2;
    else if (criteria.image === "none") score -= 2; // a hero layout with no image reads as broken
    // a hero layout given only a detail crop: neutral
  } else {
    // detail templates tolerate anything, degrade gracefully with no image.
    if (criteria.image === "detail") score += 2;
    else if (criteria.image === "hero") score += 1;
    else score -= 0.5;
  }

  // Explicit style preference is a strong signal.
  if (criteria.stylePreference && template.style === criteria.stylePreference) {
    score += 4;
  }

  // Mood overlap: a gentle nudge.
  if (criteria.moods?.length) {
    const wanted = new Set(criteria.moods.map((m) => m.toLowerCase()));
    const overlap = template.mood.filter((m) => wanted.has(m.toLowerCase())).length;
    score += overlap * 0.5;
  }

  return score;
}

/**
 * Choose the best template for the given content. Returns null only if the
 * template list is empty. On a score tie, a specialized template is preferred
 * over the fallback (show off a designed style when it fits just as well), then
 * by name for determinism.
 */
export function selectTemplate(
  templates: TemplateMeta[],
  criteria: SelectionCriteria,
): TemplateMeta | null {
  if (templates.length === 0) return null;

  const ranked = templates
    .map((template) => ({ template, score: scoreTemplate(template, criteria) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break: prefer non-fallback, then name.
      if (a.template.is_flexible_fallback !== b.template.is_flexible_fallback) {
        return a.template.is_flexible_fallback ? 1 : -1;
      }
      return a.template.name.localeCompare(b.template.name);
    });

  const best = ranked[0].template;

  // Safety net: if the winner somehow scored negative (nothing fit at all),
  // prefer an explicit flexible fallback when one exists.
  if (ranked[0].score < 0) {
    const fallback = templates.find((t) => t.is_flexible_fallback);
    if (fallback) return fallback;
  }
  return best;
}
