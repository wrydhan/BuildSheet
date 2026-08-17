import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/**
 * Invoke an Edge Function and surface its REAL error. supabase-js collapses any
 * non-2xx into a generic "Edge Function returned a non-2xx status code"; the
 * actual `{ error }` JSON our functions return lives on `error.context` (the
 * Response). This unwraps it so the UI shows what actually went wrong.
 */
export async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json();
        if (payload?.error) throw new Error(String(payload.error));
      } catch (parseErr) {
        // If we already extracted a message, rethrow it; otherwise fall through.
        if (parseErr instanceof Error && parseErr.message) throw parseErr;
      }
    }
    throw error;
  }

  if (data == null) throw new Error(`${name}: no data returned.`);
  return data;
}
