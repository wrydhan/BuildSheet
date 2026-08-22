import { useRef, useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { useCar, carTitle } from "@/lib/cars";
import { usePosters, useDeletePoster, useReorderPosters, type PosterWithChildren } from "@/lib/posters";
import { getDemoPosters, removeDemoPoster, reorderDemoPosters, subscribeToDemoPosters, DEMO_PAGES_DATA } from "@/lib/demo-store";
import { DEMO_MODE } from "@/lib/config";
import { PosterView } from "@/components/poster-view";
import { COLORS, FONTS } from "@/lib/design";
import { Screen } from "@/components/ui";

const DEMO_SHEET_IMAGE = require("@/assets/images/demo-sheet.png");

function useDemoPosters() {
  return useSyncExternalStore(subscribeToDemoPosters, getDemoPosters, getDemoPosters);
}

// Demo car for use when no real car exists
const DEMO_CAR = {
  id: "demo",
  year: null,
  make: null,
  model: null,
  trim: null,
  nickname: "Demo Magazine",
  narration: null,
};

// Mini preview for demo pages in edit mode
function DemoPagePreview({ posterId }: { posterId: string }) {
  const demoData = DEMO_PAGES_DATA[posterId] || DEMO_PAGES_DATA["demo-1"];
  const isCover = demoData.iscover;
  
  if (isCover) {
    return (
      <View style={previewStyles.coverContainer}>
        <Image
          source={DEMO_SHEET_IMAGE}
          style={previewStyles.coverImage}
          contentFit="cover"
        />
      </View>
    );
  }
  
  return (
    <View style={[previewStyles.container, { backgroundColor: demoData.bgColor }]}>
      <Text style={[previewStyles.brand, { color: COLORS.red }]}>{demoData.brand}</Text>
      <Text style={[previewStyles.headline, { color: COLORS.paper }]}>
        {demoData.headline.split('\n')[0]}
      </Text>
      <Text style={[previewStyles.subline, { color: COLORS.muted }]}>
        {demoData.specs[0]?.label}: {demoData.specs[0]?.value}
      </Text>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    width: "100%",
    height: 160,
    borderRadius: 6,
    padding: 16,
    justifyContent: "center",
    gap: 8,
  },
  coverContainer: {
    width: "100%",
    height: 200,
    borderRadius: 6,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  brand: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 2,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  subline: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});

export default function MagazineScreen() {
  const router = useRouter();
  const { data: realCar } = useCar();
  const { data: realPosters, isLoading } = usePosters(realCar?.id);
  const del = useDeletePoster();
  const reorder = useReorderPosters();
  const demoPosters = useDemoPosters();
  const [editMode, setEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Use demo car when no real car exists and in demo mode
  const car = realCar ?? (DEMO_MODE ? DEMO_CAR : null);

  // In demo mode, always use demo posters. Otherwise use real posters if available.
  const isUsingDemoPosters = DEMO_MODE || !realPosters || realPosters.length === 0;
  const posters = isUsingDemoPosters ? demoPosters : realPosters;

  const confirmDelete = (posterId: string) => {
    const doDelete = () => {
      if (posterId.startsWith("demo")) {
        removeDemoPoster(posterId);
        if (currentPage >= (posters?.length ?? 1) - 1) {
          setCurrentPage(Math.max(0, currentPage - 1));
        }
      } else if (car) {
        del.mutate({ carId: car.id, posterId });
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Delete this page? This removes the sheet and its callouts."
      );
      if (confirmed) doDelete();
    } else {
      Alert.alert("Delete this page?", "This removes the sheet and its callouts.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const moveUp = (index: number) => {
    if (!posters || index === 0) return;
    const newOrder = [...posters];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    if (isUsingDemoPosters) {
      reorderDemoPosters(newOrder.map((p) => p.id));
    } else if (car) {
      reorder.mutate({
        carId: car.id,
        posterIds: newOrder.map((p) => p.id),
      });
    }
    setCurrentPage(index - 1);
  };

  const moveDown = (index: number) => {
    if (!posters || index === posters.length - 1) return;
    const newOrder = [...posters];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    if (isUsingDemoPosters) {
      reorderDemoPosters(newOrder.map((p) => p.id));
    } else if (car) {
      reorder.mutate({
        carId: car.id,
        posterIds: newOrder.map((p) => p.id),
      });
    }
    setCurrentPage(index + 1);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!posters || fromIndex === toIndex) return;
    const newOrder = [...posters];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    
    if (isUsingDemoPosters) {
      reorderDemoPosters(newOrder.map((p) => p.id));
    } else if (car) {
      reorder.mutate({
        carId: car.id,
        posterIds: newOrder.map((p) => p.id),
      });
    }
    setCurrentPage(toIndex);
  };

  if (isLoading && !DEMO_MODE) {
    return (
      <Screen title="Your Magazine" back backTo="/(app)">
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.red} />
        </View>
      </Screen>
    );
  }

  // In demo mode, skip the car check and show demo posters
  if (!car && !DEMO_MODE) {
    return (
      <Screen title="Your Magazine" back backTo="/(app)">
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No car found</Text>
          <Text style={styles.emptyBody}>
            Add a car first to create your magazine.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!posters || posters.length === 0) {
    return (
      <Screen title="Your Magazine" back backTo="/(app)">
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No pages yet</Text>
          <Text style={styles.emptyBody}>
            Create your first sheet to start building your magazine.
          </Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push({ pathname: "/create-poster", params: { from: "magazine" } })}
          >
            <Text style={styles.createBtnText}>Create first page</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Your Magazine"
      back
      backTo="/(app)"
      scroll={false}
      serial={`${posters.length} ${posters.length === 1 ? "page" : "pages"}`}
      headerRight={
        <Pressable onPress={() => setEditMode(!editMode)} hitSlop={8}>
          <Text style={[styles.editToggle, editMode && styles.editToggleActive]}>
            {editMode ? "Done" : "Edit"}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.magazineHeader}>
        <Text style={styles.magazineTitle}>{carTitle(car).toUpperCase()}</Text>
        <Text style={styles.magazineSubtitle}>BUILDSHEET MAGAZINE</Text>
      </View>

      {editMode ? (
        <EditModeView
          posters={posters}
          car={car}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
          onReorder={handleReorder}
          onDelete={confirmDelete}
          onAddPage={() => router.push({ pathname: "/create-poster", params: { from: "magazine" } })}
        />
      ) : (
        <ReaderModeView
          posters={posters}
          car={car}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </Screen>
  );
}

function MagazinePage({
  poster,
  car,
}: {
  poster: PosterWithChildren;
  car: any;
}) {
  const isDemo = poster.id.startsWith("demo");
  const demoData = isDemo ? DEMO_PAGES_DATA[poster.id] || DEMO_PAGES_DATA["demo-1"] : null;

  if (isDemo && demoData) {
    if (demoData.iscover) {
      return (
        <View style={styles.demoCoverImageContainer}>
          <Image
            source={DEMO_SHEET_IMAGE}
            style={styles.demoCoverImage}
            contentFit="contain"
          />
        </View>
      );
    }

    return (
      <View style={[styles.demoPageContent, { backgroundColor: demoData.bgColor }]}>
        <View style={styles.demoPageHeader}>
          <Text style={styles.demoPageBrand}>{demoData.brand}</Text>
          <Text style={styles.demoPageHeadline}>{demoData.headline}</Text>
        </View>
        <View style={styles.demoPageBody}>
          {demoData.specs.map((spec, i) => (
            <View key={i} style={styles.demoSpecRow}>
              <Text style={styles.demoSpecLabel}>{spec.label}</Text>
              <Text style={styles.demoSpecValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.demoPageFooter}>
          <Text style={styles.demoPageFooterText}>{demoData.footer}</Text>
        </View>
      </View>
    );
  }

  return (
    <PosterView
      poster={poster}
      car={car}
      overallNarration={car.narration}
    />
  );
}

function ReaderModeView({
  posters,
  car,
  currentPage,
  onPageChange,
}: {
  posters: PosterWithChildren[];
  car: any;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const flatListRef = useRef<FlatList<PosterWithChildren>>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) {
        onPageChangeRef.current(index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const goToPage = (page: number) => {
    if (page < 0 || page >= posters.length) return;
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
    onPageChange(page);
  };

  const handleScrollToIndexFailed = (info: {
    index: number;
    averageItemLength: number;
  }) => {
    flatListRef.current?.scrollToOffset({
      offset: info.averageItemLength * info.index,
      animated: false,
    });
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    });
  };

  return (
    <View style={styles.readerContainer}>
      <View
        style={styles.pageWrapper}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {containerWidth > 0 ? (
          <FlatList
            ref={flatListRef}
            data={posters}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            initialScrollIndex={currentPage}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            getItemLayout={(_, index) => ({
              length: containerWidth,
              offset: containerWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={[styles.pageSlide, { width: containerWidth }]}>
                <MagazinePage poster={item} car={car} />
              </View>
            )}
            style={styles.pageList}
          />
        ) : null}
      </View>

      <Text style={styles.swipeHint}>Swipe to browse pages</Text>

      <View style={styles.navigation}>
        <Pressable
          style={[styles.navBtn, currentPage === 0 && styles.navBtnDisabled]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <Text
            style={[styles.navBtnText, currentPage === 0 && styles.navBtnTextDisabled]}
          >
            ← Prev
          </Text>
        </Pressable>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageNumber}>
            {currentPage + 1} / {posters.length}
          </Text>
          <View style={styles.dots}>
            {posters.map((_, i) => (
              <Pressable key={i} onPress={() => goToPage(i)}>
                <View style={[styles.dot, i === currentPage && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[
            styles.navBtn,
            currentPage === posters.length - 1 && styles.navBtnDisabled,
          ]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage === posters.length - 1}
        >
          <Text
            style={[
              styles.navBtnText,
              currentPage === posters.length - 1 && styles.navBtnTextDisabled,
            ]}
          >
            Next →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function EditModeView({
  posters,
  car,
  currentPage,
  onPageSelect,
  onReorder,
  onDelete,
  onAddPage,
}: {
  posters: PosterWithChildren[];
  car: any;
  currentPage: number;
  onPageSelect: (page: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDelete: (posterId: string) => void;
  onAddPage: () => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => (e: any) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    }
  };

  const handleDragOver = (index: number) => (e: any) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (toIndex: number) => (e: any) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <ScrollView
      style={styles.editScroll}
      contentContainerStyle={styles.editScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.editHint}>
        Drag pages to reorder your magazine. Changes save automatically.
      </Text>

      {posters.map((poster, index) => (
        <View
          key={poster.id}
          // @ts-ignore - web-only drag props
          draggable={Platform.OS === "web"}
          onDragStart={Platform.OS === "web" ? handleDragStart(index) : undefined}
          onDragOver={Platform.OS === "web" ? handleDragOver(index) : undefined}
          onDragLeave={Platform.OS === "web" ? handleDragLeave : undefined}
          onDrop={Platform.OS === "web" ? handleDrop(index) : undefined}
          onDragEnd={Platform.OS === "web" ? handleDragEnd : undefined}
          style={[
            styles.editCard,
            index === currentPage && styles.editCardSelected,
            draggedIndex === index && styles.editCardDragging,
            dragOverIndex === index && styles.editCardDragOver,
          ]}
        >
          <View style={styles.editCardHeader}>
            <View style={styles.dragHandle}>
              <Text style={styles.dragHandleText}>⋮⋮</Text>
            </View>
            <Pressable
              style={styles.pageSelectBtn}
              onPress={() => onPageSelect(index)}
            >
              <Text style={styles.editCardNumber}>Page {index + 1}</Text>
              <Text style={styles.editCardFacet}>
                {poster.facet.charAt(0).toUpperCase() + poster.facet.slice(1)}
              </Text>
            </Pressable>

            <Pressable
              style={styles.deleteBtn}
              onPress={() => onDelete(poster.id)}
            >
              <Text style={styles.deleteBtnText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.editCardPreview}>
            {poster.id.startsWith("demo") ? (
              <DemoPagePreview posterId={poster.id} />
            ) : (
              <View style={styles.miniPoster}>
                <PosterView
                  poster={poster}
                  car={car}
                  overallNarration={car.narration}
                />
              </View>
            )}
          </View>
        </View>
      ))}

      <Pressable style={styles.addCardBtn} onPress={onAddPage}>
        <Text style={styles.addCardBtnText}>+ Add new page</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.heavy,
    fontSize: 24,
    textAlign: "center",
  },
  emptyBody: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  createBtn: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 16,
  },

  editToggle: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 15,
  },
  editToggleActive: {
    color: COLORS.red,
  },

  magazineHeader: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: 20,
  },
  magazineTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    letterSpacing: 1,
  },
  magazineSubtitle: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 4,
  },

  readerContainer: {
    flex: 1,
    gap: 20,
  },
  pageWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  pageList: {
    flex: 1,
  },
  pageSlide: {
    flex: 1,
    paddingHorizontal: 2,
  },
  swipeHint: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: "center",
    textTransform: "uppercase",
  },

  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  navBtnTextDisabled: {
    color: COLORS.dim,
  },
  pageIndicator: {
    alignItems: "center",
    gap: 8,
  },
  pageNumber: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.line,
  },
  dotActive: {
    backgroundColor: COLORS.red,
    width: 20,
  },

  editScroll: {
    flex: 1,
  },
  editScrollContent: {
    gap: 16,
    paddingBottom: 40,
  },
  editHint: {
    color: COLORS.dim,
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },

  editCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  editCardSelected: {
    borderColor: COLORS.red,
  },
  editCardDragging: {
    opacity: 0.5,
    transform: [{ scale: 0.98 }],
  },
  editCardDragOver: {
    borderColor: COLORS.muted,
    borderStyle: "dashed" as any,
  },
  dragHandle: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab" as any,
    marginRight: 8,
  },
  dragHandleText: {
    color: COLORS.muted,
    fontSize: 18,
    letterSpacing: 2,
  },
  editCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  pageSelectBtn: {
    flex: 1,
  },
  editCardNumber: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  editCardFacet: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  editCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  reorderBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  reorderBtnText: {
    color: COLORS.paper,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  reorderBtnTextDisabled: {
    color: COLORS.dim,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "rgba(207, 43, 43, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: COLORS.red,
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginTop: -2,
  },

  editCardPreview: {
    padding: 12,
  },
  editCardImage: {
    width: "100%",
    height: 200,
    borderRadius: 6,
  },
  miniPoster: {
    transform: [{ scale: 0.5 }],
    transformOrigin: "top left",
    width: "200%",
    height: 300,
    overflow: "hidden",
  },

  addCardBtn: {
    borderWidth: 2,
    borderColor: COLORS.line,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  addCardBtnText: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },

  demoPageContent: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    padding: 24,
    justifyContent: "space-between",
  },
  demoPageHeader: {
    gap: 8,
  },
  demoPageBrand: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 3,
  },
  demoPageHeadline: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 1,
  },
  demoPageBody: {
    gap: 12,
    paddingVertical: 20,
  },
  demoSpecRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 10,
  },
  demoSpecLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  demoSpecValue: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  demoPageFooter: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  demoPageFooterText: {
    color: COLORS.dim,
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 2,
  },

  // JDM Cover image styles
  demoCoverImageContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  demoCoverImage: {
    flex: 1,
    width: "100%",
    aspectRatio: 0.8,
  },
});
