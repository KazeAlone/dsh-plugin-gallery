import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalGalleryStore } from "../src/local-store.mjs";
const resource = (type = "skill", name = "示例") => ({
  type,
  name,
  description: "本地示例",
  tags: ["开发"],
  files: [{ path: "readme.txt", content: "内容" }],
});
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), "gallery-file-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "gallery", "resources.json");
  return { path, store: new LocalGalleryStore(path) };
}
test("本地文件支持四类资源、搜索、分页及重启持久化，无需身份", (t) => {
  const { store, path } = setup(t);
  assert.equal(store.listResources().total, 0);
  for (const type of ["skill", "agent", "mcp", "workflow"]) {
    const r = store.createResource(resource(type));
    assert.equal(r.canEdit, true);
    assert.equal(store.getResource(r.id).files[0].content, "内容");
  }
  const reopened = new LocalGalleryStore(path);
  assert.equal(reopened.listResources({ q: "开发" }).total, 4);
  assert.equal(reopened.listResources({ type: "mcp" }).total, 1);
  assert.equal(reopened.listResources({ limit: 2, offset: 2 }).items.length, 2);
  assert.equal(JSON.parse(readFileSync(path)).resources.length, 4);
});
test("独立存储实例防止过期覆盖，固定摘要检测变化，快照保持独立", (t) => {
  const { store, path } = setup(t);
  const r = store.createResource(resource());
  const other = new LocalGalleryStore(path);
  const snapshot = store.getSnapshot({ id: r.id, digest: r.digest });
  const updated = other.updateResource(
    r.id,
    resource("skill", "更新"),
    r.revision,
  );
  assert.equal(updated.revision, 2);
  assert.throws(() => store.updateResource(r.id, resource(), r.revision), {
    code: "CONFLICT",
  });
  assert.throws(() => store.resolveReference({ id: r.id, digest: r.digest }), {
    code: "DIGEST_MISMATCH",
  });
  assert.equal(snapshot.resource.name, "示例");
  assert.equal(store.getResource(r.id).name, "更新");
  assert.throws(() => store.updateResource(r.id, resource("mcp"), 2), {
    code: "TYPE_IMMUTABLE",
  });
});
test("损坏存储及并行写锁不会导致已有文件被覆盖", (t) => {
  const { store, path } = setup(t);
  store.createResource(resource());
  const saved = readFileSync(path, "utf8");
  mkdirSync(path + ".lock");
  assert.throws(() => store.createResource(resource()), { code: "CONFLICT" });
  assert.equal(readFileSync(path, "utf8"), saved);
  rmSync(path + ".lock", { recursive: true });
  writeFileSync(path, "{broken");
  assert.throws(() => store.createResource(resource()), SyntaxError);
  assert.equal(readFileSync(path, "utf8"), "{broken");
});
test("本地存储继续执行文件安全、资源大小和分页校验", (t) => {
  const { store } = setup(t);
  assert.throws(
    () =>
      store.createResource({
        ...resource(),
        files: [{ path: "../escape", content: "x" }],
      }),
    { code: "INVALID_PATH" },
  );
  assert.throws(() => store.listResources({ limit: 0 }), {
    code: "INVALID_PAGE",
  });
  assert.throws(() => store.getResource("missing"), { code: "NOT_FOUND" });
  assert.equal(store.listResources().total, 0);
});
