import { useRef, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { Link, Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { COLORS, FONTS } from "@/lib/design";

const HERO_SHEET_IMAGE = require("@/assets/images/demo-sheet.png");

export default function LandingScreen() {
  const { session, initializing } = useAuth();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [buildText, setBuildText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleGenerate = async () => {
    if (!buildText.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsGenerating(false);
    router.push("/signup");
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>BUILDSHEET</Text>
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  const slides = [
    { id: "hero", type: "hero" as const },
    { id: "tryit", type: "tryit" as const },
    { id: "features", type: "features" as const },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>B</Text>
            </View>
            <Text style={styles.logoText}>BUILDSHEET</Text>
          </View>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </Link>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer} onLayout={handleContainerLayout}>
          {containerWidth > 0 && (
            <FlatList
              ref={flatListRef}
              data={slides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.slide, { width: containerWidth }]}>
                  {item.type === "hero" && <HeroSlide />}
                  {item.type === "tryit" && (
                    <TryItSlide
                      buildText={buildText}
                      setBuildText={setBuildText}
                      isGenerating={isGenerating}
                      onGenerate={handleGenerate}
                    />
                  )}
                  {item.type === "features" && <FeaturesSlide />}
                </View>
              )}
              getItemLayout={(_, index) => ({
                length: containerWidth,
                offset: containerWidth * index,
                index,
              })}
            />
          )}
        </View>

        {/* Pagination + CTA */}
        <View style={styles.bottomSection}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                }}
              >
                <View
                  style={[styles.dot, index === activeIndex && styles.dotActive]}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.ctaText}>Create your Buildsheet</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function HeroSlide() {
  return (
    <>
      <View style={styles.heroText}>
        <Text style={styles.kicker}>FOR CAR ENTHUSIASTS</Text>
        <Text style={styles.headline}>Every part{"\n"}has a reason.</Text>
        <Text style={styles.subhead}>
          Document your build as magazine-style spec sheets. Share the story
          behind every mod.
        </Text>
      </View>

      <View style={styles.heroVisual}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetFrame}>
            <Image
              source={HERO_SHEET_IMAGE}
              style={styles.sheetImage}
              contentFit="contain"
            />
          </View>
        </View>
        <View style={styles.sheetGlow} />
      </View>
    </>
  );
}

function TryItSlide({
  buildText,
  setBuildText,
  isGenerating,
  onGenerate,
}: {
  buildText: string;
  setBuildText: (t: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <>
      <Text style={styles.kicker}>TRY IT NOW</Text>
      <Text style={styles.slideTitle}>
        Paste your build.{"\n"}See the magic.
      </Text>
      <Text style={styles.slideSubtitle}>
        Drop in a forum post, a parts list, or just ramble about your car.
      </Text>

      <View style={styles.tryItBox}>
        <TextInput
          style={styles.tryItInput}
          placeholder="My 1999 MR2 Spyder is a weekend canyon car. BC Racing coilovers, Cusco strut bars and chassis bracing, Whiteline sway bar, Enkei wheels with Advan A052s..."
          placeholderTextColor={COLORS.dim}
          multiline
          value={buildText}
          onChangeText={setBuildText}
          textAlignVertical="top"
        />
        <Pressable
          style={[
            styles.tryItButton,
            !buildText.trim() && styles.tryItButtonDisabled,
          ]}
          onPress={onGenerate}
          disabled={!buildText.trim() || isGenerating}
        >
          <Text style={styles.tryItButtonText}>
            {isGenerating ? "Generating..." : "Generate my sheet"}
          </Text>
          {!isGenerating && <Text style={styles.tryItButtonArrow}>→</Text>}
        </Pressable>
      </View>

      <Text style={styles.tryItHint}>
        No account needed to try. Sign up to save.
      </Text>
    </>
  );
}

function FeaturesSlide() {
  return (
    <>
      <View>
        <Text style={styles.kicker}>HOW IT WORKS</Text>
        <Text style={styles.slideTitle}>Three simple steps.</Text>
      </View>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>01</Text>
          <View style={styles.featureTextBlock}>
            <Text style={styles.featureTitle}>Write it however</Text>
            <Text style={styles.featureDesc}>
              Paste a parts list, copy from a forum, or just describe it.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>02</Text>
          <View style={styles.featureTextBlock}>
            <Text style={styles.featureTitle}>We design it</Text>
            <Text style={styles.featureDesc}>
              Each mod gets a magazine-style spec sheet. Not a spreadsheet.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>03</Text>
          <View style={styles.featureTextBlock}>
            <Text style={styles.featureTitle}>Share one link</Text>
            <Text style={styles.featureDesc}>
              Your build lives at a permanent URL. No app download required.
            </Text>
          </View>
        </View>
      </View>
    </>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    letterSpacing: 2,
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
    width: 28,
    height: 28,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  logoMarkText: {
    color: "#fff",
    fontFamily: FONTS.display,
    fontSize: 16,
    marginTop: -1,
  },
  logoText: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 16,
    letterSpacing: 1,
  },
  signInLink: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },

  carouselContainer: {
    flex: 1,
  },

  slide: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },

  // Hero slide
  heroText: {
    gap: 12,
  },
  kicker: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
  },
  headline: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.5,
  },
  subhead: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
  },
  heroVisual: {
    alignItems: "center",
    position: "relative",
  },
  sheetContainer: {
    transform: [{ rotate: "3deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  sheetFrame: {
    width: 220,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: COLORS.bgElevated,
  },
  sheetImage: {
    width: "100%",
    height: "100%",
  },
  sheetGlow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    marginLeft: -100,
    width: 200,
    height: 200,
    backgroundColor: COLORS.red,
    opacity: 0.08,
    borderRadius: 100,
    zIndex: -1,
  },

  // Try It slide
  slideTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
  },
  slideSubtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tryItBox: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
  },
  tryItInput: {
    color: COLORS.paper,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    minHeight: 100,
  },
  tryItButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  tryItButtonDisabled: {
    opacity: 0.5,
  },
  tryItButtonText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  tryItButtonArrow: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  tryItHint: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 8,
  },

  // Features slide
  featuresList: {
    gap: 28,
  },
  featureItem: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  featureNumber: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 2,
  },
  featureTextBlock: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.heavy,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  featureDesc: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.line,
  },
  dotActive: {
    backgroundColor: COLORS.red,
    width: 24,
  },
  ctaButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
