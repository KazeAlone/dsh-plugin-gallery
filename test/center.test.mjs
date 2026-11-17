import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { PostgresGalleryStore } from "../src/postgres-store.mjs";
import { createCenterServer } from "../src/center-server.mjs";
import { StorageManager } from "../src/storage-manager.mjs";
import { RemoteGalleryStore } from "../src/remote-store.mjs";
import { createSkillProvider } from "../src/skill-provider.mjs";
import { galleryAgents } from "../src/agent-runtime.mjs";
import { agentDocument } from "../src/client/agent-format.mjs";
import { validateMcpConfig } from "../src/mcp-config.mjs";

const database = process.env.GALLERY_TEST_DATABASE_URL;
const file = (path, content, encoding = "utf8") => ({
  path,
  content,
  encoding,
});
const skill = {
  type: "skill",
  name: "Shared Skill",
  description: "Shared description",
  tags: ["shared"],
  metadata: {},
  files: [
    file(
      "SKILL.md",
      "---\nname: shared-skill\ndescription: Shared description\n---\n\nRead references/guide.md.",
    ),
    file("references/guide.md", "# Guide"),
    file("assets/icon.bin", "AAEC", "base64"),
  ],
};

// This test creates an isolated schema; never clears existing application tables.
test(
  "PostgreSQL center: two hosts, all resource types, secrets, conflicts, usage and switching",
  { skip: !database },
  async (t) => {
    const schema = "gallery_test_" + randomBytes(8).toString("hex");
    const admin = new pg.Pool({ connectionString: database });
    await admin.query(`CREATE SCHEMA ${schema}`);
    const pool = new pg.Pool({
      connectionString: database,
      options: `-c search_path=${schema}`,
    });
    const store = new PostgresGalleryStore(
      pool,
      randomBytes(32).toString("hex"),
    );
    const root = mkdtempSync(join(tmpdir(), "gallery-center-"));
    const token = randomBytes(32).toString("hex");
    const server = createCenterServer({ store, token });
    t.after(async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
      rmSync(root, { recursive: true, force: true });
    });
    await store.initialize();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = "http://127.0.0.1:" + server.address().port;
    const a = new StorageManager(join(root, "a"));
    const b = new StorageManager(join(root, "b"));
    const local = a.createResource({ ...skill, name: "Local only" });
    a.setUsername("Alice");
    b.setUsername("Bob");
    await assert.rejects(
      a.configure({
        type: "service",
        url,
        token: "wrong-token-0000000000000000000000",
      }),
      { status: 401 },
    );
    assert.equal(a.read().activeLibraryId, "local");
    await a.configure({ type: "service", url, token });
    await b.configure({ type: "service", url, token });
    assert.equal(a.settings().service.hasToken, true);
    assert.equal(JSON.stringify(a.settings()).includes(token), false);
    assert.equal(a.settings().capabilities.sharing, true);
    const legacy = {
      ...a.adapter("local").read().resources[0],
      creator: { username: "Alice" },
    };
    await pool.query("INSERT INTO gallery_resources(id,body) VALUES ($1,$2)", [
      legacy.id,
      legacy,
    ]);
    assert.equal((await a.getResource(legacy.id)).canEdit, false);
    assert.equal((await b.getResource(legacy.id)).canEdit, false);
    await assert.rejects(a.updateResource(legacy.id, skill, 1), {
      status: 403,
    });
    await assert.rejects(b.deleteResource(legacy.id, 1), { status: 403 });
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      process.execPath,
      [
        "scripts/center-users.mjs",
        "assign-legacy",
        b.settings().service.userId,
      ],
      {
        env: {
          ...process.env,
          DATABASE_URL: database,
          PGOPTIONS: "-c search_path=" + schema,
        },
        stdio: "pipe",
      },
    );
    assert.equal((await b.getResource(legacy.id)).canEdit, true);
    assert.equal((await a.getResource(legacy.id)).canEdit, false);
    const legacyAudit = await pool.query(
      "SELECT actor_id,action FROM gallery_audit WHERE resource_id=$1",
      [legacy.id],
    );
    assert.equal(legacyAudit.rows[0].actor_id, "system:server-admin");
    await pool.query("DELETE FROM gallery_resources WHERE id=$1", [legacy.id]);
    const saved = await a.createResource(skill);
    assert.equal(saved.creator.username, "Alice");
    assert.equal(saved.libraryId, "center");
    const aId = a.settings().service.userId,
      bId = b.settings().service.userId;
    assert.ok(aId && bId && aId !== bId);
    assert.equal(saved.creator.userId, aId);
    assert.equal((await a.getResource(saved.id)).canEdit, true);
    assert.equal((await b.getResource(saved.id)).canEdit, false);
    assert.equal((await b.listResources({ scope: "mine" })).total, 0);
    await assert.rejects(b.updateResource(saved.id, skill, 1), { status: 403 });
    await assert.rejects(b.deleteResource(saved.id, 1), { status: 403 });
    await b.setUsername("Alice");
    await assert.rejects(b.updateResource(saved.id, skill, 1), { status: 403 });
    const forged = await b.adapter().client.request("/v2/resources", {
      method: "POST",
      body: {
        resource: { ...skill, creator: { userId: aId } },
        creator: { username: "Alice", userId: aId },
      },
    });
    assert.equal(forged.creator.userId, bId);
    await b.deleteResource(forged.id, 1);
    await b.setUsername("Bob");
    const oldToken = a.read().service.token;
    assert.equal(JSON.stringify(a.settings()).includes(oldToken), false);
    await a.configure({ type: "service", url, token });
    assert.equal(a.read().service.token, oldToken);
    assert.equal(a.settings().service.userId, aId);
    const userRow = await pool.query(
      "SELECT token_hash FROM gallery_users WHERE id=$1",
      [aId],
    );
    assert.notEqual(userRow.rows[0].token_hash, oldToken);
    await assert.rejects(new RemoteGalleryStore({ url, token }).read(), {
      code: "USER_REQUIRED",
    });
    assert.equal(
      (await b.getResource(saved.id)).files.find(
        (f) => f.path === "assets/icon.bin",
      ).content,
      "AAEC",
    );
    assert.equal((await b.listResources({ q: "alice" })).total, 1);
    assert.equal((await b.listResources({ q: "not present" })).total, 0);
    assert.equal((await b.listResources()).items[0].fileCount, 3);
    const edits = await Promise.allSettled([
      a.updateResource(saved.id, { ...skill, name: "Edit A" }, 1),
      a.updateResource(saved.id, { ...skill, name: "Edit A second" }, 1),
    ]);
    assert.equal(edits.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      edits.find((r) => r.status === "rejected").reason.code,
      "CONFLICT",
    );
    await Promise.all(
      Array.from({ length: 8 }, () =>
        b.recordSkillUse({ id: saved.id, usageId: "same-event" }),
      ),
    );
    assert.equal((await a.getResource(saved.id)).usageCount, 1);
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        b.recordSkillUse({ id: saved.id, usageId: "event-" + i }),
      ),
    );
    assert.equal((await a.getResource(saved.id)).usageCount, 6);
    const snapshot = await b.getSnapshot({ id: saved.id });
    assert.equal(snapshot.resource.files.length, 3);
    await assert.rejects(
      b.resolveReference({ id: saved.id, digest: "stale" }),
      { code: "DIGEST_MISMATCH" },
    );
    const provider = createSkillProvider(b);
    const candidates = await provider.list();
    const loaded = await provider.get(candidates[0]);
    assert.match(loaded.content, /Gallery 附件/);
    assert.equal(
      readFileSync(
        join(loaded.resourceBase.path, "references/guide.md"),
        "utf8",
      ),
      "# Guide",
    );
    const agent = await a.createResource({
      type: "agent",
      name: "Shared Agent",
      description: "Review",
      metadata: {
        agent: {
          slug: "reviewer",
          goal: "Review",
          instructions: "Review the supplied text.",
        },
      },
      files: [
        file(
          "AGENT.md",
          agentDocument({
            slug: "reviewer",
            description: "Review",
            goal: "Review",
            instructions: "Review the supplied text.",
            boundaries: "",
          }),
        ),
      ],
    });
    assert.equal((await galleryAgents(b))[0].resource.id, agent.id);
    const config = validateMcpConfig({
      serverName: "papers",
      transport: "streamable-http",
      url: "https://example.com/mcp",
      credentialKeys: ["Authorization"],
    });
    const mcp = await a.createResource({
      type: "mcp",
      name: "Papers",
      metadata: { mcp: config },
      files: [],
      mcpCredentials: { Authorization: "Bearer example-secret" },
    });
    const raw = await pool.query(
      "SELECT body FROM gallery_resources WHERE id=$1",
      [mcp.id],
    );
    assert.equal(JSON.stringify(raw.rows).includes("example-secret"), false);
    assert.equal(
      (await b.getResource(mcp.id)).privateMcpCredentials,
      undefined,
    );
    assert.equal(
      (await b.adapter().read()).resources.find((r) => r.id === mcp.id)
        .privateMcpCredentials.Authorization,
      "Bearer example-secret",
    );
    await assert.rejects(
      b.createResource({
        type: "mcp",
        name: "Duplicate",
        metadata: { mcp: config },
        files: [],
        mcpCredentials: { Authorization: "Bearer another-secret" },
      }),
      { code: "DUPLICATE_MCP_NAME" },
    );
    const changedMcp = await a.updateResource(
      mcp.id,
      {
        type: "mcp",
        name: "Papers updated",
        metadata: { mcp: config },
        files: [],
      },
      1,
    );
    assert.equal(changedMcp.revision, 2);
    assert.equal(changedMcp.privateMcpCredentials, undefined);
    assert.equal(
      (await b.adapter().read("mcp")).resources[0].privateMcpCredentials
        .Authorization,
      "Bearer example-secret",
    );
    const workflow = JSON.parse(
      readFileSync(
        new URL("./fixtures/workflow-gated.json", import.meta.url),
        "utf8",
      ),
    );
    const flow = await a.createResource({
      type: "workflow",
      name: "Review",
      files: [file("workflow.json", JSON.stringify(workflow))],
    });
    assert.equal(
      (await b.listResources({ type: "workflow" })).items[0].id,
      flow.id,
    );
    const sharedWorkflow = JSON.parse(
      (await b.getResource(flow.id)).files.find(
        (f) => f.path === "workflow.json",
      ).content,
    );
    assert.deepEqual(sharedWorkflow.loops, workflow.loops);
    assert.deepEqual(sharedWorkflow.tasks, workflow.tasks);
    for (const row of [agent, mcp, flow]) {
      const current = await b.getResource(row.id);
      assert.equal(current.canEdit, false);
      assert.equal(current.canDelete, false);
      await assert.rejects(
        b.updateResource(row.id, current, current.revision),
        { code: "RESOURCE_FORBIDDEN" },
      );
      await assert.rejects(b.deleteResource(row.id, current.revision), {
        code: "RESOURCE_FORBIDDEN",
      });
    }
    const audit = await pool.query(
      "SELECT actor_id,action FROM gallery_audit WHERE resource_id=$1 ORDER BY id",
      [saved.id],
    );
    assert.deepEqual(
      audit.rows.map((r) => r.action),
      ["create", "update"],
    );
    assert.ok(audit.rows.every((r) => r.actor_id === aId));
    await assert.rejects(a.deleteResource(saved.id, 1), { code: "CONFLICT" });
    await a.deleteResource(saved.id, 2);
    await assert.rejects(a.getResource(saved.id), { code: "NOT_FOUND" });
    await assert.rejects(new RemoteGalleryStore({ url, token: "bad" }).read(), {
      status: 401,
    });
    assert.equal((await a.testConnection({ type: "service" })).ready, true);
    assert.equal(
      new StorageManager(a.directory).settings().activeLibraryId,
      "center",
    );
    await a.configure({ type: "internal" });
    assert.equal(a.getResource(local.id).name, "Local only");
    assert.equal(a.listResources().total, 1);
    assert.equal((await b.listResources()).total, 3);
    await a.configure({ type: "service" });
    assert.equal((await a.listResources()).total, 3);
  },
);

test("center rejects missing credentials and keeps internal errors private", async (t) => {
  const token = randomBytes(32).toString("hex");
  const server = createCenterServer({
    token,
    store: {
      health() {
        throw new Error("password=private");
      },
    },
    logger: { error() {} },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const url = "http://127.0.0.1:" + server.address().port;
  const denied = await fetch(url + "/v2/runtime");
  assert.equal(denied.status, 401);
  const failed = await fetch(url + "/v2/health", {
    headers: { Authorization: "Bearer " + token },
  });
  assert.equal(failed.status, 500);
  assert.equal((await failed.text()).includes("private"), false);
});

test("HTTPS center requires a trusted certificate and preserves per-connection CA settings", async (t) => {
  const { createServer: createHttpsServer } = await import("node:https");
  const { execFileSync } = await import("node:child_process");
  const root = mkdtempSync(join(tmpdir(), "gallery-center-tls-"));
  const key = join(root, "key.pem"),
    cert = join(root, "ca.crt");
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-subj",
      "/CN=Gallery Test CA",
      "-addext",
      "basicConstraints=critical,CA:TRUE",
      "-addext",
      "subjectAltName=IP:127.0.0.1",
      "-days",
      "1",
      "-keyout",
      key,
      "-out",
      cert,
    ],
    { stdio: "ignore" },
  );
  const token = "user-" + randomBytes(32).toString("hex");
  const actor = { id: "tls-user", username: "TLS user" };
  const handler = createCenterServer({
    token: randomBytes(32).toString("hex"),
    store: {
      authenticate: async (value) => (value === token ? actor : undefined),
      health: async () => ({
        ready: true,
        protocol: 3,
        storage: "postgres",
        ownership: true,
      }),
    },
  });
  const server = createHttpsServer(
    { key: readFileSync(key), cert: readFileSync(cert) },
    handler.listeners("request")[0],
  );
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    rmSync(root, { recursive: true, force: true });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "https://127.0.0.1:" + server.address().port;
  await assert.rejects(new RemoteGalleryStore({ url, token }).health());
  const caCertificate = readFileSync(cert, "utf8");
  const manager = new StorageManager(join(root, "host"));
  assert.throws(
    () =>
      manager.connection({ url, token, caCertificate: "not a certificate" }),
    { code: "INVALID_CA" },
  );
  await manager.configure({ type: "service", url, token, caCertificate });
  assert.equal(manager.settings().service.userId, actor.id);
  assert.equal(manager.settings().service.caCertificate, caCertificate);
  const restored = new StorageManager(manager.directory);
  assert.equal(
    (await restored.testConnection({ type: "service" })).ready,
    true,
  );
  // Trust is scoped to this center client; the process-wide trust store is unchanged.
  await assert.rejects(new RemoteGalleryStore({ url, token }).health());
});
