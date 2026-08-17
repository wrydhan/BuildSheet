import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useCar } from "@/lib/cars";
import { useParseBuild } from "@/lib/parse";
import { DEMO_MODE } from "@/lib/config";
import { COLORS, FONTS } from "@/lib/design";
import { Button, ErrorText, Field, Mono, Screen } from "@/components/ui";

const PLACEHOLDER =
  "Tell the story of your build in your own words. What did you do, and why? " +
  "Mods, maintenance, the parts you agonized over — write it however you talk.";

export default function BuildScreen() {
  const router = useRouter();
  const { data: car } = useCar();
  const parse = useParseBuild();

  const [text, setText] = useState(car?.raw_text ?? "");
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (!car) return setError("Add your car first.");
    if (text.trim().length === 0) return setError("Write a little about your build first.");
    
    if (DEMO_MODE) {
      setError("AI parsing is disabled in demo mode. Add entries manually instead.");
      return;
    }
    
    try {
      const entries = await parse.mutateAsync({ carId: car.id, rawText: text });
      router.push({ pathname: "/review", params: { count: String(entries.length) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't parse your build.");
    }
  };

  return (
    <Screen title="Your Build" back>
      {DEMO_MODE && (
        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            AI parsing is disabled in demo mode
          </Text>
        </View>
      )}
      
      <Mono>Write about your mods and maintenance — we'll organize it for you.</Mono>

      <Field
        placeholder={PLACEHOLDER}
        value={text}
        onChangeText={setText}
        editable={!parse.isPending}
        multiline
        autoCapitalize="sentences"
        style={styles.editor}
      />

      <ErrorText>{error}</ErrorText>

      <Button
        label={parse.isPending ? "Processing…" : "Generate entries"}
        onPress={run}
        busy={parse.isPending}
        disabled={DEMO_MODE}
      />
      <Text style={styles.hint}>You'll review everything before it's saved</Text>
    </Screen>
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
  editor: { minHeight: 280, fontSize: 16, lineHeight: 23 },
  hint: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5, textAlign: "center" },
});
