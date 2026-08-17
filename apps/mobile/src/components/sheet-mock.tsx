import { Image, type ImageSource } from "expo-image";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { COLORS, FONTS } from "@/lib/design";

export type SheetSpec = {
  label: string;
  value: string;
};

export type SheetMod = {
  id: string;
  date: string;
  mileage?: string;
  title: string;
  description?: string;
  imageSource?: ImageSource;
};

export type SheetMockProps = {
  carName: string;
  carSubtitle?: string;
  tagline?: string;
  specs?: SheetSpec[];
  mods?: SheetMod[];
  narrative?: string;
  heroImage?: ImageSource;
  style?: ViewStyle;
  palette?: {
    bg: string;
    ink: string;
    accent: string;
  };
  variant?: "cover" | "minimal";
};

const DEFAULT_PALETTE = {
  bg: "#f5f5f4",
  ink: COLORS.ink,
  accent: COLORS.red,
};

export function SheetMock({
  carName,
  carSubtitle,
  tagline,
  specs,
  mods,
  narrative,
  heroImage,
  style,
  palette = DEFAULT_PALETTE,
  variant = "cover",
}: SheetMockProps) {
  const { bg, ink, accent } = palette;

  if (variant === "minimal") {
    return (
      <MinimalSheet
        carName={carName}
        carSubtitle={carSubtitle}
        specs={specs}
        narrative={narrative}
        heroImage={heroImage}
        style={style}
        palette={palette}
      />
    );
  }

  return (
    <View style={[styles.sheet, { backgroundColor: bg }, style]}>
      {/* Magazine header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.brandKicker, { color: accent }]}>BUILDSHEET</Text>
          <Text style={[styles.issueDate, { color: ink }]}>2026 · VOL.01</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>SPEC{"\n"}SHEET</Text>
        </View>
      </View>

      {/* Hero image */}
      {heroImage ? (
        <Image source={heroImage} style={styles.heroImage} contentFit="cover" />
      ) : (
        <View style={[styles.heroPlaceholder, { borderColor: ink }]}>
          <Text style={[styles.placeholderText, { color: ink }]}>YOUR BUILD PHOTO</Text>
        </View>
      )}

      {/* Car title */}
      <View style={styles.titleBlock}>
        <Text style={[styles.carName, { color: ink }]}>{carName.toUpperCase()}</Text>
        {carSubtitle ? (
          <Text style={[styles.carSubtitle, { color: ink }]}>{carSubtitle}</Text>
        ) : null}
        {tagline ? (
          <Text style={[styles.tagline, { color: ink }]}>{tagline}</Text>
        ) : null}
      </View>

      {/* Mod log table */}
      {mods && mods.length > 0 ? (
        <View style={[styles.modTable, { borderColor: ink }]}>
          <View style={[styles.modTableHeader, { borderColor: ink }]}>
            <Text style={[styles.modTableTitle, { color: ink }]}>MOD LOG</Text>
          </View>
          {mods.slice(0, 4).map((mod, i) => (
            <View
              key={mod.id}
              style={[
                styles.modRow,
                i < Math.min(mods.length, 4) - 1 && { borderBottomWidth: 1, borderBottomColor: ink },
              ]}
            >
              <Text style={[styles.modDate, { color: ink }]}>{mod.date}</Text>
              <View style={styles.modInfo}>
                <Text style={[styles.modTitle, { color: ink }]} numberOfLines={1}>
                  {mod.title}
                </Text>
                {mod.mileage ? (
                  <Text style={[styles.modMileage, { color: ink }]}>{mod.mileage}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Mod cards with images */}
      {mods && mods.length > 0 ? (
        <View style={styles.modCards}>
          {mods.slice(0, 3).map((mod) => (
            <View key={mod.id} style={[styles.modCard, { borderColor: ink }]}>
              <View style={[styles.modCardDateBadge, { backgroundColor: accent }]}>
                <Text style={styles.modCardDate}>{mod.date}</Text>
              </View>
              {mod.imageSource ? (
                <Image source={mod.imageSource} style={styles.modCardImage} contentFit="cover" />
              ) : (
                <View style={[styles.modCardImagePlaceholder, { backgroundColor: ink }]}>
                  <Text style={styles.modCardPlaceholderText}>IMG</Text>
                </View>
              )}
              <Text style={[styles.modCardTitle, { color: ink }]} numberOfLines={2}>
                {mod.title}
              </Text>
              {mod.description ? (
                <Text style={[styles.modCardDesc, { color: ink }]} numberOfLines={2}>
                  {mod.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Barcode seed={carName} ink={ink} />
        <Text style={[styles.footerText, { color: ink }]}>BUILDSHEET®</Text>
      </View>
    </View>
  );
}

function MinimalSheet({
  carName,
  carSubtitle,
  specs,
  narrative,
  heroImage,
  style,
  palette = DEFAULT_PALETTE,
}: Omit<SheetMockProps, "mods" | "tagline" | "variant">) {
  const { bg, ink, accent } = palette!;

  return (
    <View style={[styles.sheet, styles.sheetMinimal, { backgroundColor: bg, borderColor: ink }, style]}>
      <View style={styles.minimalHeader}>
        <Text style={[styles.minimalKicker, { color: ink }]}>01 / SPEC SHEET</Text>
        <View style={styles.minimalMark}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.arrow, { color: ink }]}>↗</Text>
        </View>
      </View>

      <Text style={[styles.minimalTitle, { color: ink }]}>{carName.toUpperCase()}</Text>
      {carSubtitle ? (
        <Text style={[styles.minimalSubtitle, { color: ink }]}>{carSubtitle.toUpperCase()}</Text>
      ) : null}

      {heroImage ? (
        <Image source={heroImage} style={[styles.minimalImage, { borderColor: ink }]} contentFit="cover" />
      ) : (
        <View style={[styles.minimalImagePlaceholder, { borderColor: ink }]}>
          <Text style={[styles.placeholderText, { color: ink }]}>YOUR BUILD PHOTO</Text>
        </View>
      )}

      {specs && specs.length > 0 ? (
        <View style={[styles.specTable, { borderColor: ink }]}>
          {specs.map((spec, i) => (
            <View
              key={spec.label}
              style={[
                styles.specCell,
                i < specs.length - 1 && { borderRightWidth: 1, borderRightColor: ink },
              ]}
            >
              <Text style={[styles.specLabel, { color: ink }]}>{spec.label}</Text>
              <Text style={[styles.specValue, { color: ink }]} numberOfLines={1}>
                {spec.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {narrative ? (
        <Text style={[styles.minimalNarrative, { color: ink }]} numberOfLines={4}>
          {narrative}
        </Text>
      ) : null}

      <View style={styles.minimalFooter}>
        <Barcode seed={carName} ink={ink} />
        <Text style={[styles.footerText, { color: ink }]}>BUILDSHEET®</Text>
      </View>
    </View>
  );
}

function Barcode({ seed, ink }: { seed: string; ink: string }) {
  const chars = (seed + "buildsheet2026").slice(0, 20);
  return (
    <View style={styles.barcode}>
      {chars.split("").map((ch, i) => {
        const w = 1 + (ch.charCodeAt(0) % 3);
        return <View key={i} style={{ width: w, height: 18, backgroundColor: ink, marginRight: 1.5 }} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 8,
    overflow: "hidden",
    maxWidth: 380,
    width: "100%",
  },
  sheetMinimal: {
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    borderRadius: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    gap: 2,
  },
  brandKicker: {
    fontFamily: FONTS.display,
    fontSize: 18,
    letterSpacing: 1,
  },
  issueDate: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.7,
  },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 2,
  },
  badgeText: {
    color: "#fff",
    fontFamily: FONTS.heavy,
    fontSize: 9,
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 11,
  },

  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  heroPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  placeholderText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.6,
  },

  titleBlock: {
    padding: 12,
    paddingTop: 10,
    gap: 2,
  },
  carName: {
    fontFamily: FONTS.display,
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -1.5,
  },
  carSubtitle: {
    fontFamily: FONTS.heavy,
    fontSize: 14,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    opacity: 0.85,
  },

  modTable: {
    marginHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
  },
  modTableHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modTableTitle: {
    fontFamily: FONTS.heavy,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  modRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 12,
  },
  modDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
    width: 52,
  },
  modInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  modTitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    flex: 1,
  },
  modMileage: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    opacity: 0.7,
  },

  modCards: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  modCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  modCardDateBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    zIndex: 1,
  },
  modCardDate: {
    color: "#fff",
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 0.3,
  },
  modCardImage: {
    width: "100%",
    aspectRatio: 1,
  },
  modCardImagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15,
  },
  modCardPlaceholderText: {
    color: "#fff",
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  modCardTitle: {
    fontFamily: FONTS.heavy,
    fontSize: 10,
    lineHeight: 13,
    padding: 8,
    paddingBottom: 4,
  },
  modCardDesc: {
    fontFamily: FONTS.body,
    fontSize: 9,
    lineHeight: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
    opacity: 0.75,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  footerText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  barcode: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  // Minimal variant styles
  minimalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  minimalKicker: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  minimalMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  arrow: {
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 22,
  },
  minimalTitle: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -1,
  },
  minimalSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: -4,
  },
  minimalImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 4,
    borderWidth: 1.5,
    marginTop: 4,
  },
  minimalImagePlaceholder: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 4,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  specTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  specCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 1,
  },
  specLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 1,
    opacity: 0.7,
  },
  specValue: {
    fontFamily: FONTS.display,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  minimalNarrative: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.9,
  },
  minimalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
});
