import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { carKeys } from "@/lib/cars";

export type EntryType = "mod" | "service";

/** A row from `public.entries`. */
export type Entry = {
  id: string;
  car_id: string;
  type: EntryType;
  title: string;
  category: string | null;
  brand: string | null;
  cost: number | null;
  date: string | null;
  mileage: number | null;
  notes: string | null;
  reasoning: string | null;
  /** Generated documentary line (derived; separate from notes/reasoning). */
  narration: string | null;
  created_at: string;
};

/**
 * The editable shape used in the review step and when persisting. Mirrors the
 * parsing contract's ExtractedEntry minus `tmp_id` (which is only meaningful
 * inside a single parse run). This is intentionally duplicated from
 * @carstory/shared rather than imported: the mobile bundle stays free of the
 * server's zod/Deno-flavoured modules.
 */
export type EntryInput = {
  type: EntryType;
  title: string;
  category: string | null;
  brand: string | null;
  cost: number | null;
  date: string | null;
  mileage: number | null;
  notes: string | null;
  reasoning: string | null;
};

export const entryKeys = {
  forCar: (carId: string) => ["entries", carId] as const,
  /** In-memory review draft produced by a parse run, before it is committed. */
  draft: ["entries", "draft"] as const,
};

export function entryToInput(entry: Entry): EntryInput {
  return {
    type: entry.type,
    title: entry.title,
    category: entry.category,
    brand: entry.brand,
    cost: entry.cost,
    date: entry.date,
    mileage: entry.mileage,
    notes: entry.notes,
    reasoning: entry.reasoning,
  };
}

/** The car's committed entries, in insertion order. */
export function useEntries(carId: string | undefined) {
  return useQuery({
    queryKey: carId ? entryKeys.forCar(carId) : ["entries", "none"],
    enabled: !!carId,
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("car_id", carId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as Entry[]) ?? [];
    },
  });
}

/**
 * Commit the reviewed entry set for a car. v1 uses replace semantics: the
 * reviewed list becomes the car's entries in full. Delete-then-insert is not a
 * single transaction over the REST API, but for a one-car, tens-of-entries v1
 * that is an acceptable trade; the insert failing after the delete would only
 * cost the parse, which is re-runnable from the untouched `raw_text`.
 */
export function useReplaceEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { carId: string; entries: EntryInput[] }) => {
      const { carId, entries } = args;

      const del = await supabase.from("entries").delete().eq("car_id", carId);
      if (del.error) throw del.error;

      if (entries.length > 0) {
        const rows = entries.map((e) => ({ ...e, car_id: carId }));
        const ins = await supabase.from("entries").insert(rows);
        if (ins.error) throw ins.error;
      }
    },
    onSuccess: (_data, { carId }) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.forCar(carId) });
      queryClient.invalidateQueries({ queryKey: carKeys.mine });
      queryClient.removeQueries({ queryKey: entryKeys.draft });
    },
  });
}
