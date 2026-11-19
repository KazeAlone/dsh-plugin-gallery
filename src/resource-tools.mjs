import { defineTool } from "@deepseek-ai/dsh-tools";
import { TYPES } from "./model.mjs";

const resource = {
  type: "object",
  additionalProperties: false,
  required: true,
  description:
    "Editable resource object. Call gallery_resource_schema for a complete example of the chosen type. Never JSON.stringify this object.",
  properties: {
    type: { type: "string", enum: TYPES, required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    files: {
      type: "array",
      required: true,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          path: { type: "string", required: true },
          encoding: { type: "string", enum: ["utf8", "base64"] },
          content: { type: "string", required: true },
        },
      },
    },
    metadata: { type: "object", properties: {}, additionalProperties: true },
    references: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", required: true },
          libraryId: { type: "string", enum: ["local", "center"] },
          digest: { type: "string" },
        },
      },
    },
    mcpCredentials: {
      type: "object",
      properties: {},
      additionalProperties: true,
      description:
        "Write-only MCP authentication values keyed by metadata.mcp.credentialKeys. Never put secrets in files, metadata, or descriptions. For Authorization send the full header value including Bearer prefix. Omit on update to preserve saved values.",
    },
  },
};
const libraryId = {
  type: "string",
  enum: ["local", "center"],
  required: true,
  description:
    "Exact target library. local = this DSH; center = shared server. Get current selection from gallery_resource_schema. Never silently switch targets.",
};
const id = {
  type: "string",
  required: true,
  description: "Exact resource id returned by list/get/create.",
};
const expectedRevision = {
  type: "integer",
  required: true,
  description:
    "Revision from a fresh gallery_resource_get. On conflict read again; never guess or automatically overwrite.",
};
const definitions = [
  [
    "schema",
    "Get the format and complete editable example for Skill, Agent, MCP, or Workflow, plus the current library. Start here when asked to create/save a Gallery resource.",
    { type: { type: "string", enum: TYPES, required: true } },
  ],
  [
    "list",
    "Find Gallery resources of any of the four types, including Workflow. Returns summaries, ids, revisions, permissions and pagination; does not load or execute resources.",
    {
      libraryId,
      type: { type: "string", enum: TYPES },
      q: { type: "string" },
      limit: { type: "integer", description: "1–100, default 24." },
      offset: { type: "integer" },
      sort: { type: "string", enum: ["updated", "usage"] },
    },
  ],
  [
    "get",
    "Read a complete Gallery resource before editing, including files, metadata, permissions, revision and write-only credential field names. Does not return saved MCP credential values or execute content.",
    { id, libraryId },
  ],
  [
    "validate",
    "Validate a resource before saving; returns valid/ issues and a normalized resource without secrets. Does NOT persist, execute scripts, connect to MCP, or register/run Workflow. For an update provide id and expectedRevision.",
    {
      resource,
      libraryId,
      id: { type: "string", description: id.description },
      expectedRevision: {
        type: "integer",
        description: expectedRevision.description,
      },
    },
  ],
  [
    "create",
    "CREATE AND SAVE one new Skill, Agent, MCP, or Workflow in Gallery when requested by the user. Use schema then validate. Returns saved:true, id, libraryId and revision only AFTER persistence. MCP saving refreshes connections (stdio may start a process). Do not automatically retry after an unknown outcome; list/get to verify. Do not write resources.json directly.",
    { resource, libraryId },
  ],
  [
    "update",
    "SAVE CHANGES to an existing Gallery resource requested by the user. First get, preserve all unchanged files/metadata/references, then validate; resource replaces editable content, not a partial patch. Requires original type, ownership and a fresh expectedRevision. MCP saving refreshes connections. Success returns saved:true and the new revision.",
    { id, resource, libraryId, expectedRevision },
  ],
  [
    "delete",
    "DELETE a Gallery resource only when explicitly requested by the user. First get to confirm identity, permission, target library and revision. Deletion cannot be undone. This does not delete Skill runtime snapshots or remote source files.",
    { id, libraryId, expectedRevision },
  ],
];
export const MANAGEMENT_TOOLS = definitions.map(
  ([action]) => `gallery_resource_${action}`,
);
export function registerResourceTools(ctx, service) {
  const disposers = [];
  try {
    for (const [action, description, parameters] of definitions)
      disposers.push(
        ctx.tools.register(
          defineTool({
            name: `gallery_resource_${action}`,
            description,
            parameters,
            output: {
              schema: { type: "json" },
              render: (_args, value) => [
                { type: "text", text: JSON.stringify(value) },
              ],
            },
            execute: (args, exec) => service[action](args, exec),
          }),
        ),
      );
  } catch (error) {
    for (const stop of disposers.reverse()) stop();
    throw error;
  }
  return () => {
    for (const stop of disposers.reverse()) stop();
  };
}
