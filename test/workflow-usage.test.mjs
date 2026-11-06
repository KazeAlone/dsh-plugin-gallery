import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalGalleryStore } from "../src/local-store.mjs";
import { syncWorkflowUsage } from "../src/workflow-usage.mjs";

test("Workflow usage counts started TeamFlow instances once across archival and reload", async () => {
  const root = await mkdtemp(join(tmpdir(), "gallery-workflow-usage-"));
  const previous = process.env.DSH_TEAMFLOW_TEMPLATE_DIR;
  try {
    const templates = join(root, "templates");
    process.env.DSH_TEAMFLOW_TEMPLATE_DIR = templates;
    const file = join(root, "gallery.json");
    const adapter = new LocalGalleryStore(file);
    const resource = adapter.createResource({
      type: "workflow", name: "Example", description: "Example workflow",
      files: [{ path: "workflow.json", encoding: "utf8", content: "{}" }],
    });
    const id = "00000000-0000-4000-8000-000000000001";
    await mkdir(templates);
    await writeFile(join(templates, id + ".json"), JSON.stringify({ id, gallerySource: resource.id }));
    const state = join(root, ".agent-teams");
    const instance = join(state, "example");
    await mkdir(instance, { recursive: true });
    const team = { id: "example", phase: "staged", workflow: { templateSource: { id } } };
    const writeTeam = () => writeFile(join(instance, "team.json"), JSON.stringify(team));
    const ctx = { get: (key) => key === "workspaceRegistry" ? { list: () => [{ path: root }] } : undefined };
    await writeTeam();
    await syncWorkflowUsage(ctx, { adapter: () => adapter });
    assert.equal(adapter.getResource(resource.id).usageCount, 0);
    team.phase = "running";
    await writeTeam();
    await syncWorkflowUsage(ctx, { adapter: () => adapter });
    assert.equal(adapter.getResource(resource.id).usageCount, 1);
    await mkdir(join(state, "archive"));
    await rename(instance, join(state, "archive", "example"));
    const reopened = new LocalGalleryStore(file);
    await syncWorkflowUsage(ctx, { adapter: () => reopened });
    assert.equal(reopened.getResource(resource.id).usageCount, 1);
  } finally {
    if (previous === undefined) delete process.env.DSH_TEAMFLOW_TEMPLATE_DIR;
    else process.env.DSH_TEAMFLOW_TEMPLATE_DIR = previous;
    await rm(root, { recursive: true, force: true });
  }
});
