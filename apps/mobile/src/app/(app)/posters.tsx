import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useCar } from "@/lib/cars";
import { usePosters, useDeletePoster } from "@/lib/posters";
import { SharablePoster } from "@/components/sharable-poster";
import { COLORS } from "@/lib/design";
import { Button, Mono, Screen } from "@/components/ui";

export default function PostersScreen() {
  const router = useRouter();
  const { data: car } = useCar();
  const { data: posters, isLoading } = usePosters(car?.id);
  const del = useDeletePoster();

  const confirmDelete = (posterId: string) => {
    if (!car) return;
    
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete poster? This removes the poster and its callouts.");
      if (confirmed) {
        del.mutate({ carId: car.id, posterId });
      }
    } else {
      Alert.alert("Delete poster?", "This removes the poster and its callouts.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => del.mutate({ carId: car.id, posterId }) },
      ]);
    }
  };

  return (
    <Screen title="Sheets" back backTo="/(app)" serial={posters?.length ? `${posters.length} sheets` : undefined}>
      <Button label="+ New sheet" onPress={() => router.push({ pathname: "/create-poster", params: { from: "posters" } })} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.red} />
        </View>
      ) : posters && posters.length > 0 && car ? (
        posters.map((poster) => (
          <SharablePoster
            key={poster.id}
            poster={poster}
            car={car}
            overallNarration={car.narration}
            onDelete={() => confirmDelete(poster.id)}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <Mono dim>No sheets yet — create one to start</Mono>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 40, alignItems: "center" },
  empty: { paddingVertical: 30, alignItems: "center" },
});
