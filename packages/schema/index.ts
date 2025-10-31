// schemas/openintent.schema.ts
import { z } from "zod";

/** Common primitives */
export const OIVersion = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "semver required");
export const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "ISO8601 UTC required");

/** Field types supported by initial OpenIntent spec */
export const FieldType = z.enum([
  "string","text","integer","bigint","float","decimal","boolean",
  "datetime","date","time","uuid","json","enum","array","bytes"
]);
export type FieldType = z.infer<typeof FieldType>;

export const FieldSpec = z.object({
  name: z.string().min(1),
  type: FieldType,
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  default: z.any().optional(),
  max_length: z.number().int().positive().optional(),
  array_type: z.enum(["string","text","integer","bigint","float","decimal","boolean","uuid"]).optional(),
  enum_values: z.array(z.string()).optional()
}).refine(
  (data) => {
    // If type is "array", array_type must be specified
    if (data.type === "array" && !data.array_type) {
      return false;
    }
    // If type is not "array", array_type should not be specified
    if (data.type !== "array" && data.array_type) {
      return false;
    }
    // If type is "enum", enum_values must be specified
    if (data.type === "enum" && (!data.enum_values || data.enum_values.length === 0)) {
      return false;
    }
    // If type is not "enum", enum_values should not be specified
    if (data.type !== "enum" && data.enum_values) {
      return false;
    }
    return true;
  },
  {
    message: "array_type is required when type is 'array', and enum_values is required when type is 'enum'"
  }
);
export type FieldSpec = z.infer<typeof FieldSpec>;

/** Provenance block (optional but recommended) */
export const Provenance = z.object({
  created_by: z.object({
    type: z.enum(["human","agent","system"]).default("human"),
    name: z.string().optional(),
    id: z.string().optional()
  }).optional(),
  created_at: ISODate.optional(),
  source: z.string().optional(),        // e.g., "builder-ui", "api"
  model: z.string().optional()          // e.g., model name if generated
}).strict();

/** ---- Intent Kinds ---- */
export const Intent_AddEntity = z.object({
  kind: z.literal("add_entity"),
  scope: z.literal("data"),
  entity: z.string().min(1),
  fields: z.array(FieldSpec).min(1)
}).strict();

export const Intent_AddField = z.object({
  kind: z.literal("add_field"),
  scope: z.literal("data"),
  entity: z.string().min(1),
  fields: z.array(FieldSpec).min(1)
}).strict();

export const Intent_AddEndpoint = z.object({
  kind: z.literal("add_endpoint"),
  scope: z.literal("api"),
  method: z.enum(["GET","POST","PATCH","DELETE"]),
  path: z.string().regex(/^\//, "must start with '/'"),
  entity: z.string().optional(),        // hint for scaffolding
  fields: z.array(FieldSpec).optional(),
  auth: z.object({
    required: z.boolean().default(false),
    roles: z.array(z.string()).optional()
  }).optional()
}).strict();

export const Intent_AddComponent = z.object({
  kind: z.literal("add_component"),
  scope: z.literal("ui"),
  component: z.string().min(1),         // file/component name (no extension)
  template: z.enum(["List","Form","Custom"]).default("Custom"),
  entity: z.string().optional(),
  display_fields: z.array(z.string()).optional(),
  route: z.string().optional()          // optional page route
}).strict();

/** Future extension slot: vendor or project-specific intents under namespaced key */
export const Intent_Extension = z.object({
  kind: z.string().regex(/^x-[a-z0-9_.-]+$/),
  scope: z.string(),
  payload: z.record(z.any())
}).strict();

export const Intent = z.union([
  Intent_AddEntity,
  Intent_AddField,
  Intent_AddEndpoint,
  Intent_AddComponent,
  Intent_Extension
]);

/** Top-level document */
export const IntentDoc = z.object({
  version: OIVersion,
  provenance: Provenance.optional(),
  intents: z.array(Intent).min(1)
}).strict();

/** Helper types */
export type Intent_AddEntity = z.infer<typeof Intent_AddEntity>;
export type Intent_AddField = z.infer<typeof Intent_AddField>;
export type Intent_AddEndpoint = z.infer<typeof Intent_AddEndpoint>;
export type Intent_AddComponent = z.infer<typeof Intent_AddComponent>;
export type IntentDoc = z.infer<typeof IntentDoc>;

