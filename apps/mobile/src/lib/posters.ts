import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { invokeFunction } from "@/lib/functions";
import type { Facet } from "@/lib/facets";
import type { Template } from "@/lib/templates";

export type ImageSource = "upload" | "stock" | "generated";

export type Callout = {
  id: string;
  poster_id: string;
  entry_id: string | null;
  label: string | null;
  narration: string | null;
  slot: string | null;
  kind: "entry" | "info";
  created_at: string;
};

export type Poster = {
  id: string;
  car_id: string;
  template_id: string | null;
  facet: string;
  image_url: string | null;
  image_source: ImageSource | null;
  display_order: number;
  created_at: string;
};

/** A poster with its callouts and resolved template, for rendering. */
export type PosterWithChildren = Poster & {
  callouts: Callout[];
  template: Template | null;
};

export const posterKeys = {
  forCar: (carId: string) => ["posters", carId] as const,
  one: (posterId: string) => ["poster", posterId] as const,
};

/** All of a car's posters (magazine order), each with callouts + template. */
export function usePosters(carId: string | undefined) {
  return useQuery({
    queryKey: carId ? posterKeys.forCar(carId) : ["posters", "none"],
    enabled: !!carId,
    queryFn: async (): Promise<PosterWithChildren[]> => {
      const { data, error } = await supabase
        .from("posters")
        .select("*, callouts(*), template:templates(*)")
        .eq("car_id", carId!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as PosterWithChildren[];
      // Keep callouts in slot order for stable rendering.
      for (const p of rows) {
        p.callouts.sort((a, b) => Number(a.slot ?? 0) - Number(b.slot ?? 0));
      }
      return rows;
    },
  });
}

/** Compose (or replace) a poster for a chosen facet via the Edge Function. */
export function useComposePoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      carId: string;
      facet: Facet;
      stylePreference?: string | null;
      imageUrl?: string | null;
    }): Promise<PosterWithChildren> => {
      const data = await invokeFunction<{
        poster: Poster;
        callouts: Callout[];
        template: Template | null;
      }>("compose-poster", {
        car_id: args.carId,
        facet: args.facet,
        style_preference: args.stylePreference ?? null,
        image_url: args.imageUrl ?? null,
      });
      return { ...data.poster, callouts: data.callouts, template: data.template };
    },
    onSuccess: (_poster, { carId }) => {
      queryClient.invalidateQueries({ queryKey: posterKeys.forCar(carId) });
    },
  });
}

export function useDeletePoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { carId: string; posterId: string }) => {
      const { error } = await supabase
        .from("posters")
        .delete()
        .eq("id", args.posterId);
      if (error) throw error;
    },
    onSuccess: (_data, { carId }) => {
      queryClient.invalidateQueries({ queryKey: posterKeys.forCar(carId) });
    },
  });
}

/** Reorder posters by updating their display_order values. */
export function useReorderPosters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { carId: string; posterIds: string[] }) => {
      const updates = args.posterIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("posters")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onMutate: async ({ carId, posterIds }) => {
      await queryClient.cancelQueries({ queryKey: posterKeys.forCar(carId) });

      const previous = queryClient.getQueryData<PosterWithChildren[]>(
        posterKeys.forCar(carId)
      );

      if (previous) {
        const reordered = posterIds
          .map((id) => previous.find((p) => p.id === id))
          .filter(Boolean) as PosterWithChildren[];
        queryClient.setQueryData(posterKeys.forCar(carId), reordered);
      }

      return { previous, carId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          posterKeys.forCar(context.carId),
          context.previous
        );
      }
    },
    onSettled: (_data, _error, { carId }) => {
      queryClient.invalidateQueries({ queryKey: posterKeys.forCar(carId) });
    },
  });
}
