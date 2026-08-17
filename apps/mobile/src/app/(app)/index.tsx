import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import {
  carSubtitle,
  carTitle,
  shareUrl,
  useCar,
  useSetCarPublic,
  type Car,
} from "@/lib/cars";
import { useEntries, type Entry } from "@/lib/entries";
import { usePosters } from "@/lib/posters";
import { getDemoPosters, subscribeToDemoPosters } from "@/lib/demo-store";
import { COLORS, FONTS } from "@/lib/design";
import { useSyncExternalStore } from "react";

const MIN_ENTRIES_FOR_SHEET = 3;
const DEMO_SHEET_IMAGE = require("@/assets/images/demo-sheet.png");

function useDemoPosters() {
  return useSyncExternalStore(subscribeToDemoPosters, getDemoPosters, getDemoPosters);
}

export default function GarageScreen() {
  const router = useRouter();
  const { data: car, isLoading } = useCar();
  const { data: entries } = useEntries(car?.id);
  const { data: posters } = usePosters(car?.id);
  const demoPosters = useDemoPosters();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Use demo posters if no real posters exist
  const hasSheet = (posters && posters.length > 0) || demoPosters.length > 0;
  const entryCount = entries?.length ?? 0;

  const handleShare = async () => {
    if (!car) return;
    
    const title = carTitle(car);
    const url = car.share_slug ? shareUrl(car.share_slug) : "https://buildsheet.app";
    
    try {
      await Share.share({
        title: `${title} on Buildsheet`,
        message: `Check out my ${title} build on Buildsheet: ${url}`,
        url,
      });
    } catch {
      // User dismissed
    }
  };

  const handleDownload = async () => {
    try {
      const [asset] = await Asset.loadAsync(DEMO_SHEET_IMAGE);
      
      if (Platform.OS === "web") {
        // For web, create a download link
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${car ? carTitle(car).replace(/\s+/g, "-") : "buildsheet"}-magazine.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // For native, use sharing to let user save
        if (!asset.localUri) {
          Alert.alert("Error", "Couldn't load the image.");
          return;
        }
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(asset.localUri, {
            mimeType: "image/png",
            dialogTitle: "Save your Buildsheet",
          });
        } else {
          Alert.alert("Download unavailable", "Saving isn't available on this device.");
        }
      }
    } catch (e) {
      console.warn("Download error:", e);
      Alert.alert("Error", "Couldn't download the image. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.red} />
      </View>
    );
  }

  if (!car) {
    return <NoCarState />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header onSettingsPress={() => setSettingsOpen(true)} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <CarHeader car={car} onEdit={() => router.push("/car-form")} onShare={handleShare} onDownload={handleDownload} />

          <SheetHero
            car={car}
            hasSheet={hasSheet}
            entryCount={entryCount}
            onViewMagazine={() => router.push("/magazine")}
            onCreateSheet={() => router.push("/create-poster")}
          />

          <EntriesSection
            entries={entries ?? []}
            onEntryPress={(entry) => router.push({ pathname: "/review", params: { entryId: entry.id } })}
            onAddEntry={() => router.push("/build")}
          />

          <SafeAreaView edges={["bottom"]} />
        </ScrollView>

        <AddButton onPress={() => router.push("/build")} />
      </SafeAreaView>

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        car={car}
      />
    </View>
  );
}

function Header({ onSettingsPress }: { onSettingsPress: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>B</Text>
        </View>
        <Text style={styles.logoText}>BUILDSHEET</Text>
      </View>
      <Pressable onPress={onSettingsPress} hitSlop={12} style={styles.settingsBtn}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>
    </View>
  );
}

function CarHeader({ car, onEdit, onShare, onDownload }: { car: Car; onEdit: () => void; onShare: () => void; onDownload: () => void }) {
  const title = carTitle(car);
  const subtitle = carSubtitle(car);

  return (
    <View style={styles.carHeader}>
      <View style={styles.carTitleRow}>
        <Text style={styles.carTitle}>{title.toUpperCase()}</Text>
        <View style={styles.carHeaderActions}>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={onShare} hitSlop={8}>
            <Text style={styles.shareLink}>Share</Text>
          </Pressable>
          <Pressable onPress={onDownload} hitSlop={8}>
            <Text style={styles.downloadLink}>Download</Text>
          </Pressable>
        </View>
      </View>
      {subtitle ? <Text style={styles.carSubtitle}>{subtitle}</Text> : null}
      <View style={styles.carMeta}>
        {car.color ? <Text style={styles.metaChip}>{car.color}</Text> : null}
        {car.mileage != null ? (
          <Text style={styles.metaChip}>{car.mileage.toLocaleString()} mi</Text>
        ) : null}
      </View>
    </View>
  );
}

function SheetHero({
  car,
  hasSheet,
  entryCount,
  onViewMagazine,
  onCreateSheet,
}: {
  car: Car;
  hasSheet: boolean;
  entryCount: number;
  onViewMagazine: () => void;
  onCreateSheet: () => void;
}) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const canShare = Platform.OS !== "web";

  const shareImage = async () => {
    if (!canShare) return;
    
    setSharing(true);
    try {
      // Load the bundled asset
      const [asset] = await Asset.loadAsync(DEMO_SHEET_IMAGE);
      
      if (!asset.localUri) {
        Alert.alert("Error", "Couldn't load the sheet image.");
        return;
      }
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing unavailable", "Sharing isn't available on this device.");
        return;
      }
      
      await Sharing.shareAsync(asset.localUri, {
        mimeType: "image/png",
        dialogTitle: "Share your Buildsheet",
      });
    } catch (e) {
      console.warn("Share error:", e);
      Alert.alert("Error", "Couldn't share the image. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  const shareGarage = async () => {
    if (!car.is_public) {
      Alert.alert(
        "Garage is Private",
        "Your garage is currently set to private. Enable public sharing in Settings to let others view your build.",
        [{ text: "OK" }]
      );
      return;
    }
    
    const url = shareUrl(car.share_slug);
    try {
      await Share.share({ 
        message: `Check out my ${carTitle(car)} build on Buildsheet: ${url}`, 
        url 
      });
    } catch {
      /* dismissed */
    }
  };

  if (hasSheet) {
    return (
      <View style={styles.sheetSection}>
        <Pressable onPress={onViewMagazine} style={styles.sheetImageContainer}>
          <Image
            source={DEMO_SHEET_IMAGE}
            style={styles.sheetImage}
            contentFit="contain"
          />
          <View style={styles.sheetOverlay}>
            <Text style={styles.sheetOverlayText}>TAP TO VIEW MAGAZINE</Text>
          </View>
        </Pressable>
        <View style={styles.sheetMeta}>
          <Text style={styles.sheetLabel}>YOUR BUILDSHEET MAGAZINE</Text>
          <Text style={styles.sheetHint}>Tap to view and manage your pages</Text>
        </View>
        <View style={styles.sheetActions}>
          {canShare ? (
            <View style={styles.shareButtons}>
              <Pressable 
                style={styles.shareBtn} 
                onPress={shareImage}
                disabled={sharing}
              >
                <Text style={styles.shareBtnText}>
                  {sharing ? "..." : "Share Image"}
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.shareBtn, styles.shareLinkBtnAlt]} 
                onPress={shareGarage}
              >
                <Text style={styles.shareLinkBtnTextAlt}>Share Garage</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable onPress={() => router.push("/posters")}>
            <Text style={styles.viewAllLink}>View pages →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (entryCount >= MIN_ENTRIES_FOR_SHEET) {
    return (
      <View style={styles.sheetEmpty}>
        <Text style={styles.sheetEmptyTitle}>Ready for your first sheet</Text>
        <Text style={styles.sheetEmptyBody}>
          You have {entryCount} entries logged. Generate a magazine-style spec sheet to share your build.
        </Text>
        <Pressable style={styles.generateBtn} onPress={onCreateSheet}>
          <Text style={styles.generateBtnText}>Generate my first sheet</Text>
        </Pressable>
      </View>
    );
  }

  const remaining = MIN_ENTRIES_FOR_SHEET - entryCount;
  return (
    <View style={styles.sheetEmpty}>
      <Text style={styles.sheetEmptyTitle}>Build your sheet</Text>
      <Text style={styles.sheetEmptyBody}>
        Add {remaining} more {remaining === 1 ? "entry" : "entries"} to unlock your first magazine-style spec sheet.
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(entryCount / MIN_ENTRIES_FOR_SHEET) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {entryCount} of {MIN_ENTRIES_FOR_SHEET} entries
      </Text>
    </View>
  );
}

function EntriesSection({
  entries,
  onEntryPress,
  onAddEntry,
}: {
  entries: Entry[];
  onEntryPress: (entry: Entry) => void;
  onAddEntry: () => void;
}) {
  if (entries.length === 0) {
    return (
      <View style={styles.entriesSection}>
        <Text style={styles.sectionLabel}>ENTRIES</Text>
        <View style={styles.entriesEmpty}>
          <Text style={styles.entriesEmptyTitle}>No entries yet</Text>
          <Text style={styles.entriesEmptyBody}>
            Start logging your mods and maintenance to build your story.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.entriesSection}>
      <Text style={styles.sectionLabel}>
        ENTRIES · {String(entries.length).padStart(2, "0")}
      </Text>
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} onPress={() => onEntryPress(entry)} />
      ))}
    </View>
  );
}

function EntryRow({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const meta = [entry.brand, entry.category].filter(Boolean).join(" · ");
  const details = [
    entry.date,
    entry.cost != null ? `$${entry.cost.toLocaleString()}` : null,
    entry.mileage != null ? `${entry.mileage.toLocaleString()} mi` : null,
  ].filter(Boolean);

  return (
    <Pressable style={styles.entryRow} onPress={onPress}>
      <View style={styles.entryLeft}>
        <Text style={[styles.entryBadge, entry.type === "service" && styles.entryBadgeSvc]}>
          {entry.type === "service" ? "SVC" : "MOD"}
        </Text>
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.entryTitle}>{entry.title}</Text>
        {meta ? <Text style={styles.entryMeta}>{meta}</Text> : null}
        {details.length > 0 ? (
          <Text style={styles.entryDetails}>{details.join(" · ")}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.addButtonContainer}>
      <Pressable style={styles.addButton} onPress={onPress}>
        <Text style={styles.addButtonText}>Add to your build</Text>
      </Pressable>
    </View>
  );
}

function NoCarState() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Header onSettingsPress={() => {}} />
        <View style={styles.noCarContent}>
          <Text style={styles.noCarTitle}>YOUR{"\n"}GARAGE</Text>
          <Text style={styles.noCarBody}>
            Add your car to start documenting your build.
          </Text>
          <Pressable style={styles.addCarBtn} onPress={() => router.push("/car-form")}>
            <Text style={styles.addCarBtnText}>Add your car</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SettingsModal({
  visible,
  onClose,
  car,
}: {
  visible: boolean;
  onClose: () => void;
  car: Car;
}) {
  const { session, signOut } = useAuth();
  const setPublic = useSetCarPublic();
  const url = shareUrl(car.share_slug);

  const shareGarage = async () => {
    if (!car.is_public) {
      Alert.alert(
        "Garage is Private",
        "Enable the public link toggle above to let others view your build.",
        [{ text: "OK" }]
      );
      return;
    }
    try {
      await Share.share({ 
        message: `Check out my ${carTitle(car)} build on Buildsheet: ${url}`, 
        url 
      });
    } catch {
      /* dismissed */
    }
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>ACCOUNT</Text>
              <Text style={styles.settingsEmail}>{session?.user.email}</Text>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>SHARING</Text>
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowText}>
                  <Text style={styles.settingsRowTitle}>Public link</Text>
                  <Text style={styles.settingsRowHint}>
                    {car.is_public
                      ? "Anyone with the link can view"
                      : "Only you can see your build"}
                  </Text>
                </View>
                <Switch
                  value={car.is_public}
                  disabled={setPublic.isPending}
                  onValueChange={(next) => setPublic.mutate({ carId: car.id, isPublic: next })}
                  trackColor={{ true: COLORS.red, false: "#2a2a2e" }}
                />
              </View>
              <Pressable style={styles.shareLinkBtn} onPress={shareGarage}>
                <Text style={styles.shareLinkBtnText}>Share garage</Text>
              </Pressable>
            </View>

            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutBtnText}>Sign out</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 26,
    height: 26,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  logoMarkText: {
    color: "#fff",
    fontFamily: FONTS.display,
    fontSize: 14,
  },
  logoText: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    color: COLORS.muted,
    fontSize: 18,
  },

  carHeader: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  carTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  carTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
    flex: 1,
  },
  editLink: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 14,
    marginTop: 6,
  },
  carHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  shareLink: {
    color: COLORS.red,
    fontFamily: FONTS.medium,
    fontSize: 14,
    marginTop: 6,
  },
  downloadLink: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 14,
    marginTop: 6,
  },
  carSubtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 13,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  carMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    color: COLORS.paper,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  sheetSection: {
    marginBottom: 32,
  },
  sheetImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.bgElevated,
  },
  sheetImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
  },
  sheetOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetOverlayText: {
    color: "#fff",
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
  },
  sheetMeta: {
    marginTop: 12,
    gap: 2,
  },
  sheetLabel: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sheetHint: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  sheetActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  shareButtons: {
    flexDirection: "row",
    gap: 8,
  },
  shareBtn: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  shareLinkBtnAlt: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  shareBtnText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  shareLinkBtnTextAlt: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  viewAllLink: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },

  sheetEmpty: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    gap: 12,
  },
  sheetEmptyTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.heavy,
    fontSize: 18,
  },
  sheetEmptyBody: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  generateBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  generateBtnText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.line,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.red,
  },
  progressLabel: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  entriesSection: {
    gap: 12,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  entriesEmpty: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  entriesEmptyTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  entriesEmptyBody: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },

  entryRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgElevated,
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  entryLeft: {
    paddingTop: 2,
  },
  entryBadge: {
    color: COLORS.red,
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  entryBadgeSvc: {
    color: "#6ea8ff",
  },
  entryContent: {
    flex: 1,
    gap: 2,
  },
  entryTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  entryMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  entryDetails: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 4,
  },

  addButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  addButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  noCarContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  noCarTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 56,
    lineHeight: 54,
    letterSpacing: -2,
  },
  noCarBody: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 17,
    lineHeight: 24,
  },
  addCarBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  addCarBtnText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.bgElevated,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.heavy,
    fontSize: 20,
  },
  modalClose: {
    color: COLORS.muted,
    fontSize: 20,
  },

  settingsSection: {
    marginBottom: 24,
    gap: 12,
  },
  settingsLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  settingsEmail: {
    color: COLORS.paper,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  settingsRowText: {
    flex: 1,
    gap: 2,
  },
  settingsRowTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  settingsRowHint: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  shareLinkBtn: {
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  shareLinkBtnText: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },

  signOutBtn: {
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  signOutBtnText: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 15,
  },
});
