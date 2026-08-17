import { useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useCar } from "@/lib/cars";
import { useEntries } from "@/lib/entries";
import { FACETS, FACET_LABELS, facetCounts, type Facet } from "@/lib/facets";
import { useTemplates } from "@/lib/templates";
import { useComposePoster, usePosters } from "@/lib/posters";
import { useUploadPosterPhoto } from "@/lib/photos";
import { addDemoPoster, getDemoPosters, subscribeToDemoPosters, DEMO_PAGES_DATA } from "@/lib/demo-store";
import { DEMO_MODE } from "@/lib/config";
import { COLORS, FONTS } from "@/lib/design";
import { Button, ErrorText, Label, Screen } from "@/components/ui";

function useDemoPosters() {
  return useSyncExternalStore(subscribeToDemoPosters, getDemoPosters, getDemoPosters);
}

const AUTO = "__auto__";
const DEMO_SHEET_IMAGE = require("@/assets/images/demo-sheet.png");

export default function CreatePosterScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { data: car } = useCar();
  const { data: entries } = useEntries(car?.id);
  const { data: templates } = useTemplates();
  const { data: realPosters } = usePosters(car?.id);
  const demoPosters = useDemoPosters();
  const compose = useComposePoster();
  const uploadPhoto = useUploadPosterPhoto();

  const counts = facetCounts(entries ?? []);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [facet, setFacet] = useState<Facet>("overall");
  const [style, setStyle] = useState<string>(AUTO);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedExisting, setSelectedExisting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styleOptions = (templates ?? []).filter((t) => !t.is_flexible_fallback);
  
  // In demo mode or when no real posters exist, use demo posters for the library
  const isInDemoMode = !car || DEMO_MODE;
  const libraryPosters = isInDemoMode ? demoPosters : (realPosters ?? []);
  const hasExisting = libraryPosters.length > 0;

  const addPhoto = async () => {
    setError(null);
    if (!car) return;
    try {
      const url = await uploadPhoto.mutateAsync(car.id);
      if (url) setPhotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add the photo.");
    }
  };

  const returnRoute = from === "posters" ? "/posters" : "/magazine";

  const create = async () => {
    setError(null);
    
    if (mode === "existing" && selectedExisting) {
      // Find the selected poster from the library (works for both demo and real posters)
      const selectedPoster = libraryPosters.find((p) => p.id === selectedExisting);
      
      if (selectedPoster) {
        if (isInDemoMode) {
          // In demo mode, add a new demo poster based on the selected one
          addDemoPoster(selectedPoster.facet, selectedPoster.image_url);
          router.replace(returnRoute as any);
          return;
        }
        
        // In real mode, create a new poster based on the selected one
        try {
          await compose.mutateAsync({
            carId: car!.id,
            facet: selectedPoster.facet as Facet,
            stylePreference: selectedPoster.template?.style ?? null,
            imageUrl: selectedPoster.image_url,
          });
          router.replace(returnRoute as any);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Couldn't add the poster.");
        }
        return;
      }
      
      // Fallback: just navigate back
      router.replace(returnRoute as any);
      return;
    }
    
    // If no car exists or in demo mode without backend, use demo store
    if (!car || DEMO_MODE) {
      addDemoPoster(facet, photoUrl);
      router.replace(returnRoute as any);
      return;
    }
    
    // Use real backend
    try {
      await compose.mutateAsync({
        carId: car.id,
        facet,
        stylePreference: style === AUTO ? null : style,
        imageUrl: photoUrl,
      });
      router.replace(returnRoute as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the poster.");
    }
  };

  const busy = compose.isPending || uploadPhoto.isPending;

  return (
    <Screen title="New Page" back backTo={from === "posters" ? "/posters" : from === "magazine" ? "/magazine" : "/(app)"} scroll={false}>
      <View style={styles.container}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeTab, mode === "new" && styles.modeTabActive]}
            onPress={() => setMode("new")}
          >
            <Text style={[styles.modeTabText, mode === "new" && styles.modeTabTextActive]}>
              CREATE NEW
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === "existing" && styles.modeTabActive]}
            onPress={() => setMode("existing")}
          >
            <Text style={[styles.modeTabText, mode === "existing" && styles.modeTabTextActive]}>
              FROM LIBRARY
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {mode === "existing" ? (
            <ExistingLibrary
              existingPosters={libraryPosters}
              selectedId={selectedExisting}
              onSelect={setSelectedExisting}
              isDemo={isInDemoMode}
            />
          ) : (
            <>
              <Label>SELECT FACET</Label>
              <View style={styles.chips}>
                {FACETS.map((f) => {
                  const active = facet === f;
                  return (
                    <Pressable key={f} style={[styles.chip, active && styles.chipActive]} onPress={() => setFacet(f)} disabled={busy}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{FACET_LABELS[f].toUpperCase()}</Text>
                      <Text style={[styles.chipCount, active && styles.chipCountActive]}>{String(counts[f]).padStart(2, "0")}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Label>STYLE</Label>
              <View style={styles.chips}>
                <Pressable style={[styles.chip, style === AUTO && styles.chipActive]} onPress={() => setStyle(AUTO)} disabled={busy}>
                  <Text style={[styles.chipText, style === AUTO && styles.chipTextActive]}>AUTO</Text>
                </Pressable>
                {styleOptions.map((t) => (
                  <Pressable key={t.id} style={[styles.chip, style === t.style && styles.chipActive]} onPress={() => setStyle(t.style)} disabled={busy}>
                    <Text style={[styles.chipText, style === t.style && styles.chipTextActive]}>{t.name.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>

              <Label>PHOTO / OPTIONAL</Label>
              {photoUrl ? (
                <View style={styles.photoRow}>
                  <Image source={{ uri: photoUrl }} style={styles.photoThumb} contentFit="cover" />
                  <View style={styles.photoActions}>
                    <Pressable onPress={addPhoto} disabled={busy}><Text style={styles.photoAction}>REPLACE</Text></Pressable>
                    <Pressable onPress={() => setPhotoUrl(null)} disabled={busy}><Text style={styles.photoRemove}>REMOVE</Text></Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.photoButton} onPress={addPhoto} disabled={busy}>
                  {uploadPhoto.isPending ? <ActivityIndicator color={COLORS.muted} /> : <Text style={styles.photoButtonText}>+ ADD PHOTO</Text>}
                </Pressable>
              )}

              {counts[facet] === 0 && facet !== "overall" ? (
                <Text style={styles.warn}>No entries match this category — sheet will be minimal</Text>
              ) : null}
            </>
          )}

          <ErrorText>{error}</ErrorText>
        </ScrollView>

        <View style={styles.footer}>
          <Button 
            label={mode === "existing" ? "Add to magazine" : "Create sheet"} 
            onPress={create} 
            busy={busy}
            disabled={mode === "existing" && !selectedExisting}
          />
        </View>
      </View>
    </Screen>
  );
}

function ExistingLibrary({
  existingPosters,
  selectedId,
  onSelect,
  isDemo,
}: {
  existingPosters: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isDemo: boolean;
}) {
  return (
    <View style={styles.library}>
      <Text style={styles.libraryHint}>
        Select a sheet to add a copy to your magazine
      </Text>

      {existingPosters.map((poster) => {
        const isDemoPoster = poster.id.startsWith("demo");
        const demoData = isDemoPoster ? (DEMO_PAGES_DATA[poster.id] || DEMO_PAGES_DATA["demo-1"]) : null;
        const isCover = demoData?.iscover;
        return (
          <Pressable
            key={poster.id}
            style={[styles.libraryItem, selectedId === poster.id && styles.libraryItemSelected]}
            onPress={() => onSelect(poster.id)}
          >
            {isDemoPoster && demoData ? (
              isCover ? (
                <Image source={DEMO_SHEET_IMAGE} style={styles.libraryThumb} contentFit="cover" />
              ) : (
                <View style={[styles.libraryThumb, { backgroundColor: demoData.bgColor, justifyContent: "center", padding: 8 }]}>
                  <Text style={{ color: COLORS.paper, fontFamily: FONTS.display, fontSize: 10 }}>
                    {demoData.headline.split('\n')[0]}
                  </Text>
                </View>
              )
            ) : poster.image_url ? (
              <Image source={{ uri: poster.image_url }} style={styles.libraryThumb} contentFit="cover" />
            ) : (
              <View style={[styles.libraryThumb, styles.libraryThumbPlaceholder]}>
                <Text style={styles.libraryThumbText}>{poster.facet[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.libraryInfo}>
              <Text style={styles.libraryTitle}>
                {isDemoPoster && demoData ? (isCover ? "JDM Cover" : demoData.headline.replace('\n', ' ')) : `${poster.facet.charAt(0).toUpperCase() + poster.facet.slice(1)} Sheet`}
              </Text>
              <Text style={styles.libraryMeta}>
                {isDemoPoster ? (isCover ? "Magazine cover page" : "Demo spec sheet") : `${poster.callouts?.length ?? 0} callouts · ${poster.template?.name ?? "Auto style"}`}
              </Text>
            </View>
            {selectedId === poster.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {existingPosters.length === 0 && (
        <View style={styles.emptyLibrary}>
          <Text style={styles.emptyLibraryText}>
            No sheets generated yet. Create your first one!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  modeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.bgElevated,
    borderRadius: 6,
    padding: 4,
    marginHorizontal: 18,
    marginTop: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 4,
  },
  modeTabActive: {
    backgroundColor: COLORS.red,
  },
  modeTabText: {
    color: COLORS.muted,
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  modeTabTextActive: {
    color: "#fff",
  },
  
  scrollArea: { flex: 1 },
  scrollContent: { padding: 18, gap: 14, paddingBottom: 20 },
  
  footer: {
    padding: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: COLORS.line, borderRadius: 3,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  chipActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  chipText: { color: COLORS.muted, fontFamily: FONTS.monoBold, fontSize: 11, letterSpacing: 0.8 },
  chipTextActive: { color: "#fff" },
  chipCount: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 11 },
  chipCountActive: { color: "#ffd7d9" },
  photoButton: { borderColor: COLORS.line, borderWidth: 1, borderStyle: "dashed", borderRadius: 4, paddingVertical: 18, alignItems: "center" },
  photoButtonText: { color: COLORS.muted, fontFamily: FONTS.monoBold, fontSize: 12, letterSpacing: 1 },
  photoRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  photoThumb: { width: 100, height: 72, borderRadius: 4, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.line },
  photoActions: { gap: 10 },
  photoAction: { color: COLORS.red, fontFamily: FONTS.monoBold, fontSize: 12, letterSpacing: 0.5 },
  photoRemove: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.5 },
  warn: { color: "#e5a23d", fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.3 },
  
  library: { gap: 12 },
  libraryHint: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  libraryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  libraryItemSelected: {
    borderColor: COLORS.red,
  },
  libraryThumb: {
    width: 60,
    height: 80,
    borderRadius: 4,
    backgroundColor: COLORS.bgInput,
  },
  libraryThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  libraryThumbText: {
    color: COLORS.muted,
    fontFamily: FONTS.display,
    fontSize: 24,
  },
  libraryInfo: {
    flex: 1,
    gap: 4,
  },
  libraryTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  libraryMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  emptyLibrary: {
    padding: 24,
    alignItems: "center",
  },
  emptyLibraryText: {
    color: COLORS.dim,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: "center",
  },
});
