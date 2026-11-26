import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import {
  validateWorkflowTemplate,
  workflowFromResource,
} from "../src/workflow-template.mjs";
import {
  reconcileWorkflowRouting,
  disconnectWorkflowRoute,
} from "../src/workflow-routing.mjs";
import { uploadWorkflowTemplate } from "../src/workflow-sharing.mjs";
import { StorageManager } from "../src/storage-manager.mjs";
import { publishToTeamflow } from "../src/teamflow-publish.mjs";
import { GalleryResourceAuthoring } from "../src/resource-authoring.mjs";
import { importResourceFiles } from "../src/client/resource-import.mjs";
import { PostgresGalleryStore } from "../src/postgres-store.mjs";
const task = (id, dependencies = []) => ({
  id,
  subject: id,
  dependencies,
  assignee: "",
  checkpoint: false,
  general: {
    requirements: "Complete and provide evidence",
    deliverables: "",
    acceptance: "",
  },
});
const fresh = () => ({
  name: "Conditional review",
  description: "",
  inputs: "",
  tags: [],
  members: [],
  positions: {},
  tasks: [
    {
      ...task("decide"),
      dynamicRoute: {
        mode: "agent",
        outcomes: [
          {
            id: "yes",
            label: "Approved",
            condition: "Evidence is complete",
            targets: ["left"],
          },
          {
            id: "no",
            label: "Needs work",
            condition: "Evidence is incomplete",
            targets: ["right"],
          },
        ],
      },
    },
    task("left", ["decide"]),
    task("right", ["decide"]),
    { ...task("join", ["left", "right"]), routeJoin: ["left", "right"] },
  ],
});
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
  references: [],
  metadata: { format: "dsh-teamflow-template-v1" },
});
function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-routing-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test("routing validation preserves portable fields and rejects invalid state, connections and joins", () => {
  assert.deepEqual(validateWorkflowTemplate(fresh()), fresh());
  const runtime = fresh();
  Object.assign(runtime.tasks[0], {
    routeDecision: { outcomeId: "yes" },
    routeHistory: [{ outcomeId: "no" }],
  });
  runtime.tasks[0].dynamicRoute.outcomes[0].status = "active";
  assert.deepEqual(validateWorkflowTemplate(runtime), fresh());
  for (const mutate of [
    (v) => {
      v.tasks[0].dynamicRoute.mode = "auto";
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes.pop();
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes[1].id = "yes";
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes[1].label = " Approved ";
      v.tasks[0].dynamicRoute.outcomes[1].condition = v.tasks[0].dynamicRoute.outcomes[0].condition;
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes[0].condition = "";
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes[0].targets = ["left", "left"];
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes[0].targets = ["missing"];
    },
    (v) => {
      v.tasks[0].dynamicRoute.outcomes[0].targets = ["join"];
    },
    (v) => {
      v.tasks[0].checkpoint = true;
    },
    (v) => {
      v.tasks[0].kind = "archive";
    },
    (v) => {
      v.tasks[3].routeJoin = ["decide"];
    },
    (v) => {
      v.tasks[1].routeJoin = ["decide"];
    },
  ]) {
    const value = fresh();
    mutate(value);
    assert.throws(
      () => validateWorkflowTemplate(value),
      (error) => error.code === "INVALID_WORKFLOW",
    );
  }
  const terminal = fresh();
  terminal.tasks[0].dynamicRoute.outcomes.push({
    id: "end",
    label: "End",
    condition: "No work is needed",
    targets: [],
  });
  assert.equal(
    validateWorkflowTemplate(terminal).tasks[0].dynamicRoute.outcomes.length,
    3,
  );
  const loop = fresh();
  loop.tasks.push({
    ...task("gate", ["join"]),
    checkpoint: true,
    checkpointKind: "gate",
  });
  loop.loops = [
    {
      gateId: "gate",
      entryId: "decide",
      mode: "human",
      maxRounds: 3,
      timeoutMinutes: 30,
    },
  ];
  assert.throws(
    () => validateWorkflowTemplate(loop),
    /动态路由路径不能进入门控循环/,
  );
});

test("deleting canvas nodes/edges and enabling upstream routing clears only obsolete references", () => {
  const value = fresh();
  const deleted = reconcileWorkflowRouting(
    value.tasks
      .filter((row) => row.id !== "left")
      .map((row) => ({
        ...row,
        dependencies: row.dependencies.filter((id) => id !== "left"),
      })),
  );
  assert.deepEqual(deleted[0].dynamicRoute.outcomes[0].targets, []);
  assert.deepEqual(deleted.find((row) => row.id === "join").routeJoin, [
    "right",
  ]);
  const disconnected = reconcileWorkflowRouting(
    value.tasks.map((row) =>
      row.id === "right" ? { ...row, dependencies: [] } : row,
    ),
  );
  assert.deepEqual(disconnected[0].dynamicRoute.outcomes[1].targets, []);
  const routedUpstream = reconcileWorkflowRouting(
    value.tasks.map((row) =>
      row.id === "left"
        ? { ...row, dynamicRoute: structuredClone(value.tasks[0].dynamicRoute) }
        : row,
    ),
  );
  assert.deepEqual(routedUpstream.find((row) => row.id === "join").routeJoin, [
    "right",
  ]);
});

test("64 members, 512 tasks, 511 dependencies and 256 independent loops match native capacities", async () => {
  const value = fresh();
  value.members = Array.from({ length: 64 }, (_, i) => ({
    name: `member_${i}`,
    summary: "",
    role: "",
    executionPrompt: "",
  }));
  value.tasks = Array.from({ length: 512 }, (_, i) => task(`node_${i}`));
  value.tasks[511].dependencies = value.tasks
    .slice(0, 511)
    .map((row) => row.id);
  value.tasks[511].routeJoin = [...value.tasks[511].dependencies];
  assert.equal(
    validateWorkflowTemplate(value).tasks[511].dependencies.length,
    511,
  );
  const excess = structuredClone(value);
  excess.tasks.push(task("extra"));
  assert.throws(() => validateWorkflowTemplate(excess), /节点/);
  const tooManyMembers = structuredClone(value);
  tooManyMembers.members.push({ ...value.members[0], name: "extra" });
  assert.throws(() => validateWorkflowTemplate(tooManyMembers), /成员/);
  const loops = structuredClone(value);
  loops.tasks = [];
  loops.loops = [];
  for (let i = 0; i < 256; i++) {
    loops.tasks.push(task(`entry_${i}`), {
      ...task(`gate_${i}`, [`entry_${i}`]),
      checkpoint: true,
      checkpointKind: "gate",
    });
    loops.loops.push({
      gateId: `gate_${i}`,
      entryId: `entry_${i}`,
      mode: "human",
      maxRounds: 3,
      timeoutMinutes: 30,
    });
  }
  assert.equal(validateWorkflowTemplate(loops).loops.length, 256);
  // A single body is no longer limited to 32 tasks. REJECT-only tasks still have the native 31 limit.
  const largeLoop = structuredClone(value);
  largeLoop.tasks = Array.from({ length: 40 }, (_, i) =>
    task(`body_${i}`, i ? [`body_${i - 1}`] : []),
  );
  largeLoop.tasks.push({
    ...task("gate", ["body_39"]),
    checkpoint: true,
    checkpointKind: "gate",
  });
  largeLoop.loops = [
    {
      gateId: "gate",
      entryId: "body_0",
      mode: "human",
      maxRounds: 2,
      timeoutMinutes: 10,
    },
  ];
  assert.equal(validateWorkflowTemplate(largeLoop).tasks.length, 41);
  largeLoop.loops[0].rejectTaskIds = Array.from(
    { length: 32 },
    (_, i) => `return_${i}`,
  );
  assert.throws(() => validateWorkflowTemplate(largeLoop), /退回路径/);
  if (process.env.TEAMFLOW_SOURCE) {
    const { parseTemplate } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/templates.js"))
    );
    for (const definition of [value, loops])
      assert.deepEqual(
        parseTemplate(validateWorkflowTemplate(definition)),
        parseTemplate(definition),
      );
  }
});

test("upload, model create/update, bundle import and registration keep branch semantics through repeated versions", async (t) => {
  const directory = temporary(t),
    store = new StorageManager(directory);
  store.configure();
  store.setUsername("Routing author");
  const value = fresh();
  const uploaded = await uploadWorkflowTemplate(store, value, {
    id: "native-routing",
    version: 1,
  });
  const original = store.getResource(uploaded.id);
  assert.deepEqual(workflowFromResource(original), value);
  const imported = importResourceFiles("workflow", [
    {
      path: "workflow.gallery.json",
      encoding: "utf8",
      content: JSON.stringify({
        format: "dsh-gallery-resource",
        schemaVersion: 2,
        resource: original,
      }),
    },
  ]).resource;
  assert.deepEqual(workflowFromResource(imported), value);
  const author = new GalleryResourceAuthoring({ store }),
    exec = { agent: { id: "owner" } };
  assert.equal(author.schema({ type: "workflow" }, exec).limits.tasks, 512);
  const created = await author.create(
    { libraryId: "local", resource: imported },
    exec,
  );
  const updatedResource = resource(value);
  updatedResource.description = "Changed metadata";
  const updated = await author.update(
    {
      id: created.id,
      expectedRevision: created.revision,
      libraryId: "local",
      resource: updatedResource,
    },
    exec,
  );
  const loaded = store.getResource(updated.id);
  assert.deepEqual(workflowFromResource(loaded), value);
  const library = join(directory, "templates");
  const registered = await publishToTeamflow(loaded, library);
  await publishToTeamflow(loaded, library);
  const record = JSON.parse(
    readFileSync(join(library, `${registered.id}.json`), "utf8"),
  );
  for (const version of record.versions)
    assert.deepEqual(validateWorkflowTemplate(version), value);
  if (process.env.TEAMFLOW_SOURCE) {
    const { listTemplates } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/template-store.js"))
    );
    const native = await listTemplates(library);
    assert.deepEqual(native.warnings, []);
    assert.deepEqual(validateWorkflowTemplate(native.templates[0]), value);
    // Every native built-in traverses the real sharing/import/registration path, not just validation.
    const { builtinTemplates } = await import(
      pathToFileURL(
        join(process.env.TEAMFLOW_SOURCE, "lib/builtin-templates.js"),
      )
    );
    const { builtinLoopTemplates } = await import(
      pathToFileURL(
        join(process.env.TEAMFLOW_SOURCE, "lib/builtin-loop-templates.js"),
      )
    );
    const { parseTemplate } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/templates.js"))
    );
    for (const [index, template] of [
      ...builtinTemplates(),
      ...builtinLoopTemplates("en"),
    ].entries()) {
      const uploaded = await uploadWorkflowTemplate(store, template, {
        id: `${template.id}-${index}`,
        version: template.version,
      });
      const row = store.getResource(uploaded.id);
      const registered = await publishToTeamflow(row, library);
      const list = await listTemplates(library);
      assert.deepEqual(list.warnings, []);
      assert.deepEqual(
        parseTemplate(list.templates.find((row) => row.id === registered.id)),
        parseTemplate(template),
        template.name,
      );
    }
  }
});

test(
  "PostgreSQL retains routing and ownership after create/update without schema migration",
  { skip: !process.env.GALLERY_TEST_DATABASE_URL },
  async (t) => {
    const { default: pg } = await import("pg");
    const { randomBytes } = await import("node:crypto");
    const database = process.env.GALLERY_TEST_DATABASE_URL,
      schema = "gallery_route_" + randomBytes(8).toString("hex");
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
    const { user } = await store.enroll("Author"),
      { user: reader } = await store.enroll("Reader");
    const value = fresh();
    value.positions = { "task:decide": { x: -600, y: -300 } };
    value.tasks[0].dynamicRoute.outcomes[1].label = value.tasks[0].dynamicRoute.outcomes[0].label;
    const saved = await store.createResource(resource(value), user);
    assert.deepEqual(
      workflowFromResource(await store.getResource(saved.id, reader)),
      value,
    );
    await assert.rejects(
      store.updateResource(saved.id, resource(value), saved.revision, reader),
      (error) => error.status === 403,
    );
    value.tasks[0].dynamicRoute.mode = "human";
    const updated = await store.updateResource(
      saved.id,
      resource(value),
      saved.revision,
      user,
    );
    assert.deepEqual(workflowFromResource(updated), value);
  },
);

test("removing one of two outcome wires preserves the shared dependency", () => {
  const value = fresh();
  value.tasks[0].dynamicRoute.outcomes[1].targets.push("left");
  const first = disconnectWorkflowRoute(value.tasks, "decide", "left", "yes");
  assert.deepEqual(first[0].dynamicRoute.outcomes[0].targets, []);
  assert.deepEqual(first[1].dependencies, ["decide"]);
  assert.deepEqual(first[0].dynamicRoute.outcomes[1].targets, [
    "right",
    "left",
  ]);
  const last = disconnectWorkflowRoute(first, "decide", "left", "no");
  assert.deepEqual(last[1].dependencies, []);
  assert.deepEqual(last[0].dynamicRoute.outcomes[1].targets, ["right"]);
  validateWorkflowTemplate({ ...value, tasks: last });
});
