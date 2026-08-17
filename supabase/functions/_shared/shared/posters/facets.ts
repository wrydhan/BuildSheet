/**
 * Facets (build spec §5 posters.facet + §6 "facet selection is user-driven").
 *
 * A facet is one angle on the car a poster can cover. Facet selection is the
 * USER's choice; these helpers only *suggest* facets from what they wrote and
 * decide which entries belong to a facet. Suggestion, never automation.
 */

export const FACETS = [
  "overall",
  "engine",
  "wheels",
  "suspension",
  "interior",
  "exterior",
  "maintenance",
] as const;
export type Facet = (typeof FACETS)[number];

export const FACET_LABELS: Record<Facet, string> = {
  overall: "Overall",
  engine: "Engine",
  wheels: "Wheels & Tires",
  suspension: "Suspension & Brakes",
  interior: "Interior",
  exterior: "Exterior",
  maintenance: "Maintenance",
};

/** Preferred image mode per facet — the whole car reads as a hero shot; a
 * subsystem reads as a detail crop. Feeds template selection. */
export const FACET_IMAGE_MODE: Record<Facet, "hero" | "detail"> = {
  overall: "hero",
  engine: "detail",
  wheels: "detail",
  suspension: "detail",
  interior: "detail",
  exterior: "hero",
  maintenance: "detail",
};

export const FACET_MOODS: Record<Facet, string[]> = {
  overall: ["editorial", "bold", "feature"],
  engine: ["technical", "data"],
  wheels: ["street", "bold"],
  suspension: ["technical", "data"],
  interior: ["clean", "calm"],
  exterior: ["editorial", "bold"],
  maintenance: ["clean", "data"],
};

/** Minimal entry shape the facet/compose helpers need. */
export interface FacetEntry {
  type: "mod" | "service";
  category: string | null;
}

/**
 * Map a free-form extracted category onto a subsystem facet. Categories come
 * from the extract prompt ("engine", "suspension", "wheels", …) but are
 * free text, so we normalize loosely and fold near-neighbours together
 * (drivetrain→engine, brakes→suspension, tires→wheels, body/paint→exterior).
 */
function categoryFacet(category: string | null): Facet | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (/(engine|turbo|intake|exhaust|intercooler|drivetrain|clutch|tune|fuel)/.test(c)) {
    return "engine";
  }
  if (/(suspension|coilover|spring|sway|damper|brake|caliper|rotor)/.test(c)) {
    return "suspension";
  }
  if (/(wheel|tire|tyre|rim)/.test(c)) return "wheels";
  if (/(interior|seat|shifter|dash|cabin|audio)/.test(c)) return "interior";
  if (/(exterior|body|paint|aero|wrap|spoiler|bumper|light)/.test(c)) return "exterior";
  if (/(maintenance|service|fluid|oil|filter|belt)/.test(c)) return "maintenance";
  return null;
}

/** Does an entry belong on a given facet's poster? */
export function entryMatchesFacet(entry: FacetEntry, facet: Facet): boolean {
  if (facet === "overall") return true;
  if (facet === "maintenance") {
    return entry.type === "service" || categoryFacet(entry.category) === "maintenance";
  }
  return categoryFacet(entry.category) === facet;
}

export interface FacetSuggestion {
  facet: Facet;
  label: string;
  count: number;
}

/**
 * Suggest facets the user might want posters for, based on their entries. Every
 * facet with at least one matching entry is suggested; `overall` is always
 * offered when there is any content. Sorted by strength (count), then a stable
 * facet order. The user still confirms — this only ranks the options.
 */
export function suggestFacets(entries: FacetEntry[]): FacetSuggestion[] {
  if (entries.length === 0) return [];

  const suggestions: FacetSuggestion[] = [];
  for (const facet of FACETS) {
    if (facet === "overall") continue;
    const count = entries.filter((e) => entryMatchesFacet(e, facet)).length;
    if (count > 0) {
      suggestions.push({ facet, label: FACET_LABELS[facet], count });
    }
  }

  suggestions.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return FACETS.indexOf(a.facet) - FACETS.indexOf(b.facet);
  });

  // Overall leads when there is any content.
  return [
    { facet: "overall" as Facet, label: FACET_LABELS.overall, count: entries.length },
    ...suggestions,
  ];
}
