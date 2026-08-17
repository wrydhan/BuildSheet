import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { COLORS, FONTS } from "@/lib/design";
import { Brand, Button, ErrorText, Field, Mono, Screen } from "@/components/ui";

type Mode = "sign-in" | "sign-up";

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={styles.center}>
      <View style={styles.head}>
        <Brand />
        <Mono>Document your build</Mono>
      </View>

      <Text style={styles.title}>
        {mode === "sign-in" ? "Welcome\nback" : "Get\nstarted"}
      </Text>

      <View style={styles.form}>
        <Field
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />
        <Field
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />

        <ErrorText>{error}</ErrorText>
        {notice ? <Text style={styles.notice}>» {notice}</Text> : null}

        <Button
          label={mode === "sign-in" ? "Sign in" : "Create account"}
          onPress={submit}
          busy={busy}
        />

        <Pressable
          onPress={() => {
            setError(null);
            setNotice(null);
            setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
          }}
          disabled={busy}
        >
          <Text style={styles.switch}>
            {mode === "sign-in" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, justifyContent: "center", gap: 22 },
  head: { gap: 8 },
  title: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 52,
    lineHeight: 50,
    letterSpacing: -1.5,
  },
  form: { gap: 14 },
  notice: { color: "#7ee787", fontFamily: FONTS.mono, fontSize: 13 },
  switch: { color: COLORS.red, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.5, marginTop: 4 },
});
