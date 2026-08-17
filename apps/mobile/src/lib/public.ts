import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Car } from "@/lib/cars";
import type { PosterWithChildren } from "@/lib/posters";

export type PublicCar = {
  car: Car;
  posters: PosterWithChildren[];
};

/**
 * Fetch a car's public magazine by its share slug. Requires no account: the
 * `*_public_read` RLS policies allow anyone to read a car (and its posters,
 * callouts, templates) only when `is_public = true`. A private or unknown slug
 * resolves to null — the hard privacy guarantee lives in the policies, not here.
 */
export function usePublicCar(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-car", slug],
    enabled: !!slug,
    queryFn: async (): Promise<PublicCar | null> => {
      const { data: car, error } = await supabase
        .from("cars")
        .select("*")
        .eq("share_slug", slug!)
        .eq("is_public", true)
        .maybeSingle();
      if (error) throw error;
      if (!car) return null;

      const { data: posters, error: postersErr } = await supabase
        .from("posters")
        .select("*, callouts(*), template:templates(*)")
        .eq("car_id", (car as Car).id)
        .order("display_order", { ascending: true });
      if (postersErr) throw postersErr;

      const rows = (posters ?? []) as PosterWithChildren[];
      for (const p of rows) {
        p.callouts.sort((a, b) => Number(a.slot ?? 0) - Number(b.slot ?? 0));
      }
      return { car: car as Car, posters: rows };
    },
  });
}
