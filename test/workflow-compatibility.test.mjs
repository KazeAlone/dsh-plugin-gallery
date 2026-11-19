import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import {
  validateWorkflowTemplate,
  workflowFromResource,
  workflowTemplateIssues,
  MAX_WORKFLOW_TEXT_LENGTH,
} from "../src/workflow-template.mjs";
import { workflowLoopBody } from "../src/workflow-loops.mjs";
import {
  connectWorkflowNodes,
  configureRejectTarget,
  removeRejectTask,
  workflowRejectEdges,
} from "../src/client/workflow-connections.mjs";
import { publishToTeamflow } from "../src/teamflow-publish.mjs";
import { PostgresGalleryStore } from "../src/postgres-store.mjs";
import { StorageManager } from "../src/storage-manager.mjs";
import { parseWorkflowAgent } from "../src/workflow-extraction.mjs";
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/workflow-gated.json", import.meta.url),
    "utf8",
  ),
);
const plain = (id, dependencies = []) => ({
  id,
  subject: id,
  assignee: "writer",
  dependencies,
  checkpoint: false,
  general: {
    requirements: "Repair after rejection",
    deliverables: "Fix",
    acceptance: "Pass review",
  },
});
const branched = () => {
  const value = structuredClone(fixture);
  value.tasks.push(
    plain("left"),
    plain("right"),
    plain("join", ["left", "right"]),
  );
  Object.assign(value.loops[0], {
    rejectTaskIds: ["left", "right", "join"],
    rejectDag: true,
  });
  return value;
};
const resource = (definition) => ({
  id: "shared-workflow",
  type: "workflow",
  name: definition.name,
  files: [
    {
      path: "workflow.json",
      encoding: "utf8",
      content: JSON.stringify(definition),
    },
  ],
  metadata: { workflowCanvas: { version: 1, draft: true } },
});

test("DAG and legacy ordered REJECT paths preserve fields, topology and implicit edges", () => {
  const value = branched(),
    clean = validateWorkflowTemplate(value);
  assert.deepEqual(clean, value);
  assert.deepEqual(validateWorkflowTemplate(clean), clean);
  assert.deepEqual(workflowLoopBody(clean.tasks, clean.loops[0]), [
    "write",
    "verify",
    "left",
    "right",
    "join",
  ]);
  assert.deepEqual(
    workflowRejectEdges(clean.tasks, clean.loops[0]).map((e) => [e.from, e.to]),
    [
      ["gate", "left"],
      ["gate", "right"],
      ["join", "write"],
    ],
  );
  delete value.loops[0].rejectDag;
  value.tasks.find((t) => t.id === "join").dependencies = [];
  const legacy = validateWorkflowTemplate(value);
  assert.equal(legacy.loops[0].rejectDag, undefined);
  assert.ok(
    workflowRejectEdges(legacy.tasks, legacy.loops[0]).some(
      (e) => e.from === "left" && e.to === "right",
    ),
  );
  const added = configureRejectTarget(
    [...legacy.tasks, plain("extra")],
    legacy.loops,
    "gate",
    "extra",
  );
  assert.equal(
    added[0].rejectDag,
    undefined,
    "adding to legacy order must not change its semantics",
  );
});

test("REJECT validation blocks missing, duplicated, shared, forward and escaping branch tasks", () => {
  const cases = [
    (v) => v.loops[0].rejectTaskIds.push("left"),
    (v) => v.loops[0].rejectTaskIds.push("missing"),
    (v) => v.loops[0].rejectTaskIds.push("write"),
    (v) => v.loops[0].rejectTaskIds.push("archive"),
    (v) => v.tasks.find((t) => t.id === "left").dependencies.push("write"),
    (v) => v.tasks.find((t) => t.id === "archive").dependencies.push("join"),
    (v) => v.tasks.find((t) => t.id === "right").dependencies.push("join"),
  ];
  for (const mutate of cases) {
    const value = branched();
    mutate(value);
    assert.throws(() => validateWorkflowTemplate(value), {
      code: "INVALID_WORKFLOW",
    });
  }
  const reversed = branched();
  reversed.tasks.find((t) => t.id === "join").dependencies = [];
  reversed.tasks.find((t) => t.id === "left").dependencies = ["join"];
  assert.doesNotThrow(() => validateWorkflowTemplate(reversed));
  delete reversed.loops[0].rejectDag;
  assert.throws(() => validateWorkflowTemplate(reversed), {
    code: "INVALID_WORKFLOW",
  });
});

test("canvas wires create REJECT-only branches, internal DAG links and implicit return without ordinary cycles", () => {
  const value = structuredClone(fixture);
  value.tasks.push(plain("repair"), plain("check"));
  let loops = configureRejectTarget(value.tasks, [], "gate", "repair");
  assert.equal(loops[0].entryId, "");
  loops = configureRejectTarget(value.tasks, loops, "gate", "write");
  const linked = connectWorkflowNodes(value.tasks, loops, "repair", "check");
  assert.deepEqual(linked.loops[0].rejectTaskIds, ["repair", "check"]);
  assert.deepEqual(linked.tasks.find((t) => t.id === "check").dependencies, [
    "repair",
  ]);
  const returned = connectWorkflowNodes(
    linked.tasks,
    linked.loops,
    "check",
    "write",
  );
  assert.deepEqual(
    returned.tasks.find((t) => t.id === "write").dependencies,
    [],
  );
  const removed = removeRejectTask(
    returned.tasks,
    returned.loops,
    "gate",
    "repair",
  );
  assert.deepEqual(removed.loops[0].rejectTaskIds, ["check"]);
  assert.deepEqual(
    removed.tasks.find((t) => t.id === "check").dependencies,
    [],
  );
  assert.equal(removed.loops[0].entryId, "write");
});

test("drafts save incomplete wiring and empty instructions but publication never loses unsupported configuration", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "gallery-workflow-draft-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const value = branched();
  value.loops[0].entryId = "";
  value.tasks[0].general.requirements = "";
  const draft = validateWorkflowTemplate(value, { draft: true });
  const saved = resource(draft),
    store = new StorageManager(join(root, "local"));
  assert.deepEqual(workflowFromResource(saved, { draft: true }), draft);
  new PostgresGalleryStore({}, "a".repeat(64)).validate(saved);
  const row = store.createResource(saved);
  assert.deepEqual(
    workflowFromResource(store.getResource(row.id), { draft: true }),
    draft,
  );
  assert.ok(workflowTemplateIssues(draft).length >= 2);
  await assert.rejects(publishToTeamflow(saved, join(root, "templates")), {
    code: "INVALID_WORKFLOW",
  });
  value.loops[0].entryId = "write";
  value.tasks[0].general.requirements = "Write a draft";
  const ready = validateWorkflowTemplate(value);
  await publishToTeamflow(resource(ready), join(root, "templates"));
});

test("template draft assignments match TeamFlow; execution setup checks are explicit", () => {
  const value = branched();
  delete value.loops[0].reviewer;
  value.tasks
    .filter((t) => !t.checkpoint && t.kind !== "archive")
    .forEach((t) => {
      t.assignee = "";
    });
  assert.doesNotThrow(() => validateWorkflowTemplate(value));
  assert.throws(
    () => validateWorkflowTemplate(value, { requireExecutionSetup: true }),
    { code: "INVALID_WORKFLOW" },
  );
  value.tasks
    .filter((t) => !t.checkpoint && t.kind !== "archive")
    .forEach((t) => {
      t.assignee = "writer";
    });
  value.loops[0].reviewer = "writer";
  assert.doesNotThrow(() => validateWorkflowTemplate(value));
  assert.throws(
    () => validateWorkflowTemplate(value, { requireExecutionSetup: true }),
    { code: "INVALID_WORKFLOW" },
  );
});

test("all member and task text fields accept 256000 characters and reject overflow", () => {
  for (const [section, key] of [
    ["member", "summary"],
    ["member", "role"],
    ["member", "executionPrompt"],
    ["task", "requirements"],
    ["task", "deliverables"],
    ["task", "acceptance"],
  ]) {
    const value = structuredClone(fixture),
      target = section === "member" ? value.members[0] : value.tasks[0].general;
    target[key] = "x".repeat(MAX_WORKFLOW_TEXT_LENGTH);
    assert.equal(
      (section === "member"
        ? validateWorkflowTemplate(value).members[0]
        : validateWorkflowTemplate(value).tasks[0].general)[key].length,
      256000,
    );
    target[key] += "x";
    assert.throws(() => validateWorkflowTemplate(value), {
      code: "INVALID_WORKFLOW",
    });
  }
  const parsed = parseWorkflowAgent(
    JSON.stringify({
      name: "large-agent",
      summary: "x".repeat(256000),
      role: "Role",
      executionPrompt: "Instructions",
    }),
  );
  assert.equal(parsed.summary.length, 256000);
});

test(
  "native TeamFlow round-trips branching templates, deferred reviewers and long text without loss",
  { skip: !process.env.TEAMFLOW_SOURCE },
  async () => {
    const { parseTemplate } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/templates.js"))
    );
    const samples = [branched()];
    const legacy = branched();
    delete legacy.loops[0].rejectDag;
    samples.push(legacy);
    const draft = branched();
    delete draft.loops[0].reviewer;
    draft.tasks[0].assignee = "";
    samples.push(draft);
    const long = branched();
    long.members[0].summary = "x".repeat(256000);
    long.tasks[0].general.requirements = "x".repeat(256000);
    samples.push(long);
    for (const input of samples) {
      const native = parseTemplate(input);
      assert.deepEqual(parseTemplate(validateWorkflowTemplate(native)), native);
      assert.deepEqual(
        validateWorkflowTemplate(
          parseTemplate(validateWorkflowTemplate(input)),
        ),
        validateWorkflowTemplate(input),
      );
    }
  },
);

test(
  "PostgreSQL preserves incomplete drafts and completed REJECT branches without schema changes",
  { skip: !process.env.GALLERY_TEST_DATABASE_URL },
  async (t) => {
    const { default: pg } = await import("pg");
    const { randomBytes } = await import("node:crypto");
    const database = process.env.GALLERY_TEST_DATABASE_URL,
      schema = "gallery_workflow_" + randomBytes(8).toString("hex");
    const admin = new pg.Pool({ connectionString: database });
    await admin.query(`CREATE SCHEMA ${schema}`);
    const pool = new pg.Pool({
      connectionString: database,
      options: `-c search_path=${schema}`,
    });
    t.after(async () => {
      await pool.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    });
    const store = new PostgresGalleryStore(pool, "a".repeat(64));
    await store.initialize();
    const { user } = await store.enroll("Workflow author");
    const input = branched();
    input.loops[0].entryId = "";
    input.tasks[0].general.requirements = "";
    const created = await store.createResource(resource(input), user);
    const loaded = await store.getResource(created.id, user);
    assert.deepEqual(
      workflowFromResource(loaded, { draft: true }).loops,
      input.loops,
    );
    assert.equal(loaded.metadata.workflowCanvas.draft, true);
    input.loops[0].entryId = "write";
    input.tasks[0].general.requirements = "Complete the draft";
    const complete = resource(input);
    complete.metadata.workflowCanvas.draft = false;
    const updated = await store.updateResource(
      created.id,
      complete,
      created.revision,
      user,
    );
    assert.deepEqual(workflowFromResource(updated).loops, input.loops);
    assert.equal(updated.metadata.workflowCanvas.draft, false);
  },
);
