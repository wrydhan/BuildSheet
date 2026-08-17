import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.example to apps/mobile/.env and fill in your project values.",
  );
}

const isWeb = Platform.OS === "web";

/**
 * Session persistence:
 *   - Web: let supabase-js use the browser's localStorage (default).
 *   - Native: AsyncStorage. This matches Supabase's official Expo guide.
 *
 * NOTE: We deliberately do NOT use expo-secure-store as the token store — its
 * ~2KB per-item limit is smaller than a Supabase session (access + refresh
 * JWT), which silently breaks persistence. If encrypted-at-rest tokens become a
 * requirement, upgrade to a chunked "LargeSecureStore" adapter (AES key in
 * SecureStore, ciphertext in AsyncStorage) rather than raw SecureStore.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWeb ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
  },
});
