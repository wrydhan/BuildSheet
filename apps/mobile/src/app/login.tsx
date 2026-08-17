import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { COLORS, FONTS } from "@/lib/design";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.replace("/(app)");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      if (msg.toLowerCase().includes("fetch")) {
        setError("Network error — check your connection or try again later.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/")} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.head}>
            <Text style={styles.kicker}>WELCOME BACK</Text>
            <Text style={styles.title}>Sign in to{"\n"}your garage</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.dim}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!busy}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.dim}
                secureTextEntry
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
                editable={!busy}
              />
            </View>

            {error ? <Text style={styles.error}>! {error}</Text> : null}

            <Pressable
              style={[styles.button, (busy || !email || !password) && styles.buttonDisabled]}
              onPress={submit}
              disabled={busy}
            >
              <Text style={styles.buttonText}>
                {busy ? "Signing in..." : "Sign in"}
              </Text>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text style={styles.switchLink}>Create one</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  header: {
    paddingVertical: 16,
  },
  backText: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
    gap: 32,
  },
  head: {
    gap: 12,
  },
  kicker: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.5,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.paper,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  error: {
    color: COLORS.red,
    fontFamily: FONTS.mono,
    fontSize: 13,
  },
  button: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  switchText: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  switchLink: {
    color: COLORS.red,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
