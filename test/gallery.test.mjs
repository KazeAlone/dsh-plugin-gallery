import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteGalleryStore } from "../src/store.mjs";
import { openGalleryStore } from "../src/local-store.mjs";
import { GalleryReader } from "../src/reader.mjs";
import { digest, normalizeResource } from "../src/model.mjs";
const data = (type = "skill", name = "代码审查") => ({
  type,
  name,
  description: "检查代码变更",
  tags: ["研发", "审查"],
  files: [
    {
      path: type === "skill" ? "SKILL.md" : "definition.json",
      content: "# Review\nCheck tests.",
    },
  ],
  metadata: { runtime: "dsh" },
  references: [],
});
const code = (fn, c) => assert.throws(fn, (e) => e.code === c);
function setup(t) {
  const s = new SqliteGalleryStore(":memory:");
  t.after(() => s.close());
  return s;
}
function temp(t) {
  const p = mkdtempSync(join(tmpdir(), "gallery-local-"));
  t.after(() => rmSync(p, { recursive: true, force: true }));
  return p;
}
function legacy(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE members(id TEXT PRIMARY KEY,name TEXT,role TEXT,token_hash TEXT,active INTEGER,created_at TEXT);
    CREATE TABLE resources(id TEXT PRIMARY KEY,type TEXT,owner_id TEXT,draft TEXT,revision INTEGER,published_revision INTEGER,created_at TEXT,updated_at TEXT);
    CREATE TABLE versions(resource_id TEXT,version INTEGER,snapshot TEXT,digest TEXT,note TEXT,actor_id TEXT,created_at TEXT,PRIMARY KEY(resource_id,version));
    CREATE TABLE audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT,resource_id TEXT,action TEXT,detail TEXT,created_at TEXT);
    INSERT INTO members VALUES('alice','Alice','member','fixture-only-hash',1,'2026-01-01');
    INSERT INTO members VALUES('bob','Bob','admin','fixture-only-hash-2',1,'2026-01-01');
    PRAGMA user_version=1;`);
  const snapshot = JSON.stringify(normalizeResource(data())),
    draft = JSON.stringify(normalizeResource(data("skill", "未发布修改")));
  db.prepare("INSERT INTO resources VALUES(?,?,?,?,?,?,?,?)").run(
    "old-skill",
    "skill",
    "alice",
    draft,
    2,
    1,
    "2026-01-01",
    "2026-01-02",
  );
  db.prepare("INSERT INTO resources VALUES(?,?,?,?,?,?,?,?)").run(
    "old-agent",
    "agent",
    "bob",
    JSON.stringify(normalizeResource(data("agent", "旧草稿"))),
    1,
    0,
    "2026-01-01",
    "2026-01-02",
  );
  db.prepare("INSERT INTO versions VALUES(?,?,?,?,?,?,?)").run(
    "old-skill",
    1,
    snapshot,
    digest(snapshot),
    "initial",
    "alice",
    "2026-01-01",
  );
  db.prepare(
    "INSERT INTO audit(actor_id,resource_id,action,detail,created_at) VALUES(?,?,?,?,?)",
  ).run("alice", "old-skill", "version.publish", '{"version":1}', "2026-01-01");
  db.prepare(
    "INSERT INTO audit(actor_id,action,detail,created_at) VALUES(?,?,?,?)",
  ).run("bob", "member.create", "{}", "2026-01-01");
  return { db, snapshot, hash: digest(snapshot) };
}

test("four resource types work without initialization, accounts or ownership", (t) => {
  const s = setup(t);
  assert.equal(s.authenticate, undefined);
  assert.equal(s.addMember, undefined);
  for (const type of ["skill", "agent", "mcp", "workflow"]) {
    const r = s.create({ ...data(type), ownerId: "ignored", role: "admin" });
    assert.equal(r.revision, 1);
    assert.equal(r.hasDraft, true);
    assert.ok(!("ownerId" in r));
    assert.ok(!("canEdit" in r));
    assert.equal(s.publish(r.id, 1).version, 1);
  }
  assert.equal(s.list().total, 4);
  assert.equal(s.list({ type: "skill" }).total, 1);
  assert.equal(s.list({ q: "研发" }).total, 4);
  assert.equal(s.list({ scope: "drafts" }).total, 0);
  assert.equal(s.list({ limit: 2, offset: 2 }).items.length, 2);
});
test("drafts are editable, published snapshots immutable and rollback preserves history", (t) => {
  const s = setup(t),
    r = s.create(data()),
    v1 = s.publish(r.id, 1);
  s.update(r.id, data("skill", "第二版"), 1);
  assert.equal(s.list({ scope: "drafts" }).total, 1);
  assert.equal(s.getVersion(r.id, 1).resource.name, "代码审查");
  code(() => s.update(r.id, data(), 1), "CONFLICT");
  code(() => s.publish(r.id, 1), "CONFLICT");
  s.publish(r.id, 2);
  const restored = s.rollback(r.id, 1, 2);
  assert.equal(restored.draft.name, "代码审查");
  assert.equal(restored.latestVersion, 2);
  assert.equal(restored.revision, 3);
  const v3 = s.publish(r.id, 3, "恢复 v1");
  assert.equal(v3.digest, v1.digest);
  assert.equal(v3.version, 3);
  assert.deepEqual(s.getVersion(r.id, 1), v1);
  assert.equal(s.versions(r.id).length, 3);
  code(() => s.publish(r.id, 3), "NO_CHANGES");
});
test("dependencies pin published versions and invalid publication rolls back", (t) => {
  const s = setup(t),
    skill = s.create(data()),
    flow = s.create({
      ...data("workflow"),
      references: [{ id: skill.id, version: 1 }],
    });
  code(() => s.publish(flow.id, 1), "VERSION_NOT_FOUND");
  assert.equal(s.versions(flow.id).length, 0);
  s.publish(skill.id, 1);
  s.publish(flow.id, 1);
  s.update(skill.id, data("skill", "v2"), 1);
  s.publish(skill.id, 2);
  assert.equal(s.getVersion(flow.id, 1).resource.references[0].version, 1);
});
test("file safety, size limits, types and empty publication are validated", (t) => {
  const s = setup(t);
  for (const path of [
    "../bad",
    "/etc/passwd",
    "a/../b",
    "C:/test",
    "a\\b",
    "a//b",
  ])
    code(
      () => s.create({ ...data(), files: [{ path, content: "x" }] }),
      "INVALID_PATH",
    );
  code(
    () =>
      s.create({
        ...data(),
        files: [
          { path: "a", content: "x" },
          { path: "a", content: "y" },
        ],
      }),
    "DUPLICATE_PATH",
  );
  code(
    () =>
      s.create({
        ...data(),
        files: [{ path: "big", content: "x".repeat(5 * 1024 * 1024 + 1) }],
      }),
    "TOO_LARGE",
  );
  code(
    () =>
      s.create({
        ...data(),
        files: [{ path: "a", content: "??", encoding: "base64" }],
      }),
    "INVALID_FILES",
  );
  code(() => s.create({ ...data(), type: "unsupported" }), "INVALID_TYPE");
  const r = s.create(data());
  code(() => s.update(r.id, data("agent"), 1), "TYPE_IMMUTABLE");
  const empty = s.create({ ...data(), files: [] });
  code(() => s.publish(empty.id, 1), "EMPTY_RESOURCE");
});
test("database survives restart and rejects stale edits from a second window", (t) => {
  const path = join(temp(t), "gallery.sqlite"),
    a = new SqliteGalleryStore(path),
    r = a.create(data());
  a.publish(r.id, 1);
  const b = new SqliteGalleryStore(path);
  a.update(r.id, data("skill", "新草稿"), 1);
  code(() => b.update(r.id, data(), 1), "CONFLICT");
  b.close();
  a.close();
  const c = new SqliteGalleryStore(path);
  try {
    assert.equal(c.getVersion(r.id, 1).resource.name, "代码审查");
    assert.equal(c.get(r.id).revision, 2);
  } finally {
    c.close();
  }
});
test("legacy migration removes membership and ownership while preserving all resources", (t) => {
  const path = join(temp(t), "legacy.sqlite"),
    old = legacy(path);
  old.db.close();
  const s = new SqliteGalleryStore(path);
  try {
    assert.ok(existsSync(s.backupPath));
    assert.equal(statSync(s.backupPath).mode & 0o777, 0o600);
    assert.equal(s.list().total, 2);
    assert.equal(s.get("old-skill").revision, 2);
    assert.equal(s.get("old-agent").draft.name, "旧草稿");
    assert.equal(s.getVersion("old-skill", 1).digest, old.hash);
    assert.equal(
      JSON.stringify(s.getVersion("old-skill", 1).resource),
      old.snapshot,
    );
    assert.equal(
      s.db
        .prepare(
          "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='members'",
        )
        .get().n,
      0,
    );
    assert.ok(
      !s.db
        .prepare("PRAGMA table_info(resources)")
        .all()
        .some((x) => x.name === "owner_id"),
    );
    assert.ok(
      !s.db
        .prepare("PRAGMA table_info(versions)")
        .all()
        .some((x) => x.name === "actor_id"),
    );
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM audit").get().n, 1);
    const backup = new DatabaseSync(s.backupPath, { readOnly: true });
    assert.equal(
      backup.prepare("SELECT COUNT(*) AS n FROM members").get().n,
      2,
    );
    backup.close();
    assert.equal(s.publish("old-skill", 2).version, 2);
  } finally {
    s.close();
  }
  const reopened = new SqliteGalleryStore(path);
  try {
    assert.equal(reopened.backupPath, undefined);
    assert.equal(reopened.versions("old-skill").length, 2);
  } finally {
    reopened.close();
  }
});
test("first local open imports a consistent legacy WAL snapshot and leaves the original untouched", async (t) => {
  const dir = temp(t),
    original = join(dir, "service.sqlite"),
    target = join(dir, "local.sqlite"),
    old = legacy(original);
  try {
    const s = await openGalleryStore({
      database: target,
      legacyDatabase: original,
    });
    assert.equal(s.list().total, 2);
    assert.equal(s.getVersion("old-skill", 1).digest, old.hash);
    s.update("old-skill", data("skill", "本地修改"), 2);
    s.close();
    assert.equal(
      old.db.prepare("SELECT name FROM members WHERE id='alice'").get().name,
      "Alice",
    );
    assert.equal(
      JSON.parse(
        old.db.prepare("SELECT draft FROM resources WHERE id='old-skill'").get()
          .draft,
      ).name,
      "未发布修改",
    );
    const again = await openGalleryStore({
      database: target,
      legacyDatabase: original,
    });
    assert.equal(again.get("old-skill").draft.name, "本地修改");
    again.close();
  } finally {
    old.db.close();
  }
});
test("reader SDK preserves pinned integration, supports async adapters and cancellation", async (t) => {
  const s = setup(t),
    r = s.create(data()),
    v = s.publish(r.id, 1);
  const adapter = new Proxy(s, {
    get(target, key) {
      const value = target[key];
      return typeof value === "function"
        ? async (...args) => value.apply(target, args)
        : value;
    },
  });
  const reader = new GalleryReader(adapter);
  assert.equal((await reader.listResources({ scope: "published" })).total, 1);
  assert.equal((await reader.listVersions(r.id)).items.length, 1);
  assert.equal((await reader.getResource(r.id)).id, r.id);
  assert.equal(
    (await reader.resolveReference({ id: r.id, version: 1, digest: v.digest }))
      .resource.files[0].path,
    "SKILL.md",
  );
  await assert.rejects(
    reader.resolveReference({ id: r.id, version: 1, digest: "bad" }),
    { code: "DIGEST_MISMATCH" },
  );
  const signal = AbortSignal.abort();
  await assert.rejects(reader.listResources({}, { signal }), {
    name: "AbortError",
  });
});
test("newer database schemas are rejected without modification", (t) => {
  const path = join(temp(t), "future.sqlite"),
    db = new DatabaseSync(path);
  db.exec("PRAGMA user_version=3");
  db.close();
  code(() => new SqliteGalleryStore(path), "SCHEMA_TOO_NEW");
  const check = new DatabaseSync(path);
  assert.equal(check.prepare("PRAGMA user_version").get().user_version, 3);
  check.close();
});
