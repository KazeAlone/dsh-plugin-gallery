import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteGalleryStore } from "../src/store.mjs";
import { createGalleryServer } from "../src/server.mjs";
import { GalleryClient, validateEndpoint } from "../src/client-api.mjs";

const data = (type = "skill", name = "代码审查") => ({
  type,
  name,
  description: "团队审查说明",
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
function setup(t, path = ":memory:") {
  const store = new SqliteGalleryStore(path);
  t.after(() => store.close());
  const admin = store.bootstrap("管理员"),
    alice = store.addMember(admin.member, { name: "Alice" }),
    bob = store.addMember(admin.member, { name: "Bob" });
  return { store, admin, alice, bob };
}
const code = (fn, c) => assert.throws(fn, (e) => e.code === c);
test("bootstrap, member authorization, token hashing and revocation", (t) => {
  const { store, admin, alice, bob } = setup(t);
  assert.equal(store.authenticate(alice.token).id, alice.member.id);
  code(() => store.authenticate("wrong-token"), "UNAUTHORIZED");
  code(() => store.bootstrap("again"), "ALREADY_INITIALIZED");
  code(
    () => store.addMember(alice.member, { name: "intruder", role: "admin" }),
    "FORBIDDEN",
  );
  code(() => store.listMembers(bob.member), "FORBIDDEN");
  assert.ok(
    !JSON.stringify(store.listMembers(admin.member)).includes(alice.token),
  );
  assert.notEqual(
    store.db
      .prepare("SELECT token_hash FROM members WHERE id=?")
      .get(alice.member.id).token_hash,
    alice.token,
  );
  const rotated = store.rotateMember(admin.member, alice.member.id);
  code(() => store.authenticate(alice.token), "UNAUTHORIZED");
  assert.equal(store.authenticate(rotated.token).name, "Alice");
  store.rotateMember(admin.member, bob.member.id, false);
  code(() => store.authenticate(bob.token), "UNAUTHORIZED");
  code(
    () => store.rotateMember(admin.member, admin.member.id, false),
    "SELF_REVOKE",
  );
});
test("four resource types, drafts private, published versions team-readable", (t) => {
  const { store, alice, bob, admin } = setup(t);
  for (const type of ["skill", "agent", "mcp", "workflow"]) {
    const r = store.create(alice.member, {
      ...data(type),
      ownerId: bob.member.id,
    });
    assert.equal(r.ownerId, alice.member.id);
    code(() => store.get(bob.member, r.id), "NOT_FOUND");
    store.publish(alice.member, r.id, r.revision, "首次发布");
    const shared = store.get(bob.member, r.id);
    assert.equal(shared.draft, null);
    assert.equal(shared.canEdit, false);
    assert.equal(shared.published.resource.type, type);
  }
  assert.equal(store.list(bob.member).total, 4);
  assert.equal(store.list(bob.member, { type: "skill" }).total, 1);
  assert.equal(store.list(bob.member, { q: "Alice" }).total, 4);
  assert.equal(store.list(admin.member, { scope: "mine" }).total, 0);
});
test("author/admin write policy, optimistic concurrency and no draft leakage", (t) => {
  const { store, alice, bob, admin } = setup(t),
    r = store.create(alice.member, data());
  code(() => store.update(bob.member, r.id, data(), 1), "FORBIDDEN");
  code(() => store.publish(bob.member, r.id, 1), "FORBIDDEN");
  store.publish(alice.member, r.id, 1);
  const changed = store.update(
    admin.member,
    r.id,
    data("skill", "尚未发布的秘密名称"),
    1,
  );
  assert.equal(changed.revision, 2);
  assert.equal(store.get(bob.member, r.id).name, "代码审查");
  assert.equal(store.list(bob.member, { q: "秘密名称" }).total, 0);
  code(() => store.update(alice.member, r.id, data(), 1), "CONFLICT");
  code(() => store.publish(alice.member, r.id, 1), "CONFLICT");
  assert.equal(store.publish(admin.member, r.id, 2).version, 2);
  code(() => store.publish(admin.member, r.id, 2), "NO_CHANGES");
});
test("published snapshots immutable; rollback creates a draft, then a new version", (t) => {
  const { store, alice, bob } = setup(t),
    r = store.create(alice.member, data());
  const v1 = store.publish(alice.member, r.id, 1);
  store.update(alice.member, r.id, data("skill", "第二版"), 1);
  store.publish(alice.member, r.id, 2);
  code(() => store.rollback(bob.member, r.id, 1, 2), "FORBIDDEN");
  const restored = store.rollback(alice.member, r.id, 1, 2);
  assert.equal(restored.draft.name, "代码审查");
  assert.equal(restored.latestVersion, 2);
  assert.equal(restored.revision, 3);
  const v3 = store.publish(alice.member, r.id, 3, "恢复 v1");
  assert.equal(v3.version, 3);
  assert.equal(v3.digest, v1.digest);
  assert.deepEqual(store.getVersion(bob.member, r.id, 1), v1);
});
test("published dependency references are pinned and publication is atomic", (t) => {
  const { store, alice } = setup(t),
    skill = store.create(alice.member, data()),
    workflow = store.create(alice.member, {
      ...data("workflow"),
      references: [{ id: skill.id, version: 1 }],
    });
  code(() => store.publish(alice.member, workflow.id, 1), "VERSION_NOT_FOUND");
  assert.equal(store.versions(alice.member, workflow.id).length, 0);
  store.publish(alice.member, skill.id, 1);
  const result = store.publish(alice.member, workflow.id, 1);
  assert.deepEqual(result.resource.references, [{ id: skill.id, version: 1 }]);
  store.update(alice.member, skill.id, data("skill", "v2"), 1);
  store.publish(alice.member, skill.id, 2);
  assert.equal(
    store.getVersion(alice.member, workflow.id, 1).resource.references[0]
      .version,
    1,
  );
});
test("file paths, duplicate names, file size, schema and type changes rejected", (t) => {
  const { store, alice } = setup(t);
  for (const path of [
    "../bad",
    "/etc/passwd",
    "a/../b",
    "C:/test",
    "a\\b",
    "a//b",
  ])
    code(
      () =>
        store.create(alice.member, {
          ...data(),
          files: [{ path, content: "x" }],
        }),
      "INVALID_PATH",
    );
  code(
    () =>
      store.create(alice.member, {
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
      store.create(alice.member, {
        ...data(),
        files: [{ path: "big", content: "x".repeat(5 * 1024 * 1024 + 1) }],
      }),
    "TOO_LARGE",
  );
  code(
    () =>
      store.create(alice.member, {
        ...data(),
        files: [{ path: "a", content: "??", encoding: "base64" }],
      }),
    "INVALID_FILES",
  );
  code(
    () => store.create(alice.member, { ...data(), type: "unsupported" }),
    "INVALID_TYPE",
  );
  const r = store.create(alice.member, data());
  code(
    () => store.update(alice.member, r.id, data("agent"), 1),
    "TYPE_IMMUTABLE",
  );
  const empty = store.create(alice.member, { ...data(), files: [] });
  code(() => store.publish(alice.member, empty.id, 1), "EMPTY_RESOURCE");
});
test("storage survives restart and rejects edits from stale second connection", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "gallery-")),
    path = join(dir, "gallery.sqlite");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const a = new SqliteGalleryStore(path),
    admin = a.bootstrap("Admin"),
    r = a.create(admin.member, data());
  a.publish(admin.member, r.id, 1);
  const b = new SqliteGalleryStore(path);
  a.update(admin.member, r.id, data("skill", "new"), 1);
  code(() => b.update(admin.member, r.id, data(), 1), "CONFLICT");
  b.close();
  a.close();
  const c = new SqliteGalleryStore(path);
  try {
    assert.equal(c.authenticate(admin.token).role, "admin");
    assert.equal(c.getVersion(admin.member, r.id, 1).resource.name, "代码审查");
    assert.equal(c.get(admin.member, r.id).revision, 2);
  } finally {
    c.close();
  }
});
test("two independently authenticated clients: CRUD, sharing, rollback, SDK resolution", async (t) => {
  const { store, admin, alice, bob } = setup(t),
    server = createGalleryServer(store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}`,
    A = new GalleryClient({ url, token: alice.token }),
    B = new GalleryClient({ url, token: bob.token }),
    C = new GalleryClient({ url, token: admin.token });
  const r = await A.createResource(data());
  await assert.rejects(B.getResource(r.id), { code: "NOT_FOUND" });
  await assert.rejects(B.updateDraft(r.id, data(), 1), { code: "FORBIDDEN" });
  const v = await A.publish(r.id, 1, "shared");
  assert.equal((await B.listResources()).total, 1);
  assert.equal(
    (await B.resolveReference({ id: r.id, version: 1, digest: v.digest }))
      .resource.files[0].content,
    data().files[0].content,
  );
  await assert.rejects(
    B.resolveReference({ id: r.id, version: 1, digest: "wrong" }),
    { code: "DIGEST_MISMATCH" },
  );
  await A.updateDraft(r.id, data("skill", "new"), 1);
  await A.publish(r.id, 2);
  await C.rollback(r.id, 1, 2);
  assert.equal((await A.getResource(r.id)).draft.name, "代码审查");
  await assert.rejects(
    B.request("POST", "/v1/members", { name: "unauthorized" }),
    { code: "FORBIDDEN" },
  );
  const newMember = await C.request("POST", "/v1/members", { name: "Charlie" });
  assert.equal(newMember.member.name, "Charlie");
  const raw = await fetch(url + "/v1/resources");
  assert.equal(raw.status, 401);
  const malformed = await fetch(url + "/v1/resources", {
    method: "POST",
    headers: { Authorization: `Bearer ${alice.token}` },
    body: "{broken",
  });
  assert.equal(malformed.status, 400);
});
test("endpoint validation protects member credentials and refuses silent redirects", () => {
  assert.equal(validateEndpoint("https://example.com/"), "https://example.com");
  assert.equal(
    validateEndpoint("http://127.0.0.1:4318"),
    "http://127.0.0.1:4318",
  );
  for (const url of [
    "http://remote.example",
    "https://a:b@example.com",
    "file:///tmp/test",
    "https://example.com?token=x",
  ])
    assert.throws(() => validateEndpoint(url));
});

test("HTTP contract supports an asynchronous storage adapter", async (t) => {
  const { store, alice } = setup(t);
  const asyncStore = new Proxy(store, {
    get(target, key) {
      const value = target[key];
      return typeof value === "function"
        ? async (...args) => value.apply(target, args)
        : value;
    },
  });
  const server = createGalleryServer(asyncStore);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const client = new GalleryClient({
    url: `http://127.0.0.1:${server.address().port}`,
    token: alice.token,
  });
  assert.equal((await client.me()).name, "Alice");
  const draft = await client.createResource(data("agent", "Async adapter"));
  await client.publish(draft.id, 1);
  assert.equal((await client.listResources()).items[0].name, "Async adapter");
  assert.equal((await client.listVersions(draft.id)).items.length, 1);
  assert.equal((await client.getVersion(draft.id, 1)).resource.type, "agent");
});
