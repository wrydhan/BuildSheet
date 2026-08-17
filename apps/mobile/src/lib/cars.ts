import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/** The narration tone dial (matches the check constraint on cars.tone). */
export const TONES = ["straight", "enthusiast", "full_documentary"] as const;
export type Tone = (typeof TONES)[number];

/**
 * A row from `public.cars`. Mirrors the schema in
 * supabase/migrations/20260701000001_init_tables.sql. `raw_text` is the user's
 * verbatim freeform paragraph (source of truth) and is captured/edited in the
 * build-text flow, not the identity form below.
 */
export type Car = {
  id: string;
  user_id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  nickname: string | null;
  color: string | null;
  mileage: number | null;
  raw_text: string;
  is_public: boolean;
  share_slug: string;
  /** Narration tone dial. */
  tone: Tone;
  /** Overall documentary narration (derived; null until generated). */
  narration: string | null;
  created_at: string;
};

/** The structured identity fields the add/edit-car form writes. */
export type CarIdentityInput = {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  nickname: string | null;
  color: string | null;
  mileage: number | null;
};

export const carKeys = {
  mine: ["car", "mine"] as const,
};

/** A human headline for a car from whatever identity fields exist. */
export function carTitle(car: Car): string {
  if (car.nickname) return car.nickname;
  const built = [car.year, car.make, car.model, car.trim].filter(Boolean).join(" ").trim();
  return built || "Your car";
}

/** The secondary line: the full make/model/trim when a nickname is the headline. */
export function carSubtitle(car: Car): string | null {
  if (!car.nickname) return null;
  const built = [car.year, car.make, car.model, car.trim]
    .filter(Boolean)
    .join(" ")
    .trim();
  return built || null;
}

/**
 * The current user's single car (v1 is one-car-per-account). Returns `null` when
 * they have not created one yet. RLS scopes this to the owner, but we also filter
 * by user_id so an accidental future policy change can't leak another car.
 */
export function useCar() {
  return useQuery({
    queryKey: carKeys.mine,
    queryFn: async (): Promise<Car | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as Car | null) ?? null;
    },
  });
}

/**
 * Create the user's car if they have none, otherwise update the existing row.
 * `share_slug` and `is_public` are left to their DB defaults on insert and never
 * touched here — the privacy toggle and share link are managed elsewhere.
 */
export function useUpsertCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CarIdentityInput): Promise<Car> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in.");

      const existing = await supabase
        .from("cars")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (existing.error) throw existing.error;

      if (existing.data) {
        const { data, error } = await supabase
          .from("cars")
          .update(input)
          .eq("id", (existing.data as { id: string }).id)
          .select("*")
          .single();
        if (error) throw error;
        return data as Car;
      }

      const { data, error } = await supabase
        .from("cars")
        .insert({ ...input, user_id: userId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Car;
    },
    onSuccess: (car) => {
      queryClient.setQueryData(carKeys.mine, car);
    },
  });
}

/** The public base URL used to build share links (the deployed web app). */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://carstory.app";

/** The public, shareable URL for a car (never uses a sequential id). */
export function shareUrl(slug: string): string {
  return `${WEB_URL.replace(/\/$/, "")}/c/${slug}`;
}

/** Toggle a car's public/private state (the per-car privacy switch). */
export function useSetCarPublic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { carId: string; isPublic: boolean }): Promise<Car> => {
      const { data, error } = await supabase
        .from("cars")
        .update({ is_public: args.isPublic })
        .eq("id", args.carId)
        .select("*")
        .single();
      if (error) throw error;
      return data as Car;
    },
    onSuccess: (car) => {
      queryClient.setQueryData(carKeys.mine, car);
    },
  });
}
