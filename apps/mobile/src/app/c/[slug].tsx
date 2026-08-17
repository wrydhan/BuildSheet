import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { carTitle, carSubtitle, WEB_URL, type Car } from "@/lib/cars";
import { usePublicCar } from "@/lib/public";
import { type Entry } from "@/lib/entries";
import { COLORS, FONTS } from "@/lib/design";
import { Mono } from "@/components/ui";

// Demo data for preview
const DEMO_CAR: Car = {
  id: "demo",
  user_id: "demo",
  nickname: null,
  year: 1999,
  make: "Toyota",
  model: "MR2 Spyder",
  trim: "ZZW30",
  color: "Solar Yellow",
  mileage: 87000,
  raw_text: "",
  is_public: true,
  share_slug: "mr2-spyder",
  tone: "enthusiast",
  narration: "A dedicated canyon carver built for precision handling. Every modification was chosen to sharpen the mid-engine balance this chassis is known for.",
  created_at: new Date().toISOString(),
};

const DEMO_ENTRIES: Entry[] = [
  {
    id: "1",
    car_id: "demo",
    type: "mod",
    title: "BC Racing Coilovers",
    category: "Suspension",
    brand: "BC Racing",
    cost: 1200,
    date: "Mar 2024",
    mileage: 84500,
    notes: "Adjustable height and dampening, 8kg springs",
    reasoning: "Track-ready handling with street comfort",
    narration: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    car_id: "demo",
    type: "mod",
    title: '17" Enkei 6-Spoke Wheels',
    category: "Wheels",
    brand: "Enkei",
    cost: 1800,
    date: "Mar 2024",
    mileage: 84500,
    notes: "White finish, lightweight forged",
    reasoning: "Classic JDM look, reduced unsprung weight",
    narration: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    car_id: "demo",
    type: "mod",
    title: "Cusco Front Strut Tower Bar",
    category: "Chassis",
    brand: "Cusco",
    cost: 280,
    date: "Apr 2024",
    mileage: 85200,
    notes: "Blue anodized aluminum",
    reasoning: "Improved front-end rigidity for sharper turn-in",
    narration: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    car_id: "demo",
    type: "mod",
    title: "Cusco Rear Strut Tower Bar",
    category: "Chassis",
    brand: "Cusco",
    cost: 320,
    date: "Apr 2024",
    mileage: 85200,
    notes: "Over-engine mount design",
    reasoning: "Completes the chassis stiffening package",
    narration: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    car_id: "demo",
    type: "mod",
    title: "Whiteline Heavy-Duty Rear Sway Bar",
    category: "Suspension",
    brand: "Whiteline",
    cost: 450,
    date: "May 2024",
    mileage: 86000,
    notes: "Adjustable, 22mm",
    reasoning: "Reduced body roll, more neutral balance",
    narration: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    car_id: "demo",
    type: "mod",
    title: "Cusco Chassis Stiffening Kit",
    category: "Chassis",
    brand: "Cusco",
    cost: 680,
    date: "May 2024",
    mileage: 86000,
    notes: "Breastplate and front kit",
    reasoning: "Convertible chassis flex eliminated",
    narration: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    car_id: "demo",
    type: "mod",
    title: "Yokohama Advan A052 Tires",
    category: "Tires",
    brand: "Yokohama",
    cost: 900,
    date: "Jun 2024",
    mileage: 87000,
    notes: "205/45R17, semi-slick compound",
    reasoning: "Maximum grip for track days",
    narration: null,
    created_at: new Date().toISOString(),
  },
];

const DEMO_SHEET_IMAGE = require("@/assets/images/demo-sheet.png");

/**
 * Public, view-only garage page. No account required — the growth
 * surface a shared link lands on.
 */
export default function PublicCarScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  
  // Use demo data for the demo slug
  const isDemo = slug === "mr2-spyder" || slug === "demo";
  const { data, isLoading, error } = usePublicCar(isDemo ? undefined : slug);
  
  // Use demo data or real data
  const car = isDemo ? DEMO_CAR : data?.car;
  const entries = isDemo ? DEMO_ENTRIES : [];
  const hasSheet = isDemo ? true : (data?.posters?.length ?? 0) > 0;

  if (!isDemo && isLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.container}>
          <Header />
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.red} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!isDemo && (error || !data)) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.container}>
          <Header />
          <View style={styles.center}>
            <Text style={styles.notFound}>Not found</Text>
            <Mono dim>This garage is private or doesn't exist</Mono>
          </View>
          <View style={styles.ctaContainer}>
            <Link href="/signup" style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Create your own Buildsheet</Text>
            </Link>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header />
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Car Header */}
          <View style={styles.carHeader}>
            <Text style={styles.carTitle}>{carTitle(car!).toUpperCase()}</Text>
            {carSubtitle(car!) ? (
              <Text style={styles.carSubtitle}>{carSubtitle(car!)}</Text>
            ) : null}
            {car!.color && (
              <Text style={styles.carMeta}>{car!.color} · {car!.mileage?.toLocaleString()} mi</Text>
            )}
          </View>

          {/* Narration */}
          {car!.narration && (
            <View style={styles.narrationBox}>
              <Text style={styles.narration}>{car!.narration}</Text>
            </View>
          )}

          {/* Sheet Preview */}
          {hasSheet && (
            <View style={styles.sheetSection}>
              <Text style={styles.sectionLabel}>BUILDSHEET</Text>
              <View style={styles.sheetImageContainer}>
                <Image
                  source={DEMO_SHEET_IMAGE}
                  style={styles.sheetImage}
                  contentFit="contain"
                />
              </View>
            </View>
          )}

          {/* Mod List */}
          <View style={styles.modsSection}>
            <Text style={styles.sectionLabel}>MODIFICATIONS ({entries.length})</Text>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.modCard}>
                <View style={styles.modHeader}>
                  <Text style={styles.modTitle}>{entry.title}</Text>
                  <Text style={styles.modBrand}>{entry.brand}</Text>
                </View>
                <Text style={styles.modCategory}>{entry.category}</Text>
                {entry.notes && (
                  <Text style={styles.modNotes}>{entry.notes}</Text>
                )}
                {entry.reasoning && (
                  <View style={styles.reasoningBox}>
                    <Text style={styles.reasoningLabel}>WHY</Text>
                    <Text style={styles.reasoningText}>{entry.reasoning}</Text>
                  </View>
                )}
                <View style={styles.modMeta}>
                  {entry.date && <Text style={styles.modMetaText}>{entry.date}</Text>}
                  {entry.mileage && <Text style={styles.modMetaText}>{entry.mileage.toLocaleString()} mi</Text>}
                  {entry.cost && <Text style={styles.modMetaText}>${entry.cost.toLocaleString()}</Text>}
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaHeadline}>Document your build</Text>
            <Text style={styles.ctaBody}>
              Create magazine-style spec sheets for your car and share them with the world.
            </Text>
            <Link href="/signup" style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Create your Buildsheet</Text>
            </Link>
          </View>

          <SafeAreaView edges={["bottom"]} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Link href="/">
        <View style={styles.logoContainer}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>B</Text>
          </View>
          <Text style={styles.logoText}>BUILDSHEET</Text>
        </View>
      </Link>
      <Text style={styles.viewOnlyBadge}>VIEW ONLY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFound: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 36,
    letterSpacing: -1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  logoMarkText: {
    color: "#fff",
    fontFamily: FONTS.display,
    fontSize: 14,
    marginTop: -1,
  },
  logoText: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 14,
    letterSpacing: 1,
  },
  viewOnlyBadge: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  carHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    gap: 4,
  },
  carTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
  },
  carSubtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
  carMeta: {
    color: COLORS.dim,
    fontFamily: FONTS.body,
    fontSize: 14,
    marginTop: 8,
  },

  narrationBox: {
    backgroundColor: COLORS.bgElevated,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
    marginBottom: 24,
  },
  narration: {
    color: COLORS.paper,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },

  sheetSection: {
    marginBottom: 32,
    gap: 12,
  },
  sectionLabel: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
  },
  sheetImageContainer: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.bgElevated,
  },
  sheetImage: {
    width: "100%",
    aspectRatio: 2 / 3,
  },

  modsSection: {
    gap: 16,
    marginBottom: 32,
  },
  modCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  modHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  modTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.heavy,
    fontSize: 16,
    flex: 1,
  },
  modBrand: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  modCategory: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  modNotes: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  reasoningBox: {
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 6,
    gap: 4,
    marginTop: 4,
  },
  reasoningLabel: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  reasoningText: {
    color: COLORS.paper,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },
  modMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modMetaText: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },

  ctaSection: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  ctaHeadline: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  ctaBody: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 8,
  },
  ctaContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  ctaButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
  },
  ctaButtonText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});
