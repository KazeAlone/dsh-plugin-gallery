import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SqliteGalleryStore } from "../src/store.mjs";
import { GalleryClient, serviceUrl } from "../src/client-api.mjs";
import { createGalleryServer } from "../src/server.mjs";
import { importLocalDatabase } from "../src/import-local.mjs";
import { VerifiedPlatformIdentityProvider } from "../src/identity.mjs";
import { digest, normalizeResource } from "../src/model.mjs";
const resource = (name = "示例") => ({
  type: "skill",
  name,
  files: [{ path: "SKILL.md", content: "# Skill", encoding: "utf8" }],
  tags: ["example"],
  metadata: {},
  references: [],
});
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), "gallery-auth-")),
    store = new SqliteGalleryStore(join(dir, "gallery.sqlite"));
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const enroll = (name, options) =>
    store.redeemCode(store.issueCode(options).code, name);
  return { store, enroll, dir };
}
async function service(t, store, provider) {
  const server = createGalleryServer({
    store,
    ...(provider ? { identityProvider: provider } : {}),
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(
    () =>
      new Promise((r) => {
        server.closeAllConnections();
        server.close(r);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}
const throwsCode = (fn, code) => assert.throws(fn, (e) => e.code === code);
const rejectsCode = (fn, code) => assert.rejects(fn, (e) => e.code === code);
test("接入码单次使用、过期与恢复；服务端仅保存摘要", (t) => {
  const { store, enroll } = setup(t),
    code = store.issueCode();
  const a = store.redeemCode(code.code, "成员甲");
  assert.equal(a.identity.subject, code.subject);
  throwsCode(() => store.redeemCode(code.code, "冒用者"), "INVALID_CODE");
  assert.equal(
    store.db.prepare("SELECT hash FROM credentials").get().hash,
    digest(a.credential),
  );
  const expired = store.issueCode();
  store.db
    .prepare("UPDATE enrollment_codes SET expires_at=0 WHERE hash=?")
    .run(digest(expired.code));
  throwsCode(() => store.redeemCode(expired.code, "甲"), "INVALID_CODE");
  const b = enroll("成员甲");
  assert.notEqual(a.identity.subject, b.identity.subject);
  const recovery = store.issueCode({ subject: a.identity.subject });
  const recovered = store.redeemCode(recovery.code, "甲改名");
  assert.equal(recovered.identity.subject, a.identity.subject);
  throwsCode(() => store.authenticate(a.credential), "UNAUTHORIZED");
  assert.equal(store.authenticate(recovered.credential).displayName, "甲改名");
  throwsCode(() => store.issueCode({ subject: "fake" }), "IDENTITY_NOT_FOUND");
});
test("同名身份不能越权；只修改自己的资源；并发修改校验", (t) => {
  const { store, enroll } = setup(t),
    a = enroll("同名").identity,
    b = enroll("同名").identity;
  const r = store.create(a, { ...resource(), owner: b, tenantId: "forged" });
  assert.equal(r.owner.subject, a.subject);
  assert.equal(r.canEdit, true);
  assert.equal(store.get(b, r.id).canEdit, false);
  assert.equal(store.list(b).total, 1);
  assert.equal(store.list(b, { scope: "mine" }).total, 0);
  throwsCode(
    () => store.update(b, r.id, resource("被篡改"), r.revision),
    "FORBIDDEN",
  );
  const changed = store.update(a, r.id, resource("新内容"), r.revision);
  assert.equal(changed.name, "新内容");
  assert.notEqual(changed.digest, r.digest);
  throwsCode(() => store.update(a, r.id, resource(), r.revision), "CONFLICT");
  const other = enroll("其他空间", { tenantId: "other" }).identity;
  assert.equal(store.list(other).total, 0);
  throwsCode(() => store.get(other, r.id), "NOT_FOUND");
});
test("HTTP 身份验证、共享读写及摘要引用，不提供版本和管理路由", async (t) => {
  const { store } = setup(t),
    url = await service(t, store),
    anon = new GalleryClient({ url });
  await rejectsCode(() => anon.listResources(), "UNAUTHORIZED");
  const forged = await fetch(url + "/v1/identity/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...store.issueCode(),
      displayName: "甲",
      subject: "fake",
      tenantId: "hijack",
      issuer: "fake",
    }),
  });
  const first = await forged.json();
  assert.equal(first.identity.tenantId, "default");
  assert.notEqual(first.identity.subject, "fake");
  const a = new GalleryClient({ url, credential: first.credential });
  const second = await anon.enroll({
      code: store.issueCode().code,
      displayName: "乙",
    }),
    b = new GalleryClient({ url, credential: second.credential });
  const r = await a.createResource(resource()),
    snapshot = await a.getSnapshot({ id: r.id, digest: r.digest });
  assert.equal((await b.listResources()).total, 1);
  await rejectsCode(
    () => b.updateResource(r.id, resource(), r.revision),
    "FORBIDDEN",
  );
  await a.updateResource(r.id, resource("新名称"), r.revision);
  await rejectsCode(
    () => a.resolveReference({ id: r.id, digest: r.digest }),
    "DIGEST_MISMATCH",
  );
  assert.equal(snapshot.resource.name, "示例");
  for (const path of [
    `/v1/resources/${r.id}/versions`,
    `/v1/resources/${r.id}/publish`,
    "/v1/members",
    "/v1/identity/issue-code",
  ])
    assert.equal(
      (
        await fetch(url + path, {
          headers: { Authorization: `Bearer ${first.credential}` },
        })
      ).status,
      404,
    );
  assert.equal(
    (
      await fetch(url + "/v1/resources", {
        headers: {
          Origin: "https://untrusted.invalid",
          Authorization: `Bearer ${first.credential}`,
        },
      })
    ).status,
    403,
  );
  await rejectsCode(
    () => anon.enroll({ code: "gx_invalid", displayName: "甲" }),
    "INVALID_CODE",
  );
});
test("同一接入码并发兑换仅成功一次", async (t) => {
  const { store } = setup(t),
    url = await service(t, store),
    client = new GalleryClient({ url }),
    code = store.issueCode().code;
  const results = await Promise.allSettled([
    client.enroll({ code, displayName: "甲" }),
    client.enroll({ code, displayName: "乙" }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
});
test("旧资源迁移备份、历史档案保留、无主资源不能自行认领", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "gallery-migration-")),
    file = join(dir, "old.sqlite"),
    old = new DatabaseSync(file);
  old.exec(
    "CREATE TABLE resources(id TEXT PRIMARY KEY,type TEXT,draft TEXT,revision INTEGER,published_revision INTEGER,created_at TEXT,updated_at TEXT);CREATE TABLE versions(resource_id TEXT,version INTEGER,snapshot TEXT);PRAGMA user_version=2",
  );
  const oldResource = resource("历史资源");
  old
    .prepare("INSERT INTO resources VALUES(?,?,?,?,?,?,?)")
    .run(
      "old",
      "skill",
      JSON.stringify(oldResource),
      3,
      3,
      "2026-01-01",
      "2026-01-02",
    );
  old
    .prepare("INSERT INTO versions VALUES(?,?,?)")
    .run("old", 1, JSON.stringify(oldResource));
  old.close();
  const store = new SqliteGalleryStore(file);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  assert.ok(existsSync(store.backupPath));
  assert.equal(statSync(store.backupPath).mode & 0o777, 0o600);
  const a = store.redeemCode(store.issueCode().code, "甲").identity,
    r = store.get(a, "old");
  assert.equal(r.owner, null);
  assert.equal(r.name, "历史资源");
  assert.equal(r.files[0].content, "# Skill");
  assert.equal(
    store.db.prepare("SELECT count(*) AS n FROM legacy_versions").get().n,
    1,
  );
  throwsCode(() => store.update(a, "old", resource(), 3), "FORBIDDEN");
  throwsCode(
    () => store.assignUnowned("old", { subject: "fake" }),
    "IDENTITY_NOT_FOUND",
  );
  store.assignUnowned("old", { subject: a.subject });
  assert.equal(store.get(a, "old").canEdit, true);
  throwsCode(
    () => store.assignUnowned("old", { subject: a.subject }),
    "ALREADY_OWNED",
  );
});
test("外部平台只接受维护者注入的可信验证器，不接受浏览器自报身份", async (t) => {
  const { store } = setup(t);
  assert.throws(() => new VerifiedPlatformIdentityProvider());
  // Fixture verifier models the boundary; production must verify platform signatures and claims.
  const provider = new VerifiedPlatformIdentityProvider((req) => {
    assert.equal(req.headers.authorization, "Bearer trusted-fixture");
    return {
      issuer: "platform",
      subject: "person-1",
      tenantId: "tenant-1",
      displayName: "平台成员",
    };
  });
  const url = await service(t, store, provider),
    client = new GalleryClient({ url, credential: "trusted-fixture" });
  const r = await client.createResource(resource());
  assert.equal(r.owner.issuer, "platform");
  assert.equal(r.owner.tenantId, "tenant-1");
  await rejectsCode(
    () => client.enroll({ code: "unused", displayName: "x" }),
    "NOT_FOUND",
  );
});
test("文件路径、大小、编码及共享地址边界", () => {
  for (const path of ["../secret", "/etc/passwd", "C:/secret", "a\\b"])
    throwsCode(
      () =>
        normalizeResource({ ...resource(), files: [{ path, content: "x" }] }),
      "INVALID_PATH",
    );
  throwsCode(
    () =>
      normalizeResource({
        ...resource(),
        files: [{ path: "a", content: "!", encoding: "base64" }],
      }),
    "INVALID_FILES",
  );
  throwsCode(
    () =>
      normalizeResource({
        ...resource(),
        files: [{ path: "a", content: "x".repeat(5 * 1024 * 1024 + 1) }],
      }),
    "TOO_LARGE",
  );
  for (const url of [
    "http://example.com",
    "https://a:b@example.com",
    "https://example.com/?secret=x",
  ])
    throwsCode(
      () => serviceUrl(url),
      url.startsWith("http:") ? "INSECURE_URL" : "INVALID_URL",
    );
  assert.equal(
    serviceUrl("https://gallery.example.com"),
    "https://gallery.example.com",
  );
});

test("导入包含 WAL 的一致快照并拒绝覆盖已有目标", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "gallery-import-")),
    source = join(dir, "source.sqlite"),
    target = join(dir, "shared.sqlite");
  const db = new DatabaseSync(source);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  db.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE fixture(value TEXT); INSERT INTO fixture VALUES('committed-in-wal')",
  );
  await importLocalDatabase(source, target);
  const copy = new DatabaseSync(target, { readOnly: true });
  assert.equal(
    copy.prepare("SELECT value FROM fixture").get().value,
    "committed-in-wal",
  );
  copy.close();
  await assert.rejects(
    () => importLocalDatabase(source, target),
    (e) => e.code === "EEXIST",
  );
  assert.equal(db.prepare("SELECT count(*) AS n FROM fixture").get().n, 1);
  assert.equal(statSync(target).mode & 0o777, 0o600);
});
