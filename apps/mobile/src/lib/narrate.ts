import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invokeFunction } from "@/lib/functions";
import { carKeys, type Tone } from "@/lib/cars";
import { entryKeys } from "@/lib/entries";

type NarrateResponse = {
  overall: string;
  tone: Tone;
  entries: Array<{ id: string; narration: string | null }>;
};

/**
 * Generate (or re-roll) the documentary narration for a car at a given tone.
 * The server persists narration into its own fields, so on success we just
 * refetch the car and its entries. Nothing the user wrote is touched.
 */
export function useNarrate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      carId: string;
      tone: Tone;
    }): Promise<NarrateResponse> => {
      return invokeFunction<NarrateResponse>("narrate", {
        car_id: args.carId,
        tone: args.tone,
      });
    },
    onSuccess: (_data, { carId }) => {
      queryClient.invalidateQueries({ queryKey: carKeys.mine });
      queryClient.invalidateQueries({ queryKey: entryKeys.forCar(carId) });
    },
  });
}
