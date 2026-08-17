import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth";
import { COLORS, FONT_ASSETS } from "@/lib/design";

const queryClient = new QueryClient();

function RootNavigator() {
  const { session } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Public landing page — shown when logged out, redirects to (app) when logged in */}
      <Stack.Screen name="index" />

      {/* Public auth screens */}
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />

      {/* Protected app routes — requires authentication */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      {/* Legacy auth group — keep for backwards compatibility */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Public routes — always accessible, no auth gate */}
      <Stack.Screen name="s/[slug]" />
      <Stack.Screen name="c/[slug]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={DarkTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
