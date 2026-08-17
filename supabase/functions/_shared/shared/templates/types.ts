/**
 * Template library contract (build spec §5 "templates" + §6 step 5).
 *
 * A poster is layers: the AI/photo supplies only the image; everything else is
 * typeset programmatically. A *template* is the styled layout those layers fill.
 * The fields here are the "selection metadata" the app matches content against
 * to choose a template, plus the `layout` design tokens a renderer consumes.
 */

export const TEXT_CAPACITIES = ["low", "medium", "high"] as const;
export type TextCapacity = (typeof TEXT_CAPACITIES)[number];

export const IMAGE_MODES = ["hero", "detail"] as const;
/** `hero` needs a strong full/large image; `detail` suits a cropped part. */
export type ImageMode = (typeof IMAGE_MODES)[number];

/**
 * Design tokens a poster renderer reads to compose a template's HTML/CSS. Kept
 * declarative (not markup) so the same composer can render every style and new
 * styles are data, not code. Stored in `templates.layout` (jsonb).
 */
export interface TemplateLayout {
  palette: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
  };
  fonts: { display: string; body: string };
  imageFrame: {
    shape: "full-bleed" | "framed" | "inset";
    position: "top" | "left" | "right" | "background";
  };
  /** Which composed sections this template shows. */
  sections: { specTable: boolean; callouts: boolean; narration: boolean };
}

/** A template row's fields relevant to selection + rendering. */
export interface TemplateMeta {
  id: string;
  name: string;
  style: string;
  text_capacity: TextCapacity;
  callout_count: number;
  image_mode: ImageMode;
  mood: string[];
  is_flexible_fallback: boolean;
  layout: TemplateLayout;
}

/** The shape of the content a poster must hold, used to pick a template. */
export interface SelectionCriteria {
  /** How much body copy the poster needs to hold. */
  textAmount: TextCapacity;
  /** How many callouts we want to place. */
  calloutCount: number;
  /** Whether an image is available, and what kind. */
  image: "hero" | "detail" | "none";
  /** Optional user style preference (matches TemplateMeta.style). */
  stylePreference?: string | null;
  /** Optional desired mood tags. */
  moods?: string[];
}
