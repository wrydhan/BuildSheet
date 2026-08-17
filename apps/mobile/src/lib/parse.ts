import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invokeFunction } from "@/lib/functions";
import { carKeys } from "@/lib/cars";
import { entryKeys, type EntryInput, type EntryType } from "@/lib/entries";

/** The parse-build Edge Function response: extracted entries carrying a tmp_id. */
type ParsedEntry = EntryInput & { tmp_id: string };
type ParseResponse = { entries: ParsedEntry[] };

/**
 * Run the staged text pipeline for a car: saves `raw_text` server-side, then
 * segments + extracts, returning entries as an editable review draft. Nothing
 * is committed to `entries` here — the review screen does that after edits.
 */
export function useParseBuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      carId: string;
      rawText: string;
    }): Promise<EntryInput[]> => {
      const data = await invokeFunction<ParseResponse>("parse-build", {
        car_id: args.carId,
        raw_text: args.rawText,
      });

      const entries = (data?.entries ?? []).map(stripTmpId);
      queryClient.setQueryData(entryKeys.draft, entries);
      // raw_text now differs on the server; keep the cached car in sync.
      queryClient.invalidateQueries({ queryKey: carKeys.mine });
      return entries;
    },
  });
}

const VALID_TYPES: EntryType[] = ["mod", "service"];

function stripTmpId(entry: ParsedEntry): EntryInput {
  const type: EntryType = VALID_TYPES.includes(entry.type) ? entry.type : "mod";
  return {
    type,
    title: entry.title,
    category: entry.category ?? null,
    brand: entry.brand ?? null,
    cost: entry.cost ?? null,
    date: entry.date ?? null,
    mileage: entry.mileage ?? null,
    notes: entry.notes ?? null,
    reasoning: entry.reasoning ?? null,
  };
}
