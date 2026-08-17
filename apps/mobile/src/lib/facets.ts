import type { Entry } from "@/lib/entries";

/**
 * Client mirror of @carstory/shared's facet logic, kept in sync by hand (the
 * mobile bundle stays free of the server's Deno/zod modules). The server is the
 * source of truth for what actually lands on a poster; this is only for showing
 * suggestions and counts in the facet picker.
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

function categoryFacet(category: string | null): Facet | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (/(engine|turbo|intake|exhaust|intercooler|drivetrain|clutch|tune|fuel)/.test(c)) return "engine";
  if (/(suspension|coilover|spring|sway|damper|brake|caliper|rotor)/.test(c)) return "suspension";
  if (/(wheel|tire|tyre|rim)/.test(c)) return "wheels";
  if (/(interior|seat|shifter|dash|cabin|audio)/.test(c)) return "interior";
  if (/(exterior|body|paint|aero|wrap|spoiler|bumper|light)/.test(c)) return "exterior";
  if (/(maintenance|service|fluid|oil|filter|belt)/.test(c)) return "maintenance";
  return null;
}

export function entryMatchesFacet(entry: Pick<Entry, "type" | "category">, facet: Facet): boolean {
  if (facet === "overall") return true;
  if (facet === "maintenance") {
    return entry.type === "service" || categoryFacet(entry.category) === "maintenance";
  }
  return categoryFacet(entry.category) === facet;
}

/** How many of the car's entries would land on each facet's poster. */
export function facetCounts(entries: Entry[]): Record<Facet, number> {
  const counts = Object.fromEntries(FACETS.map((f) => [f, 0])) as Record<Facet, number>;
  for (const facet of FACETS) {
    counts[facet] = entries.filter((e) => entryMatchesFacet(e, facet)).length;
  }
  return counts;
}
