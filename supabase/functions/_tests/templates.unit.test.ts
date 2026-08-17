import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  selectTemplate,
  type TemplateLayout,
  type TemplateMeta,
} from "../_shared/shared/templates/index.ts";

const LAYOUT: TemplateLayout = {
  palette: { bg: "#000", surface: "#111", text: "#fff", muted: "#999", accent: "#e5484d" },
  fonts: { display: "X", body: "Y" },
  imageFrame: { shape: "framed", position: "top" },
  sections: { specTable: true, callouts: true, narration: true },
};

function t(over: Partial<TemplateMeta>): TemplateMeta {
  return {
    id: over.id ?? over.style ?? "id",
    name: over.name ?? over.style ?? "name",
    style: over.style ?? "style",
    text_capacity: over.text_capacity ?? "medium",
    callout_count: over.callout_count ?? 4,
    image_mode: over.image_mode ?? "hero",
    mood: over.mood ?? [],
    is_flexible_fallback: over.is_flexible_fallback ?? false,
    layout: over.layout ?? LAYOUT,
  };
}

// A library mirroring the seeded shape.
const LIBRARY: TemplateMeta[] = [
  t({ style: "magazine_cover", name: "Magazine Cover", text_capacity: "medium", callout_count: 4, image_mode: "hero", mood: ["editorial", "bold"] }),
  t({ style: "90s_jdm", name: "90s JDM", text_capacity: "medium", callout_count: 5, image_mode: "hero", mood: ["retro", "street", "bold"] }),
  t({ style: "modern_minimal", name: "Modern Minimal", text_capacity: "low", callout_count: 3, image_mode: "hero", mood: ["clean", "minimal"] }),
  t({ style: "infographic_deep_dive", name: "Infographic Deep Dive", text_capacity: "high", callout_count: 8, image_mode: "detail", mood: ["technical", "data"] }),
  t({ style: "flexible", name: "Flexible Feature", text_capacity: "high", callout_count: 6, image_mode: "detail", mood: ["versatile"], is_flexible_fallback: true }),
];

Deno.test("selectTemplate honours an explicit style preference", () => {
  const chosen = selectTemplate(LIBRARY, {
    textAmount: "medium",
    calloutCount: 3,
    image: "hero",
    stylePreference: "90s_jdm",
  });
  assertEquals(chosen?.style, "90s_jdm");
});

Deno.test("selectTemplate falls back when a hero style has no image to anchor", () => {
  // Only hero specialized templates fit the mood, but there is no image; the
  // detail-friendly fallback should win over a broken-looking hero layout.
  const heroOnly = LIBRARY.filter(
    (x) => x.image_mode === "hero" || x.is_flexible_fallback,
  );
  const chosen = selectTemplate(heroOnly, {
    textAmount: "medium",
    calloutCount: 2,
    image: "none",
  });
  assert(chosen?.is_flexible_fallback, `expected fallback, got ${chosen?.style}`);
});

Deno.test("selectTemplate picks the deep-dive for heavy technical content", () => {
  const chosen = selectTemplate(LIBRARY, {
    textAmount: "high",
    calloutCount: 7,
    image: "detail",
    moods: ["technical"],
  });
  assertEquals(chosen?.style, "infographic_deep_dive");
});

Deno.test("selectTemplate prefers a fitting specialized style over the fallback", () => {
  // Strong hero image, light text, few callouts: a hero style should beat the
  // generic fallback even without an explicit preference.
  const chosen = selectTemplate(LIBRARY, {
    textAmount: "low",
    calloutCount: 2,
    image: "hero",
  });
  assert(!chosen?.is_flexible_fallback, `did not expect fallback, got ${chosen?.style}`);
  assertEquals(chosen?.image_mode, "hero");
});

Deno.test("selectTemplate returns null for an empty library", () => {
  assertEquals(selectTemplate([], { textAmount: "low", calloutCount: 0, image: "none" }), null);
});
