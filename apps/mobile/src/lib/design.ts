/**
 * Buildsheet design tokens — dark, editorial, motorsport-adjacent.
 * Near-black canvas, heavy condensed display type, monospace labels for specs.
 * Magazine aesthetic, not terminal. Fonts: Archivo (display), Space Mono (labels).
 */
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from "@expo-google-fonts/archivo";
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from "@expo-google-fonts/space-mono";

export const COLORS = {
  /** App canvas — near-black. */
  bg: "#0a0a0b",
  bgElevated: "#121214",
  bgInput: "#151518",
  /** Near-black used for text/frames on colored poster panels. */
  ink: "#0e0e10",
  /** Off-white primary text on the dark UI. */
  paper: "#f5f5f6",
  paperDim: "#e0e0e2",
  line: "#222226",
  muted: "#8c8c92",
  dim: "#5c5c62",

  /** The signature red — sparingly used for accents and CTAs. */
  red: "#d93b34",
  redDim: "#3a0e12",
  redHover: "#e04a43",

  /** Poster panel colors (used by the poster renderer, not app chrome). */
  orange: "#e7a15a",
  sage: "#8fa27c",
  gray: "#b7b2a8",
  brick: "#bf463b",

  /** Primary accent used across app chrome. */
  accent: "#d93b34",
} as const;

export const FONTS = {
  /** Heavy display — big titles, uppercased. */
  display: "Archivo_900Black",
  heavy: "Archivo_800ExtraBold",
  bold: "Archivo_700Bold",
  medium: "Archivo_500Medium",
  body: "Archivo_400Regular",
  /** Technical labels, codes, readouts. */
  mono: "SpaceMono_400Regular",
  monoBold: "SpaceMono_700Bold",
} as const;

/** The font families to register via useFonts() in the root layout. */
export const FONT_ASSETS = {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
};
