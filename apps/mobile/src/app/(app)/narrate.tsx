import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useCar, type Tone } from "@/lib/cars";
import { useEntries, type Entry } from "@/lib/entries";
import { useNarrate } from "@/lib/narrate";
import { DEMO_MODE } from "@/lib/config";
import { COLORS, FONTS } from "@/lib/design";
import { Button, ErrorText, Mono, Screen } from "@/components/ui";

const TONES: Array<{ value: Tone; label: string; blurb: string }> = [
  { value: "straight", label: "STRAIGHT", blurb: "Clean, factual" },
  { value: "enthusiast", label: "ENTHUSIAST", blurb: "Warm, engaging" },
  { value: "full_documentary", label: "EDITORIAL", blurb: "Magazine style" },
];

export default function NarrateScreen() {
  const { data: car } = useCar();
  const { data: entries } = useEntries(car?.id);
  const narrate = useNarrate();

  const [tone, setTone] = useState<Tone>(car?.tone ?? "enthusiast");
  const [error, setError] = useState<string | null>(null);

  const hasEntries = !!entries && entries.length > 0;
  const hasNarration = !!car?.narration || (entries?.some((e) => e.narration) ?? false);

  const generate = async () => {
    setError(null);
    if (DEMO_MODE) {
      setError("AI narration is disabled in demo mode.");
      return;
    }
    if (!car) return setError("No car found.");
    try {
      await narrate.mutateAsync({ carId: car.id, tone });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate narration.");
    }
  };

  const busy = narrate.isPending;

  return (
    <Screen title="Narration" back>
      {DEMO_MODE && (
        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            AI narration is disabled in demo mode
          </Text>
        </View>
      )}
      
      <Mono>Generate written descriptions for your build and entries.</Mono>

      <View style={styles.tones}>
        {TONES.map((opt) => {
          const active = tone === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.tone, active && styles.toneActive]}
              onPress={() => setTone(opt.value)}
              disabled={busy}
            >
              <Text style={[styles.toneLabel, active && styles.toneLabelActive]}>{opt.label}</Text>
              <Text style={[styles.toneBlurb, active && styles.toneBlurbActive]}>{opt.blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      {!hasEntries ? <Mono dim>No entries yet — parse your build first</Mono> : null}
      <ErrorText>{error}</ErrorText>

      <Button
        label={busy ? "Writing…" : hasNarration ? "Regenerate" : "Generate narration"}
        onPress={generate}
        busy={busy}
        disabled={!hasEntries || DEMO_MODE}
      />

      {car?.narration ? (
        <View style={styles.overall}>
          <Label>THE BUILD</Label>
          <Text style={styles.overallText}>{car.narration}</Text>
        </View>
      ) : null}

      {hasEntries
        ? entries!.map((entry) => <NarratedEntry key={entry.id} entry={entry} />)
        : null}
    </Screen>
  );
}

function NarratedEntry({ entry }: { entry: Entry }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{entry.title.toUpperCase()}</Text>
      {entry.narration ? (
        <Text style={styles.cardBody}>{entry.narration}</Text>
      ) : (
        <Text style={styles.cardEmpty}>No narration yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  demoNotice: {
    backgroundColor: "#3a2a1a",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  demoNoticeText: {
    color: "#e5a23d",
    fontFamily: FONTS.mono,
    fontSize: 12,
    textAlign: "center",
  },
  tones: { flexDirection: "row", gap: 8 },
  tone: { flex: 1, borderColor: COLORS.line, borderWidth: 1, borderRadius: 4, padding: 11, gap: 3 },
  toneActive: { borderColor: COLORS.red, backgroundColor: COLORS.redDim },
  toneLabel: { color: COLORS.paper, fontFamily: FONTS.heavy, fontSize: 12, letterSpacing: 0.5 },
  toneLabelActive: { color: "#fff" },
  toneBlurb: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5 },
  toneBlurbActive: { color: COLORS.red },
  overall: { backgroundColor: COLORS.bgElevated, borderColor: COLORS.line, borderWidth: 1, borderRadius: 6, padding: 16, gap: 8 },
  overallText: { color: COLORS.paper, fontFamily: FONTS.body, fontSize: 16, lineHeight: 24 },
  card: { borderColor: COLORS.line, borderWidth: 1, borderRadius: 6, padding: 14, gap: 6 },
  cardTitle: { color: COLORS.paper, fontFamily: FONTS.heavy, fontSize: 13, letterSpacing: 0.5 },
  cardBody: { color: COLORS.muted, fontFamily: FONTS.body, fontSize: 14, lineHeight: 21 },
  cardEmpty: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 12 },
});
