import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { COLORS, FONTS } from "@/lib/design";

/* ------------------------------------------------------------------ */
/* Screen — dark canvas with optional accent frame and header */
/* ------------------------------------------------------------------ */

type ScreenProps = {
  children: ReactNode;
  /** Page title shown in the header (Archivo black, uppercased). */
  title?: string;
  /** Small mono code shown at the header's right (e.g. a serial). */
  serial?: string;
  /** Show the Buildsheet brand mark instead of a title. */
  brand?: boolean;
  /** Render a back chevron that pops the stack. */
  back?: boolean;
  /** Navigate to a specific route instead of going back in history. */
  backTo?: string;
  /** Wrap children in a ScrollView (default true). */
  scroll?: boolean;
  /** Custom content for the header's right side. */
  headerRight?: ReactNode;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  title,
  serial,
  brand,
  back,
  backTo,
  scroll = true,
  headerRight,
  contentStyle,
}: ScreenProps) {
  const router = useRouter();
  const hasHeader = !!title || brand || back;

  const handleBack = () => {
    if (backTo) {
      router.replace(backTo as any);
    } else {
      router.back();
    }
  };

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.frame}>
      <View style={styles.inner}>
        <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
          {hasHeader ? (
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {back ? (
                  <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
                    <Text style={styles.chevronLeft}>‹</Text>
                  </Pressable>
                ) : null}
                {brand ? <Brand /> : null}
                {title ? <Text style={styles.headerTitle}>{title.toUpperCase()}</Text> : null}
              </View>
              <View style={styles.headerRight}>
                {serial ? <Text style={styles.headerSerial}>{serial}</Text> : null}
                {headerRight}
              </View>
            </View>
          ) : null}
          {body}
        </SafeAreaView>
      </View>
    </View>
  );
}

/** The red-square logo mark + wordmark. */
export function Brand({ small }: { small?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, small && styles.brandMarkSm]}>
        <Text style={[styles.brandMarkText, small && styles.brandMarkTextSm]}>B</Text>
      </View>
      <Text style={[styles.brandWord, small && styles.brandWordSm]}>BUILDSHEET</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Type                                                                 */
/* ------------------------------------------------------------------ */

export function Heading({ children, size = 34 }: { children: ReactNode; size?: number }) {
  return <Text style={[styles.heading, { fontSize: size, lineHeight: size }]}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Mono({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <Text style={[styles.mono, dim && { color: COLORS.dim }]}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                             */
/* ------------------------------------------------------------------ */

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */

type ButtonProps = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
};

export function Button({ label, onPress, busy, disabled, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      style={[
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        (busy || disabled) && styles.btnDisabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={isPrimary ? "#fff" : COLORS.paper} />
      ) : (
        <>
          <Text style={[styles.btnText, !isPrimary && styles.btnTextGhost]}>
            {label.toUpperCase()}
          </Text>
          <Text style={[styles.btnChevron, !isPrimary && styles.btnTextGhost]}>▸</Text>
        </>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                               */
/* ------------------------------------------------------------------ */

type FieldProps = TextInputProps & { label?: string };

export function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text> : null}
      <TextInput
        style={[styles.input, props.multiline && styles.inputMultiline, style]}
        placeholderTextColor={COLORS.dim}
        {...props}
      />
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <Text style={styles.error}>! {children}</Text> : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  frame: { flex: 1, backgroundColor: COLORS.red },
  inner: { flex: 1, backgroundColor: COLORS.bg, margin: 5, borderRadius: 4, overflow: "hidden" },
  content: { padding: 18, gap: 14, paddingBottom: 36 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  backBtn: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  chevronLeft: { color: COLORS.paper, fontSize: 30, fontFamily: FONTS.display, marginTop: -4 },
  headerTitle: { color: COLORS.paper, fontFamily: FONTS.display, fontSize: 18, letterSpacing: -0.3 },
  headerSerial: { color: COLORS.dim, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 30, height: 30, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center", borderRadius: 3 },
  brandMarkSm: { width: 22, height: 22 },
  brandMarkText: { color: "#fff", fontSize: 16, fontFamily: FONTS.display, marginTop: -1 },
  brandMarkTextSm: { fontSize: 12 },
  brandWord: { color: COLORS.paper, fontFamily: FONTS.display, fontSize: 20, letterSpacing: 0.5 },
  brandWordSm: { fontSize: 15 },

  heading: { color: COLORS.paper, fontFamily: FONTS.display, letterSpacing: -1 },
  label: { color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.2 },
  mono: { color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.4, lineHeight: 18 },
  body: { color: COLORS.paper, fontFamily: FONTS.body, fontSize: 15, lineHeight: 22 },

  panel: {
    backgroundColor: COLORS.bgElevated,
    borderColor: COLORS.line,
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    gap: 8,
  },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 2 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  btnPrimary: { backgroundColor: COLORS.red },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.line },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontFamily: FONTS.heavy, fontSize: 14, letterSpacing: 1 },
  btnTextGhost: { color: COLORS.paper },
  btnChevron: { color: "#fff", fontFamily: FONTS.display, fontSize: 13 },

  field: { gap: 6 },
  fieldLabel: { color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.2 },
  input: {
    backgroundColor: COLORS.bgInput,
    borderColor: COLORS.line,
    borderWidth: 1,
    borderRadius: 4,
    color: COLORS.paper,
    fontFamily: FONTS.body,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputMultiline: { minHeight: 60, paddingTop: 12, textAlignVertical: "top" },
  error: { color: COLORS.red, fontFamily: FONTS.mono, fontSize: 13, letterSpacing: 0.3 },
});
