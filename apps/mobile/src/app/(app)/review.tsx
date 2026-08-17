import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { useCar } from "@/lib/cars";
import { entryKeys, useReplaceEntries, type EntryInput, type EntryType } from "@/lib/entries";
import { COLORS, FONTS } from "@/lib/design";
import { Button, ErrorText, Field, Mono, Screen } from "@/components/ui";

function toNumberOrNull(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function toTextOrNull(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

const EMPTY: EntryInput = {
  type: "mod", title: "", category: null, brand: null, cost: null,
  date: null, mileage: null, notes: null, reasoning: null,
};

export default function ReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: car } = useCar();
  const replace = useReplaceEntries();

  const initial = useMemo(
    () => queryClient.getQueryData<EntryInput[]>(entryKeys.draft) ?? [],
    [queryClient],
  );
  const [entries, setEntries] = useState<EntryInput[]>(initial);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<EntryInput>) =>
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setEntries((prev) => [...prev, { ...EMPTY }]);

  const save = async () => {
    setError(null);
    if (!car) return setError("No car found.");
    const cleaned = entries
      .map((e) => ({ ...e, title: e.title.trim() }))
      .filter((e) => e.title.length > 0);
    try {
      await replace.mutateAsync({ carId: car.id, entries: cleaned });
      router.dismissAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your entries.");
    }
  };

  const busy = replace.isPending;

  return (
    <Screen title="Review" back serial={entries.length ? `${entries.length} items` : undefined}>
      <Mono>
        {entries.length === 0
          ? "No items found — try adding more detail to your build"
          : "Review and edit before saving"}
      </Mono>

      {entries.map((entry, i) => (
        <EntryCard key={i} entry={entry} index={i} onChange={update} onRemove={remove} disabled={busy} />
      ))}

      <Pressable style={styles.add} onPress={add} disabled={busy}>
        <Text style={styles.addText}>+ ADD ITEM</Text>
      </Pressable>

      <ErrorText>{error}</ErrorText>
      <Button
        label={busy ? "Saving…" : `Save ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
        onPress={save}
        busy={busy}
      />
    </Screen>
  );
}

type CardProps = {
  entry: EntryInput;
  index: number;
  onChange: (i: number, patch: Partial<EntryInput>) => void;
  onRemove: (i: number) => void;
  disabled: boolean;
};

function EntryCard({ entry, index, onChange, onRemove, disabled }: CardProps) {
  const setType = (type: EntryType) => onChange(index, { type });
  return (
    <View style={styles.card}>
      <Text style={styles.cardIndex}>{String(index + 1).padStart(2, "0")}</Text>
      <View style={styles.cardHeader}>
        <View style={styles.pills}>
          <Pill label="MOD" active={entry.type === "mod"} onPress={() => setType("mod")} disabled={disabled} />
          <Pill label="SVC" active={entry.type === "service"} onPress={() => setType("service")} disabled={disabled} />
        </View>
        <Pressable onPress={() => onRemove(index)} disabled={disabled} hitSlop={8}>
          <Text style={styles.remove}>REMOVE ✕</Text>
        </Pressable>
      </View>

      <Field label="Title" value={entry.title} onChangeText={(v) => onChange(index, { title: v })} editable={!disabled} placeholder="Coilover suspension" autoCapitalize="sentences" />
      <View style={styles.row}>
        <View style={styles.grow}>
          <Field label="Category" value={entry.category ?? ""} onChangeText={(v) => onChange(index, { category: toTextOrNull(v) })} editable={!disabled} placeholder="suspension" />
        </View>
        <View style={styles.grow}>
          <Field label="Brand" value={entry.brand ?? ""} onChangeText={(v) => onChange(index, { brand: toTextOrNull(v) })} editable={!disabled} placeholder="BC Racing" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Field label="Cost" value={entry.cost != null ? String(entry.cost) : ""} onChangeText={(v) => onChange(index, { cost: toNumberOrNull(v) })} editable={!disabled} placeholder="1200" keyboardType="decimal-pad" />
        </View>
        <View style={styles.grow}>
          <Field label="Date" value={entry.date ?? ""} onChangeText={(v) => onChange(index, { date: toTextOrNull(v) })} editable={!disabled} placeholder="last spring" />
        </View>
        <View style={styles.grow}>
          <Field label="Miles" value={entry.mileage != null ? String(entry.mileage) : ""} onChangeText={(v) => onChange(index, { mileage: toNumberOrNull(v) })} editable={!disabled} placeholder="45000" keyboardType="number-pad" />
        </View>
      </View>
      <Field label="Notes / facts" value={entry.notes ?? ""} onChangeText={(v) => onChange(index, { notes: toTextOrNull(v) })} editable={!disabled} placeholder="36-way adjustable, 8kg springs" multiline />
      <Field label="Reasoning / the why" value={entry.reasoning ?? ""} onChangeText={(v) => onChange(index, { reasoning: toTextOrNull(v) })} editable={!disabled} placeholder="Wanted adjustable ride height for track" multiline />
    </View>
  );
}

function Pill({ label, active, onPress, disabled }: { label: string; active: boolean; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgElevated,
    borderColor: COLORS.line,
    borderWidth: 1,
    borderLeftColor: COLORS.red,
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 14,
    gap: 10,
  },
  cardIndex: { position: "absolute", right: 12, top: 10, color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 11 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pills: { flexDirection: "row", gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 3, borderWidth: 1, borderColor: COLORS.line },
  pillActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  pillText: { color: COLORS.muted, fontFamily: FONTS.monoBold, fontSize: 11, letterSpacing: 1 },
  pillTextActive: { color: "#fff" },
  remove: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5 },
  row: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
  add: {
    borderColor: COLORS.line,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 4,
    paddingVertical: 15,
    alignItems: "center",
  },
  addText: { color: COLORS.red, fontFamily: FONTS.monoBold, fontSize: 12, letterSpacing: 1 },
});
