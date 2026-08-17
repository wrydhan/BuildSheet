/**
 * OpenAI Structured Outputs JSON schemas for the two parsing stages.
 *
 * These MUST stay in sync with the Zod schemas in `pipeline.ts`. The fixture
 * tests validate every model response against the Zod schema, so any drift
 * surfaces immediately as a test failure.
 *
 * Strict-mode requirements (enforced by OpenAI):
 *   - every property listed in `required`
 *   - `additionalProperties: false` on every object
 *   - optional fields expressed as nullable unions, e.g. `["string", "null"]`
 */

export type JSONSchema = Record<string, unknown>;

export const SEGMENT_JSON_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      description: "One entry per distinct mod or service found in the text.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          snippet: {
            type: "string",
            description:
              "The user's own words describing this single item, copied as closely as possible.",
          },
        },
        required: ["snippet"],
      },
    },
  },
  required: ["items"],
};

export const EXTRACT_JSON_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tmp_id: {
            type: "string",
            description: "Echo the tmp_id of the input item this entry came from.",
          },
          type: {
            type: "string",
            enum: ["mod", "service"],
            description:
              "'mod' for a modification/upgrade, 'service' for maintenance/repair.",
          },
          title: {
            type: "string",
            description: "Short human title, e.g. 'Coilover suspension' or 'Oil change'.",
          },
          category: {
            type: ["string", "null"],
            description:
              "Broad grouping, e.g. 'suspension', 'engine', 'wheels', 'maintenance'. Null if unclear.",
          },
          brand: {
            type: ["string", "null"],
            description: "Manufacturer/brand if stated (e.g. 'BC Racing', 'Mobil 1'). Null otherwise.",
          },
          cost: {
            type: ["number", "null"],
            description: "Numeric cost if the user stated one. Null otherwise. Do NOT guess.",
          },
          date: {
            type: ["string", "null"],
            description:
              "Date/time as stated by the user, kept as-is (e.g. '2023', 'last spring'). Null if none.",
          },
          mileage: {
            type: ["number", "null"],
            description: "Odometer mileage if stated. Null otherwise. Do NOT guess.",
          },
          notes: {
            type: ["string", "null"],
            description:
              "Factual details NOT already captured by another field (specs, part numbers, fitment). Null if none.",
          },
          reasoning: {
            type: ["string", "null"],
            description:
              "The WHY: purpose, goals, alternatives rejected, the story. Null if the user gave no reasoning.",
          },
        },
        required: [
          "tmp_id",
          "type",
          "title",
          "category",
          "brand",
          "cost",
          "date",
          "mileage",
          "notes",
          "reasoning",
        ],
      },
    },
  },
  required: ["entries"],
};

export const NARRATE_JSON_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall: {
      type: "string",
      description:
        "Documentary narration for the whole build. May be empty string if there is nothing to say.",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: {
            type: "string",
            description: "Echo the key of the entry this narration is for.",
          },
          narration: {
            type: "string",
            description:
              "Documentary line for this entry. Short for routine items; never invents specs/claims not in the entry.",
          },
        },
        required: ["key", "narration"],
      },
    },
  },
  required: ["overall", "items"],
};

/** Build the `response_format` block for a Chat Completions call. */
export function jsonSchemaResponseFormat(name: string, schema: JSONSchema) {
  return {
    type: "json_schema" as const,
    json_schema: { name, strict: true, schema },
  };
}
