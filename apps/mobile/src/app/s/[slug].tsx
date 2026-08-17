import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, FONTS } from "@/lib/design";
import { SheetMock } from "@/components/sheet-mock";

export default function PublicSheetScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const demoSpecs = [
    { label: "POWER", value: "—" },
    { label: "ENGINE", value: "—" },
    { label: "0-100", value: "—" },
    { label: "WEIGHT", value: "—" },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/")}>
            <Text style={styles.logoText}>BUILDSHEET</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.sheetWrapper}>
            <SheetMock
              carName="Loading..."
              carSubtitle={slug?.toUpperCase()}
              specs={demoSpecs}
              narrative="This build sheet is loading. In production, this page will display the full build details for any public car."
              variant="minimal"
              palette={{
                bg: COLORS.gray,
                ink: COLORS.ink,
                accent: COLORS.brick,
              }}
            />
          </View>

          <Text style={styles.stubNote}>
            Public sheet view for: {slug}
          </Text>
          <Text style={styles.stubHint}>
            This route is stubbed. Connect to your backend to load real data.
          </Text>

          <Pressable style={styles.cta} onPress={() => router.push("/signup")}>
            <Text style={styles.ctaText}>Create your own Buildsheet</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 16,
  },
  logoText: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 16,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    gap: 24,
    alignItems: "center",
  },
  sheetWrapper: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  stubNote: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  stubHint: {
    color: COLORS.dim,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 300,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.red,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 4,
    marginTop: 12,
  },
  ctaText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  ctaArrow: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});
