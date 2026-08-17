import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { useCar, useUpsertCar, type CarIdentityInput } from "@/lib/cars";
import { Button, ErrorText, Field, Screen } from "@/components/ui";

function toIntOrNull(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}
function toTextOrNull(value: string): string | null {
  const t = value.trim();
  return t === "" ? null : t;
}

export default function CarFormScreen() {
  const router = useRouter();
  const { data: car } = useCar();
  const upsert = useUpsertCar();
  const isEditing = !!car;

  const [nickname, setNickname] = useState(car?.nickname ?? "");
  const [year, setYear] = useState(car?.year != null ? String(car.year) : "");
  const [make, setMake] = useState(car?.make ?? "");
  const [model, setModel] = useState(car?.model ?? "");
  const [trim, setTrim] = useState(car?.trim ?? "");
  const [color, setColor] = useState(car?.color ?? "");
  const [mileage, setMileage] = useState(car?.mileage != null ? String(car.mileage) : "");
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (!make.trim() || !model.trim()) {
      return setError("Make and model are required.");
    }
    const input: CarIdentityInput = {
      nickname: toTextOrNull(nickname),
      year: toIntOrNull(year),
      make: toTextOrNull(make),
      model: toTextOrNull(model),
      trim: toTextOrNull(trim),
      color: toTextOrNull(color),
      mileage: toIntOrNull(mileage),
    };
    try {
      await upsert.mutateAsync(input);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your car.");
    }
  };

  const busy = upsert.isPending;

  return (
    <Screen title={isEditing ? "Edit Car" : "Add Car"} back>
      <Field label="Project Name (optional)" placeholder="Yellow Storm" value={nickname} onChangeText={setNickname} editable={!busy} autoCapitalize="words" />
      <View style={styles.row}>
        <View style={styles.small}>
          <Field label="Year" placeholder="1999" value={year} onChangeText={setYear} editable={!busy} keyboardType="number-pad" />
        </View>
        <View style={styles.grow}>
          <Field label="Make" placeholder="Nissan" value={make} onChangeText={setMake} editable={!busy} autoCapitalize="words" />
        </View>
      </View>
      <Field label="Model" placeholder="Silvia S15" value={model} onChangeText={setModel} editable={!busy} autoCapitalize="words" />
      <Field label="Trim" placeholder="Spec-R" value={trim} onChangeText={setTrim} editable={!busy} autoCapitalize="words" />
      <View style={styles.row}>
        <View style={styles.grow}>
          <Field label="Color" placeholder="Midnight Purple" value={color} onChangeText={setColor} editable={!busy} autoCapitalize="words" />
        </View>
        <View style={styles.grow}>
          <Field label="Mileage" placeholder="82000" value={mileage} onChangeText={setMileage} editable={!busy} keyboardType="number-pad" />
        </View>
      </View>

      <ErrorText>{error}</ErrorText>
      <Button label={isEditing ? "Save changes" : "Add car"} onPress={save} busy={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  small: { width: 96 },
  grow: { flex: 1 },
});
