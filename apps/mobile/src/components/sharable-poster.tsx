import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { PosterView } from "@/components/poster-view";
import type { PosterWithChildren } from "@/lib/posters";
import type { Car } from "@/lib/cars";

type Props = {
  poster: PosterWithChildren;
  car: Car;
  overallNarration?: string | null;
  onDelete?: () => void;
};

/**
 * A poster plus its actions. "Share" rasterizes the on-screen layout to a PNG
 * (react-native-view-shot) and hands it to the OS share sheet — the shareable
 * artifact the growth loop depends on. Native only; web uses the public link.
 */
export function SharablePoster({ poster, car, overallNarration, onDelete }: Props) {
  const shotRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canShare = Platform.OS !== "web";

  const share = async () => {
    setError(null);
    try {
      setBusy(true);
      const uri = await captureRef(shotRef, { format: "png", quality: 1 });
      if (!(await Sharing.isAvailableAsync())) {
        setError("Sharing isn't available on this device.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your poster",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't share the poster.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {/* collapsable={false} keeps a real native view for capture. */}
      <View ref={shotRef} collapsable={false}>
        <PosterView poster={poster} car={car} overallNarration={overallNarration} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {canShare ? (
          <Pressable style={styles.action} onPress={share} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#e8e8ea" />
            ) : (
              <Text style={styles.actionText}>Share as image</Text>
            )}
          </Pressable>
        ) : (
          <View />
        )}
        {onDelete ? (
          <Pressable style={styles.deleteRow} onPress={onDelete} disabled={busy}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  error: { color: "#ff6b6b", fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  action: {
    borderColor: "#3a3a40",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionText: { color: "#e8e8ea", fontSize: 14, fontWeight: "600" },
  deleteRow: { paddingVertical: 6, paddingHorizontal: 8 },
  deleteText: { color: "#8a8a8f", fontSize: 13 },
});
