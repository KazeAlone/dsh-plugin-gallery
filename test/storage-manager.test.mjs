import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StorageManager } from "../src/storage-manager.mjs";
import { LocalGalleryStore } from "../src/local-store.mjs";
import { normalizeResource } from "../src/model.mjs";
const resource = (name = "资源") => ({
  type: "skill",
  name,
  files: [{ path: "SKILL.md", content: "# Test" }],
});
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-registry-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { directory, manager: new StorageManager(directory) };
}
test("首次默认内部存储，保留已有本地资源，选择后持久化", (t) => {
  const { manager, directory } = setup(t);
  const old = new LocalGalleryStore(
    join(directory, "resources.json"),
  ).createResource(resource());
  assert.equal(manager.settings().configured, false);
  assert.equal(manager.listResources().items[0].id, old.id);
  manager.switchLibrary({ libraryId: "local" });
  const restored = new StorageManager(directory);
  assert.equal(restored.settings().configured, true);
  assert.equal(restored.getResource(old.id).libraryId, "local");
  assert.equal(
    restored.settings().providers.filter((p) => p.available).length,
    1,
  );
});
test("添加不切换，切换不迁移，跨库固定引用及快照在重启后仍可解析", (t) => {
  const { manager, directory } = setup(t);
  const first = manager.createResource(resource("原资源"));
  const settings = manager.addLibrary({ name: "工作资源" });
  assert.equal(settings.activeLibraryId, "local");
  const id = settings.libraries[1].id;
  manager.switchLibrary({ libraryId: id });
  assert.equal(manager.listResources().total, 0);
  const second = manager.createResource(resource("新资源"));
  assert.equal(second.libraryId, id);
  assert.throws(() => manager.getResource(first.id), { code: "NOT_FOUND" });
  const ref = { libraryId: "local", id: first.id, digest: first.digest };
  assert.equal(manager.resolveReference(ref).name, "原资源");
  assert.equal(manager.getSnapshot(ref).libraryId, "local");
  assert.equal(
    new StorageManager(directory).getSnapshot(ref).resource.name,
    "原资源",
  );
  manager.switchLibrary({ libraryId: "local" });
  assert.equal(manager.listResources().total, 1);
  assert.equal(
    manager.resolveReference({ libraryId: id, id: second.id }).name,
    "新资源",
  );
});
test("未实现后端和无效资源库不改变当前配置", (t) => {
  const { manager } = setup(t);
  manager.switchLibrary({ libraryId: "local" });
  const saved = readFileSync(manager.path, "utf8");
  for (const type of ["github", "service"]) {
    assert.throws(() => manager.addLibrary({ type, name: "远程" }), {
      code: "PROVIDER_UNAVAILABLE",
    });
    assert.throws(() => manager.testConnection({ type }), {
      code: "PROVIDER_UNAVAILABLE",
    });
  }
  assert.throws(() => manager.switchLibrary({ libraryId: "../outside" }), {
    code: "LIBRARY_NOT_FOUND",
  });
  assert.equal(readFileSync(manager.path, "utf8"), saved);
});
test("目标损坏或配置加锁时切换失败，源资源与配置不变", (t) => {
  const { manager, directory } = setup(t);
  const r = manager.createResource(resource());
  const settings = manager.addLibrary({ name: "损坏的库" });
  const id = settings.libraries[1].id;
  const dir = join(directory, "libraries", id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "resources.json"), "broken");
  assert.throws(() => manager.switchLibrary({ libraryId: id }), SyntaxError);
  assert.equal(manager.settings().activeLibraryId, "local");
  assert.equal(manager.getResource(r.id).name, "资源");
  mkdirSync(manager.path + ".lock");
  assert.throws(() => manager.switchLibrary({ libraryId: "local" }), {
    code: "CONFLICT",
  });
});
test("资源引用规范化保留 libraryId，未知库不会退回当前库", (t) => {
  const { manager } = setup(t);
  const r = manager.createResource(resource());
  const ref = { libraryId: "local", id: r.id, digest: r.digest };
  assert.deepEqual(
    normalizeResource({ ...resource(), references: [ref] }).references,
    [ref],
  );
  assert.throws(
    () => manager.resolveReference({ ...ref, libraryId: "missing" }),
    { code: "LIBRARY_NOT_FOUND" },
  );
});
