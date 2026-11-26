import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import {
  validateWorkflowTemplate,
  workflowFromResource,
  workflowCanvasPositions,
} from "../src/workflow-template.mjs";
import { workflowRouteLabel } from "../src/workflow-routing.mjs";
import { StorageManager } from "../src/storage-manager.mjs";
import { uploadWorkflowTemplate } from "../src/workflow-sharing.mjs";
import { publishToTeamflow } from "../src/teamflow-publish.mjs";
import { digest } from "../src/model.mjs";
const fresh = () =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/workflow-gated.json", import.meta.url),
      "utf8",
    ),
  );
const temporary = (t) => {
  const root = mkdtempSync(join(tmpdir(), "gallery-latest-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
};
const resource = (definition) => ({
  type: "workflow",
  name: definition.name,
  description: definition.description,
  tags: definition.tags,
  files: [
    {
      path: "workflow.json",
      encoding: "utf8",
      content: JSON.stringify(definition),
    },
  ],
  metadata: {},
});

test("removed loop timeout is accepted in legacy resources and excluded from new templates and historical registration", async (t) => {
  const current = fresh(),
    legacy = fresh();
  legacy.loops[0].timeoutMinutes = 45;
  assert.deepEqual(validateWorkflowTemplate(legacy), current);
  legacy.loops[0].timeoutMinutes = "obsolete";
  assert.deepEqual(validateWorkflowTemplate(legacy), current);
  const root = temporary(t),
    row = { id: "legacy-resource", ...resource(legacy) };
  const first = await publishToTeamflow(row, root);
  const file = join(root, `${first.id}.json`),
    record = JSON.parse(readFileSync(file));
  record.versions[0].loops[0].timeoutMinutes = 45;
  writeFileSync(file, JSON.stringify(record));
  const second = await publishToTeamflow(
    { ...row, ...resource(current) },
    root,
  );
  assert.equal(second.id, first.id);
  assert.equal(second.version, 2);
  const history = JSON.parse(readFileSync(file));
  assert.equal(history.versions[0].loops[0].timeoutMinutes, 45);
  assert.equal(history.versions[1].loops[0].timeoutMinutes, undefined);
  if (process.env.TEAMFLOW_SOURCE) {
    const { listTemplates } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/template-store.js"))
    );
    const list = await listTemplates(root);
    assert.deepEqual(list.warnings, []);
    assert.equal(list.templates.length, 1);
  }
});

test("same-name outcomes with distinct conditions round-trip through Gallery and native TeamFlow", async () => {
  const value = fresh();
  delete value.loops;
  const route = value.tasks[0];
  route.dynamicRoute = {
    mode: "agent",
    outcomes: [
      { id: "a", label: "继续", condition: "证据充分", targets: ["verify"] },
      { id: "b", label: "继续", condition: "证据不足", targets: [] },
    ],
  };
  assert.deepEqual(validateWorkflowTemplate(value), value);
  assert.equal(
    workflowRouteLabel(route.dynamicRoute.outcomes[0], route.dynamicRoute),
    "继续 · 证据充分",
  );
  assert.equal(
    workflowRouteLabel(route.dynamicRoute.outcomes[1], route.dynamicRoute),
    "继续 · 证据不足",
  );
  if (process.env.TEAMFLOW_SOURCE) {
    const { parseTemplate } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/templates.js"))
    );
    assert.deepEqual(
      parseTemplate(validateWorkflowTemplate(value)),
      parseTemplate(value),
    );
  }
  route.dynamicRoute.outcomes[1].condition = " 证据充分 ";
  assert.throws(
    () => validateWorkflowTemplate(value),
    /同名状态的判断条件须不同/,
  );
});

test("signed coordinates survive native upload, Gallery storage and repeated registration without translation", async (t) => {
  const value = fresh();
  value.positions = {
    "task:write": { x: -10000, y: -120 },
    "task:verify": { x: 10000, y: 10000 },
  };
  assert.deepEqual(validateWorkflowTemplate(value).positions, value.positions);
  const root = temporary(t),
    store = new StorageManager(join(root, "store"));
  store.configure();
  const uploaded = await uploadWorkflowTemplate(store, value, {
    id: "signed",
    version: 1,
  });
  const row = store.getResource(uploaded.id);
  assert.deepEqual(workflowFromResource(row).positions, value.positions);
  row.metadata.workflowCanvas = {
    taskPositions: {
      write: { x: -300, y: -120 },
      verify: { x: 1000, y: 10000 },
    },
  };
  const published = await publishToTeamflow(row, join(root, "templates"));
  const saved = JSON.parse(
    readFileSync(join(root, "templates", `${published.id}.json`)),
  ).versions[0];
  assert.deepEqual(saved.positions, {
    "task:write": { x: -300, y: -120 },
    "task:verify": { x: 1000, y: 10000 },
  });
  if (process.env.TEAMFLOW_SOURCE) {
    const { parseTemplate } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/templates.js"))
    );
    assert.deepEqual(parseTemplate(saved).positions, saved.positions);
  }
  for (const coordinate of [-10001, 10001, Infinity, NaN]) {
    const invalid = fresh();
    invalid.positions["task:write"] = { x: coordinate, y: 0 };
    assert.throws(() => validateWorkflowTemplate(invalid), /画布位置/);
  }
  assert.deepEqual(
    workflowCanvasPositions(value.tasks, {
      write: { x: -20000, y: 1000 },
      verify: { x: 20000, y: -2000 },
    }),
    {
      "task:write": { x: -10000, y: 500 },
      "task:verify": { x: 10000, y: -1000 },
    },
  );
});

test("legacy upload source digests migrate only removed timeout differences and retain edited copies", async (t) => {
  const root = temporary(t),
    store = new StorageManager(root);
  store.configure();
  const clean = validateWorkflowTemplate(fresh()),
    legacy = validateWorkflowTemplate(fresh());
  // Reconstruct the exact pre-0.34.1 loop key order used by the source digest.
  legacy.loops = legacy.loops.map(
    ({ gateId, entryId, mode, maxRounds, ...rest }) => ({
      gateId,
      entryId,
      mode,
      maxRounds,
      timeoutMinutes: 45,
      ...rest,
    }),
  );
  const source = { id: "legacy-upload", version: 1 };
  const original = await uploadWorkflowTemplate(store, clean, source);
  store.adapter().write((rows) => {
    const row = rows.find((row) => row.id === original.id);
    row.name = "User edited name";
    row.files[0].content = JSON.stringify(legacy);
    return row;
  });
  const registryFile = join(root, "workflow-uploads.json"),
    registry = JSON.parse(readFileSync(registryFile));
  const key = Object.keys(registry.entries)[0];
  registry.entries[key].sourceDigest = digest(JSON.stringify(legacy));
  writeFileSync(registryFile, JSON.stringify(registry));
  const reused = await uploadWorkflowTemplate(store, clean, source);
  assert.equal(reused.id, original.id);
  assert.equal(reused.reused, true);
  assert.equal(reused.name, "User edited name");
  assert.equal(
    JSON.parse(readFileSync(registryFile)).entries[key].sourceDigest,
    digest(JSON.stringify(clean)),
  );
  const changed = fresh();
  changed.tasks[0].general.requirements += " real change";
  await assert.rejects(
    uploadWorkflowTemplate(store, changed, source),
    (error) => error.code === "SOURCE_VERSION_CHANGED",
  );
  assert.equal(store.getResource(original.id).name, "User edited name");
});
