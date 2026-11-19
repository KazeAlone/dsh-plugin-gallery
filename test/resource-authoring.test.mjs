import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import { createScope } from "@deepseek-ai/dsh-scope";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { StorageManager } from "../src/storage-manager.mjs";
import {
  GalleryResourceAuthoring,
  resourceExample,
} from "../src/resource-authoring.mjs";
import {
  registerResourceTools,
  MANAGEMENT_TOOLS,
} from "../src/resource-tools.mjs";
import GalleryService from "../src/host.mjs";

function setup(t, options = {}) {
  const root = mkdtempSync(join(tmpdir(), "gallery-authoring-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new StorageManager(root);
  store.setUsername("Alice");
  const memberAccess = new WeakMap(),
    refresh = [];
  const service = new GalleryResourceAuthoring({
    store,
    allowed: (agent) => !memberAccess.has(agent),
    changed: async (type, libraryId) => {
      refresh.push([type, libraryId]);
      if (options.failRefresh) throw Error("runtime secret");
    },
  });
  const ctx = new Context();
  ctx.provide("systemPrompt", {
    tools() {},
    section() {
      return () => {};
    },
  });
  new ToolRuntime(ctx);
  const stop = registerResourceTools(ctx, service);
  t.after(stop);
  const agent = { id: "owner" };
  const scope = createScope(ctx, agent);
  agent.ctx = scope.ctx;
  t.after(() => scope.dispose());
  const call = (action, args) =>
    ctx.tools.execute({
      agent,
      name: `gallery_resource_${action}`,
      arguments: args,
      callId: `call-${action}`,
      signal: new AbortController().signal,
    });
  return { root, store, service, ctx, agent, memberAccess, refresh, call };
}

test("all four types: real tool schema -> validate -> create -> get -> update -> list -> delete", async (t) => {
  const { call, store, refresh } = setup(t);
  for (const type of ["skill", "agent", "mcp", "workflow"]) {
    const schema = await call("schema", { type });
    assert.equal(schema.isError, false, JSON.stringify(schema));
    const { resource, libraryId } = schema.value;
    const validation = await call("validate", { resource, libraryId });
    assert.equal(validation.value.valid, true, JSON.stringify(validation));
    assert.equal(store.listResources().total, 0);
    const created = await call("create", {
      resource: validation.value.resource,
      libraryId,
    });
    assert.equal(created.isError, false, JSON.stringify(created));
    assert.equal(created.value.saved, true);
    assert.ok(created.value.id);
    assert.equal(created.value.revision, 1);
    const id = created.value.id;
    const got = await call("get", { id, libraryId });
    assert.equal(got.isError, false);
    assert.equal(got.value.canEdit, true);
    const changed = { ...got.value.resource, name: "Updated " + type };
    const updated = await call("update", {
      id,
      libraryId,
      expectedRevision: got.value.revision,
      resource: changed,
    });
    assert.equal(updated.isError, false, JSON.stringify(updated));
    assert.equal(updated.value.revision, 2);
    assert.equal(
      (
        await call("update", {
          id,
          libraryId,
          expectedRevision: 1,
          resource: changed,
        })
      ).isError,
      true,
    );
    const listed = await call("list", {
      libraryId,
      type,
      q: "Updated",
      limit: 5,
    });
    assert.equal(listed.value.total, 1);
    assert.equal(listed.value.items[0].id, id);
    assert.equal(listed.value.items[0].files, undefined);
    assert.equal(
      (await call("delete", { id, libraryId, expectedRevision: 1 })).isError,
      true,
    );
    assert.equal(
      (await call("delete", { id, libraryId, expectedRevision: 2 })).value
        .deleted,
      true,
    );
  }
  assert.equal(refresh.length, 12);
});

test("malformed input, missing scope, cancellation, immutable type, explicit library, and member tool guard", async (t) => {
  const { service, call, agent, memberAccess, store, ctx } = setup(t);
  assert.equal(
    (
      await call("create", {
        resource: JSON.stringify(resourceExample("skill")),
        libraryId: "local",
      })
    ).isError,
    true,
  );
  assert.equal(
    (await call("create", { resource: resourceExample("skill") })).isError,
    true,
  );
  assert.equal(
    (
      await call("create", {
        resource: resourceExample("skill"),
        libraryId: "center",
      })
    ).isError,
    true,
  );
  await assert.rejects(
    () =>
      service.create(
        { resource: resourceExample("skill"), libraryId: "local" },
        {},
      ),
    { code: "AGENT_REQUIRED" },
  );
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(() =>
    service.create(
      { resource: resourceExample("skill"), libraryId: "local" },
      { agent, signal: abort.signal },
    ),
  );
  const invalid = resourceExample("skill");
  invalid.files.push({ path: "../escape", content: "x" });
  assert.equal(
    (await call("validate", { resource: invalid, libraryId: "local" })).value
      .valid,
    false,
  );
  const brokenAgent = resourceExample("agent");
  brokenAgent.files[0].content = "---\nname: [\n---\n\nBroken";
  assert.equal(
    (await call("validate", { resource: brokenAgent, libraryId: "local" }))
      .value.valid,
    false,
  );
  assert.equal(store.listResources().total, 0);
  const made = (
    await call("create", {
      resource: resourceExample("skill"),
      libraryId: "local",
    })
  ).value;
  assert.equal(
    (
      await call("update", {
        resource: resourceExample("agent"),
        id: made.id,
        libraryId: "local",
        expectedRevision: 1,
      })
    ).isError,
    true,
  );
  memberAccess.set(agent, { gallerySkill: true, galleryMcp: true });
  for (const action of [
    "schema",
    "list",
    "get",
    "validate",
    "create",
    "update",
    "delete",
  ]) {
    const args = {
      schema: { type: "skill" },
      list: { libraryId: "local" },
      get: { id: made.id, libraryId: "local" },
      validate: { resource: resourceExample("skill"), libraryId: "local" },
      create: { resource: resourceExample("skill"), libraryId: "local" },
      update: {
        resource: resourceExample("skill"),
        id: made.id,
        libraryId: "local",
        expectedRevision: 1,
      },
      delete: { id: made.id, libraryId: "local", expectedRevision: 1 },
    }[action];
    assert.equal((await call(action, args)).isError, true, action);
  }
  const host = Object.create(GalleryService.prototype);
  Object.assign(host, {
    memberAccess,
    memberAccessDisposers: new WeakMap(),
    memberToolUpdates: new WeakMap(),
    mcpDispatches: new WeakMap(),
    invalidateSkills() {},
  });
  const stop = host.setMemberAccess(agent, {
    gallerySkill: true,
    galleryMcp: true,
    resourceMode: "discovery",
  });
  assert.ok(
    !ctx.tools.schemas(agent).some((t) => MANAGEMENT_TOOLS.includes(t.name)),
  );
  stop();
  assert.equal(
    ctx.tools.schemas(agent).filter((t) => MANAGEMENT_TOOLS.includes(t.name))
      .length,
    7,
  );
  memberAccess.set(agent, { gallerySkill: true, galleryMcp: true });
  for (const name of MANAGEMENT_TOOLS)
    assert.match(host.resourceCallDenial({ agent, name }), /只有资源使用权限/);
  assert.equal(
    ctx.tools.schemas().filter((t) => MANAGEMENT_TOOLS.includes(t.name)).length,
    7,
  );
});

test("Skill attachments, Agent Markdown round-trip, Workflow drafts, MCP secrets/duplicates and committed refresh errors", async (t) => {
  const { call, store, service, agent, root } = setup(t, { failRefresh: true });
  const skill = resourceExample("skill");
  skill.files.push({ path: "references/guide.md", content: "Guide" });
  const created = (
    await call("create", { resource: skill, libraryId: "local" })
  ).value;
  assert.equal(created.saved, true);
  assert.equal(created.warnings.length, 1);
  assert.ok(!JSON.stringify(created).includes("runtime secret"));
  assert.match(
    store.getResource(created.id).files.find((f) => f.path === "SKILL.md")
      .content,
    /gallery:attachments:start/,
  );
  const mcp = resourceExample("mcp");
  mcp.metadata.mcp = {
    ...mcp.metadata.mcp,
    credentialKeys: ["Authorization"],
    authType: "bearer",
  };
  mcp.mcpCredentials = { Authorization: "Bearer private-token" };
  const valid = (await call("validate", { resource: mcp, libraryId: "local" }))
    .value;
  assert.equal(valid.valid, true);
  assert.ok(!JSON.stringify(valid).includes("private-token"));
  const result = (await call("create", { resource: mcp, libraryId: "local" }))
    .value;
  assert.equal(result.saved, true);
  const get = (await call("get", { id: result.id, libraryId: "local" })).value;
  assert.ok(!JSON.stringify(get).includes("private-token"));
  assert.deepEqual(get.mcpCredentialKeys, ["Authorization"]);
  assert.ok(
    readFileSync(join(root, "resources.json"), "utf8").includes(
      "private-token",
    ),
  );
  const duplicate = await call("create", { resource: mcp, libraryId: "local" });
  assert.equal(duplicate.isError, true);
  const updated = (
    await call("update", {
      id: result.id,
      libraryId: "local",
      expectedRevision: 1,
      resource: { ...get.resource, name: "Renamed" },
    })
  ).value;
  assert.equal(updated.saved, true);
  assert.ok(
    readFileSync(join(root, "resources.json"), "utf8").includes(
      "private-token",
    ),
  );
  const missing = resourceExample("mcp");
  missing.metadata.mcp.serverName = "another";
  missing.metadata.mcp.credentialKeys = ["X-Key"];
  assert.equal(
    (await call("validate", { resource: missing, libraryId: "local" })).value
      .valid,
    false,
  );
  const workflow = resourceExample("workflow");
  const definition = JSON.parse(workflow.files[0].content);
  definition.tasks[0].general.requirements = "";
  workflow.files[0].content = JSON.stringify(definition);
  const draft = await service.create(
    { resource: workflow, libraryId: "local" },
    { agent },
  );
  assert.equal(draft.saved, true);
  assert.ok(draft.warnings.length);
  assert.equal(store.getResource(draft.id).metadata.workflowCanvas.draft, true);
});

test(
  "PostgreSQL authoring: explicit targets, authenticated ownership, immutable identity and private credentials",
  { skip: !process.env.GALLERY_TEST_DATABASE_URL },
  async (t) => {
    const { default: pg } = await import("pg");
    const { randomBytes } = await import("node:crypto");
    const { PostgresGalleryStore } = await import("../src/postgres-store.mjs");
    const { createCenterServer } = await import("../src/center-server.mjs");
    const schema = "gallery_author_" + randomBytes(8).toString("hex");
    const database = process.env.GALLERY_TEST_DATABASE_URL;
    const admin = new pg.Pool({ connectionString: database });
    await admin.query(`CREATE SCHEMA ${schema}`);
    const pool = new pg.Pool({
      connectionString: database,
      options: `-c search_path=${schema}`,
    });
    const backend = new PostgresGalleryStore(
      pool,
      randomBytes(32).toString("hex"),
    );
    await backend.initialize();
    const server = createCenterServer({
      store: backend,
      token: randomBytes(32).toString("hex"),
      openEnrollment: true,
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    t.after(async () => {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      await pool.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    });
    const alice = setup(t),
      bob = setup(t);
    bob.store.setUsername("Bob");
    const url = "http://127.0.0.1:" + server.address().port;
    await alice.store.configure({ type: "service", url });
    await bob.store.configure({ type: "service", url });
    // Explicit target survives the UI being switched to local.
    await alice.store.configure({ type: "internal" });
    for (const type of ["skill", "agent", "mcp", "workflow"]) {
      const input = resourceExample(type);
      if (type === "mcp") {
        input.metadata.mcp.credentialKeys = ["Authorization"];
        input.metadata.mcp.authType = "bearer";
        input.mcpCredentials = { Authorization: "Bearer center-secret" };
      }
      const made = await alice.call("create", {
        resource: input,
        libraryId: "center",
      });
      assert.equal(made.isError, false, JSON.stringify(made));
      assert.equal(alice.store.read().activeLibraryId, "local");
      const got = (
        await bob.call("get", { id: made.value.id, libraryId: "center" })
      ).value;
      assert.equal(got.creator.username, "Alice");
      assert.equal(got.canEdit, false);
      assert.ok(!JSON.stringify(got).includes("center-secret"));
      const changed = { ...got.resource, name: "Other edit" };
      assert.equal(
        (
          await bob.call("update", {
            id: made.value.id,
            resource: changed,
            libraryId: "center",
            expectedRevision: 1,
          })
        ).isError,
        true,
      );
      assert.equal(
        (
          await bob.call("delete", {
            id: made.value.id,
            libraryId: "center",
            expectedRevision: 1,
          })
        ).isError,
        true,
      );
      const validate = (
        await bob.call("validate", {
          id: made.value.id,
          resource: changed,
          libraryId: "center",
          expectedRevision: 1,
        })
      ).value;
      assert.equal(validate.valid, false);
      const owner = await alice.call("update", {
        id: made.value.id,
        resource: got.resource,
        libraryId: "center",
        expectedRevision: 1,
      });
      assert.equal(owner.isError, false, JSON.stringify(owner));
      assert.equal(
        (
          await alice.call("delete", {
            id: made.value.id,
            libraryId: "center",
            expectedRevision: 2,
          })
        ).value.deleted,
        true,
      );
    }
    const forged = {
      ...resourceExample("skill"),
      creator: { username: "Bob", userId: bob.store.read().service.userId },
    };
    const made = await alice.service.create(
      { resource: forged, libraryId: "center" },
      { agent: alice.agent },
    );
    assert.equal(
      (await bob.store.getResource(made.id, "center")).creator.username,
      "Alice",
    );
  },
);
