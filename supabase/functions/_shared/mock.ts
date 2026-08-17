import type { StructuredCallOptions } from "./llm.ts";

/**
 * A keyless, deterministic stand-in for a real structured LLM. Enabled with
 * `LLM_PROVIDER=mock` so the full app (parse → review → narrate → posters) can
 * be exercised end-to-end without any API key or spend.
 *
 * It is intentionally dumb: it derives schema-valid output from the SAME prompt
 * text a real model would see, so results reflect the user's actual input rather
 * than fixed fixtures. Output still passes the Zod schemas in `pipeline.ts` (the
 * run* functions parse it), so swapping back to a real provider is a no-op.
 *
 * This is a test aid, NOT a fallback: it only runs when explicitly selected.
 */

/** Pull the raw build text from the segment prompt (between triple quotes). */
function extractQuoted(user: string): string {
  const m = user.match(/"""\s*([\s\S]*?)\s*"""/);
  return (m?.[1] ?? user).trim();
}

/** Parse the first top-level JSON array embedded in a prompt string. */
function firstJsonArray<T>(user: string): T[] {
  const start = user.indexOf("[");
  const end = user.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    return JSON.parse(user.slice(start, end + 1)) as T[];
  } catch {
    return [];
  }
}

const SERVICE_RE =
  /(oil|brake|fluid|filter|coolant|spark plug|timing belt|water pump|rotat|align|tune[- ]?up|\bservice\b|clutch|flush)/i;

function splitSnippets(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?:[.!?\n]+|,| and | plus )/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)
    .slice(0, 12);
}

function titleFrom(snippet: string): string {
  const cleaned = snippet.replace(/^(i |we |just |also |then |got |threw on |added |put in )/i, "").trim();
  const short = cleaned.split(/\s+/).slice(0, 6).join(" ");
  return short.length ? short.charAt(0).toUpperCase() + short.slice(1) : snippet.slice(0, 40);
}

function reasoningFrom(snippet: string): string | null {
  const m = snippet.match(/\b(because|since|so that|wanted|in order to)\b[\s\S]*/i);
  return m ? m[0].trim() : null;
}

function categoryFrom(snippet: string): string | null {
  const s = snippet.toLowerCase();
  if (/(turbo|intake|exhaust|engine|tune|intercooler|downpipe)/.test(s)) return "engine";
  if (/(coilover|spring|sway|suspension|damper)/.test(s)) return "suspension";
  if (/(brake|caliper|rotor|\bpad)/.test(s)) return "brakes";
  if (/(wheel|tire|tyre|rim)/.test(s)) return "wheels";
  if (/(seat|interior|shifter|dash|audio)/.test(s)) return "interior";
  if (/(paint|wrap|body|spoiler|bumper)/.test(s)) return "exterior";
  if (SERVICE_RE.test(s)) return "maintenance";
  return null;
}

function mockSegment(user: string) {
  return { items: splitSnippets(extractQuoted(user)).map((snippet) => ({ snippet })) };
}

function mockExtract(user: string) {
  const items = firstJsonArray<{ tmp_id: string; snippet: string }>(user);
  const entries = items.map((it) => {
    const snippet = it.snippet ?? "";
    const isService = SERVICE_RE.test(snippet);
    return {
      tmp_id: it.tmp_id,
      type: isService ? "service" : "mod",
      title: titleFrom(snippet) || (isService ? "Service" : "Mod"),
      category: categoryFrom(snippet),
      brand: null,
      cost: null,
      date: null,
      mileage: null,
      notes: null,
      reasoning: reasoningFrom(snippet),
    };
  });
  return { entries };
}

function mockNarrate(user: string) {
  const entries = firstJsonArray<{
    key: string;
    title: string;
    reasoning: string | null;
    notes: string | null;
  }>(user);
  const items = entries.map((e) => {
    const why = e.reasoning ? ` ${e.reasoning}` : e.notes ? ` ${e.notes}` : "";
    return { key: e.key, narration: `${e.title}.${why}`.trim() + " [sample narration]" };
  });
  const overall = entries.length
    ? `A build told through ${entries.length} change${entries.length === 1 ? "" : "s"} — the what, and the why. [sample narration; set a real LLM key for the good stuff.]`
    : "The story is just getting started. [sample narration]";
  return { overall, items };
}

export const callMockStructured = <T>(opts: StructuredCallOptions): Promise<T> => {
  let result: unknown;
  switch (opts.schemaName) {
    case "segment":
      result = mockSegment(opts.user);
      break;
    case "extract":
      result = mockExtract(opts.user);
      break;
    case "narrate":
      result = mockNarrate(opts.user);
      break;
    default:
      throw new Error(`mock LLM: no stub for schema "${opts.schemaName}"`);
  }
  return Promise.resolve(result as T);
};
