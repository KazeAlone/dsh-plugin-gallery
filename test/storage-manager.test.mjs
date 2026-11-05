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
import { DESCRIPTORS } from "../src/descriptors.mjs";
const resource = {
  type: "skill",
  name: "资源",
  files: [{ path: "SKILL.md", content: "# Test" }],
};
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-registry-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { directory, manager: new StorageManager(directory) };
}
test("内部存储固定单库，没有创建或切换接口", (t) => {
  const { manager } = setup(t);
  assert.equal(manager.addLibrary, undefined);
  assert.equal(manager.switchLibrary, undefined);
  assert.equal(
    DESCRIPTORS.some((d) =>
      ["uiAddLibrary", "uiSwitchLibrary"].includes(d.method),
    ),
    false,
  );
  assert.equal(manager.settings().libraries.length, 1);
});
test("首次直接读取默认数据，确认配置后重启仍可使用", (t) => {
  const { manager, directory } = setup(t);
  const r = new LocalGalleryStore(
    join(directory, "resources.json"),
  ).createResource(resource);
  assert.equal(manager.settings().configured, false);
  assert.equal(manager.listResources().items[0].id, r.id);
  manager.configure();
  const restored = new StorageManager(directory);
  assert.equal(restored.settings().configured, true);
  assert.equal(restored.getResource(r.id).libraryId, "local");
});
test("旧多库配置不会影响默认库，确认后只保存单库配置", (t) => {
  const { manager } = setup(t);
  const r = manager.createResource(resource);
  writeFileSync(
    manager.path,
    JSON.stringify({
      format: 1,
      configured: true,
      activeLibraryId: "old",
      libraries: [{ id: "old", type: "internal", name: "旧资源库" }],
    }),
  );
  assert.equal(manager.settings().activeLibraryId, "local");
  assert.deepEqual(
    manager.settings().libraries.map((l) => l.id),
    ["local"],
  );
  assert.equal(manager.getResource(r.id).name, "资源");
  assert.throws(
    () => manager.resolveReference({ id: r.id, libraryId: "old" }),
    { code: "LIBRARY_NOT_FOUND" },
  );
  manager.configure();
  assert.deepEqual(
    JSON.parse(readFileSync(manager.path)).libraries.map((l) => l.id),
    ["local"],
  );
});
test("不可用后端及未知库不改变配置", (t) => {
  const { manager } = setup(t);
  manager.configure();
  const saved = readFileSync(manager.path, "utf8");
  assert.throws(() => manager.testConnection({ type: "service" }), {
    code: "PROVIDER_UNAVAILABLE",
  });
  assert.throws(() => manager.testConnection({ libraryId: "../outside" }), {
    code: "LIBRARY_NOT_FOUND",
  });
  assert.equal(readFileSync(manager.path, "utf8"), saved);
});
test("损坏资源和配置锁仍阻止写入", (t) => {
  const { manager, directory } = setup(t);
  writeFileSync(join(directory, "resources.json"), "broken");
  assert.throws(() => manager.configure(), SyntaxError);
  rmSync(join(directory, "resources.json"));
  mkdirSync(manager.path + ".lock");
  assert.throws(() => manager.configure(), { code: "CONFLICT" });
});
