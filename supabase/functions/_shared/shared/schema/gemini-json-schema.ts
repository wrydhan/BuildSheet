/**
 * Gemini (Google Generative Language API) response schemas for the two parsing
 * stages. Gemini uses an OpenAPI-3.0 schema subset that differs from OpenAI's:
 *   - types are UPPERCASE ("OBJECT", "STRING", "ARRAY", "NUMBER", "INTEGER")
 *   - optional fields use `nullable: true` (and stay in `required`, present-as-null)
 *   - no `additionalProperties`
 *
 * Kept in sync with the Zod schemas in `pipeline.ts`; the fixture tests validate
 * every response against Zod, so drift surfaces immediately.
 */

export type GeminiSchema = Record<string, unknown>;

export const GEMINI_SEGMENT_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          snippet: { type: "STRING" },
        },
        required: ["snippet"],
      },
    },
  },
  required: ["items"],
};

export const GEMINI_EXTRACT_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    entries: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tmp_id: { type: "STRING" },
          type: { type: "STRING", enum: ["mod", "service"] },
          title: { type: "STRING" },
          category: { type: "STRING", nullable: true },
          brand: { type: "STRING", nullable: true },
          cost: { type: "NUMBER", nullable: true },
          date: { type: "STRING", nullable: true },
          mileage: { type: "INTEGER", nullable: true },
          notes: { type: "STRING", nullable: true },
          reasoning: { type: "STRING", nullable: true },
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
        propertyOrdering: [
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

export const GEMINI_NARRATE_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    overall: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING" },
          narration: { type: "STRING" },
        },
        required: ["key", "narration"],
        propertyOrdering: ["key", "narration"],
      },
    },
  },
  required: ["overall", "items"],
};
