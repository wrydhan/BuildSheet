import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { carSubtitle, carTitle, type Car } from "@/lib/cars";
import { FACET_LABELS, type Facet } from "@/lib/facets";
import type { PosterWithChildren } from "@/lib/posters";
import type { TemplateLayout } from "@/lib/templates";
import { FONTS } from "@/lib/design";

/** Neutral fallback if a poster somehow has no template attached. */
const DEFAULT_LAYOUT: TemplateLayout = {
  palette: { bg: "#e7a15a", surface: "#e7a15a", text: "#0e0e10", muted: "#0e0e10", accent: "#bf463b" },
  fonts: { display: "System", body: "System" },
  imageFrame: { shape: "framed", position: "top" },
  sections: { specTable: true, callouts: true, narration: true },
};

type Props = {
  poster: PosterWithChildren;
  car: Car;
  overallNarration?: string | null;
};

/**
 * Renders a poster as an acid-brutalist / techwear panel: a solid colored card
 * with heavy grotesque type, thin ink-outlined technical frames, monospace
 * labels, and a barcode strip. The template's palette drives the panel color;
 * everything else is typeset from the user's data. Degrades gracefully with no
 * photo and no callouts.
 */
export function PosterView({ poster, car, overallNarration }: Props) {
  const layout = poster.template?.layout ?? DEFAULT_LAYOUT;
  const { bg, text: ink, accent } = layout.palette;
  const facetLabel = FACET_LABELS[poster.facet as Facet] ?? poster.facet;
  const code = String(poster.display_order + 1).padStart(2, "0");
  const title = carTitle(car).toUpperCase();
  const subtitle = carSubtitle(car);

  return (
    <View style={[styles.poster, { backgroundColor: bg, borderColor: ink }]}>
      {/* Top strip: index/facet code + directional mark */}
      <View style={styles.topRow}>
        <Text style={[styles.code, { color: ink }]}>
          {code} / {facetLabel.toUpperCase()}
        </Text>
        <View style={styles.markRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.arrow, { color: ink }]}>↗</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: ink }]} numberOfLines={3}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: ink }]}>{subtitle.toUpperCase()}</Text>
      ) : null}

      {layout.imageFrame.position !== "background" ? (
        poster.image_url ? (
          <Image
            source={{ uri: poster.image_url }}
            style={[styles.image, { borderColor: ink }]}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { borderColor: ink }]}>
            <Text style={[styles.placeholderText, { color: ink }]}>NO SIGNAL / IMG</Text>
          </View>
        )
      ) : null}

      {/* Technical stat frame */}
      <View style={[styles.statFrame, { borderColor: ink }]}>
        <Stat label="YEAR" value={car.year != null ? String(car.year) : "—"} ink={ink} border />
        <Stat label="MILES" value={car.mileage != null ? car.mileage.toLocaleString() : "—"} ink={ink} border />
        <Stat label="ITEMS" value={String(poster.callouts.length).padStart(2, "0")} ink={ink} />
      </View>

      {layout.sections.narration && overallNarration ? (
        <Text style={[styles.narration, { color: ink }]}>{overallNarration}</Text>
      ) : null}

      {poster.callouts.length > 0 ? (
        <View style={styles.callouts}>
          {poster.callouts.map((c) => (
            <View key={c.id} style={[styles.callout, { borderColor: ink }]}>
              <View style={[styles.slotBox, { borderColor: ink }]}>
                <Text style={[styles.slotNum, { color: ink }]}>{c.slot ?? "•"}</Text>
              </View>
              <View style={styles.calloutText}>
                <Text style={[styles.calloutLabel, { color: ink }]} numberOfLines={1}>
                  {(c.label ?? "").toUpperCase()}
                </Text>
                {c.narration ? (
                  <Text style={[styles.calloutBody, { color: ink }]} numberOfLines={3}>
                    {c.narration}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: ink }]}>NO ITEMS LOGGED</Text>
      )}

      {/* Footer: barcode + verification code + registration */}
      <View style={styles.footer}>
        <Barcode seed={car.share_slug} ink={ink} />
        <Text style={[styles.verify, { color: ink }]}>
          #{car.share_slug.slice(0, 4).toUpperCase()} · BUILDSHEET®
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value, ink, border }: { label: string; value: string; ink: string; border?: boolean }) {
  return (
    <View style={[styles.stat, border ? { borderRightWidth: 1, borderRightColor: ink } : null]}>
      <Text style={[styles.statLabel, { color: ink }]}>{label}</Text>
      <Text style={[styles.statValue, { color: ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** A faux barcode whose bar widths are derived from the share slug (stable). */
function Barcode({ seed, ink }: { seed: string; ink: string }) {
  const chars = (seed + seed).slice(0, 30);
  return (
    <View style={styles.barcode}>
      {chars.split("").map((ch, i) => {
        const w = 1 + (ch.charCodeAt(0) % 3);
        return <View key={i} style={{ width: w, height: 22, backgroundColor: ink, marginRight: 1.5 }} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5 },
  markRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  arrow: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 26 },
  title: { fontFamily: FONTS.display, fontSize: 40, lineHeight: 40, letterSpacing: -1, marginTop: 2 },
  subtitle: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, marginTop: -2 },
  image: { width: "100%", aspectRatio: 16 / 10, borderRadius: 4, borderWidth: 1.5, marginTop: 2 },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 4,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  placeholderText: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, opacity: 0.55 },
  statFrame: { flexDirection: "row", borderWidth: 1, borderRadius: 4 },
  stat: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, gap: 2 },
  statLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, opacity: 0.7 },
  statValue: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: -0.5 },
  narration: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19 },
  callouts: { gap: 6 },
  callout: { flexDirection: "row", borderWidth: 1, borderRadius: 4, overflow: "hidden", minHeight: 46 },
  slotBox: { width: 40, alignItems: "center", justifyContent: "center", borderRightWidth: 1 },
  slotNum: { fontFamily: FONTS.display, fontSize: 18 },
  calloutText: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, gap: 2, justifyContent: "center" },
  calloutLabel: { fontFamily: FONTS.heavy, fontSize: 14, letterSpacing: 0.3 },
  calloutBody: { fontFamily: FONTS.mono, fontSize: 11, lineHeight: 15, opacity: 0.75 },
  empty: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, opacity: 0.6 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 2,
  },
  barcode: { flexDirection: "row", alignItems: "flex-end" },
  verify: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
});
