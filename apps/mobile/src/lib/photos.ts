import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Poster image layer (build spec §6 step 6). Photos are optional — a poster with
 * no image is valid (graceful degradation). Uploads go to the PUBLIC `posters`
 * bucket under `{car_id}/…`, so the returned URL works both in-app and on the
 * auth-less public share page without signed URLs. Ownership is enforced by the
 * storage policy (20260707000001) matching the path's car_id to the caller.
 */

const BUCKET = "posters";

/** Path-unique enough id (not security-sensitive; the path is owner-scoped). */
function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function extAndType(uri: string, mime?: string | null): { ext: string; contentType: string } {
  if (mime?.includes("png")) return { ext: "png", contentType: "image/png" };
  if (mime?.includes("webp")) return { ext: "webp", contentType: "image/webp" };
  if (mime?.includes("heic")) return { ext: "heic", contentType: "image/heic" };
  const m = uri.split("?")[0].match(/\.(\w+)$/);
  const ext = (m?.[1] ?? "jpg").toLowerCase();
  return { ext, contentType: mime ?? `image/${ext === "jpg" ? "jpeg" : ext}` };
}

/** Prompt for library permission and let the user pick one image. */
export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Photo library permission is required to add a photo.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.9,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

/** Upload a picked asset and return its public URL. */
export async function uploadPosterPhoto(
  carId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string> {
  const { ext, contentType } = extAndType(asset.uri, asset.mimeType);
  const path = `${carId}/${randomId()}.${ext}`;

  // RN 0.72+ can read a local file uri as an ArrayBuffer via fetch. (If a future
  // RN version regresses this, switch to expo-file-system base64 + decode.)
  const arrayBuffer = await fetch(asset.uri).then((r) => r.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: false });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Pick + upload in one step; resolves to the public URL, or null if cancelled. */
export function useUploadPosterPhoto() {
  return useMutation({
    mutationFn: async (carId: string): Promise<string | null> => {
      const asset = await pickImage();
      if (!asset) return null;
      return uploadPosterPhoto(carId, asset);
    },
  });
}
