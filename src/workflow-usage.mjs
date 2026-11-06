import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { digest } from "./model.mjs";

async function entries(root) {
  try {
    return await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return [];
    throw error;
  }
}

async function readRecord(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    // A TeamFlow record can disappear during archival or be unreadable.
    if (error.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

/** Reconcile durable TeamFlow starts when Gallery reads Workflow resources. */
export async function syncWorkflowUsage(ctx, store) {
  try {
    const adapter = store.adapter();
    const rows = adapter.read().resources.filter((row) => row.type === "workflow");
    if (!rows.length) return;
    const byResource = new Map(rows.map((row) => [row.id, row]));
    const templateRoot = process.env.DSH_TEAMFLOW_TEMPLATE_DIR ?? join(homedir(), ".dsh-teamflow", "templates");
    const byTemplate = new Map();
    for (const entry of await entries(templateRoot)) {
      if (!entry.isFile() || !/^[a-f0-9-]{36}\.json$/.test(entry.name)) continue;
      const record = await readRecord(join(templateRoot, entry.name));
      if (record?.id === entry.name.slice(0, -5) && byResource.has(record.gallerySource)) {
        byTemplate.set(record.id, byResource.get(record.gallerySource));
      }
    }
    if (!byTemplate.size) return;
    const registry = ctx.get("workspaceRegistry") ?? ctx.get("workspace");
    for (const path of new Set((registry?.list() ?? []).map((workspace) => workspace.path))) {
      const root = join(path, ".agent-teams");
      for (const directory of [root, join(root, "archive")]) {
        for (const entry of await entries(directory)) {
          if (!entry.isDirectory() || entry.name === "archive" || entry.name.startsWith(".")) continue;
          const team = await readRecord(join(directory, entry.name, "team.json"));
          if (team?.id !== entry.name || team.phase !== "running") continue;
          const row = byTemplate.get(team.workflow?.templateSource?.id);
          if (!row) continue;
          const usageId = digest(JSON.stringify(["workflow", "teamflow", path, team.id]));
          const eventId = digest(usageId);
          if (row.usageEventIds?.includes(eventId)) continue;
          adapter.recordResourceUse({ id: row.id, type: "workflow", usageId });
          (row.usageEventIds ??= []).push(eventId);
        }
      }
    }
  } catch (error) {
    ctx.logger?.warn?.(`Gallery Workflow usage could not be synced: ${error.message}`);
  }
}
