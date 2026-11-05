import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StorageManager } from "../src/storage-manager.mjs";
import { DESCRIPTORS } from "../src/descriptors.mjs";
const resource = {
  type: "skill",
  name: "review",
  files: [{ path: "SKILL.md", content: "# Review" }],
};
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-usage-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { directory, store: new StorageManager(directory) };
}
test("only explicit actual-use reports count, retries deduplicate across restarts and edits", (t) => {
  const { directory, store } = setup(t);
  const r = store.createResource(resource);
  assert.equal(r.usageCount, 0);
  store.getResource(r.id);
  store.getSnapshot({ id: r.id });
  store.resolveReference({ id: r.id });
  assert.equal(store.listResources().items[0].usageCount, 0);
  assert.equal(
    store.recordSkillUse({ id: r.id, usageId: "consumer:task:1" }).usageCount,
    1,
  );
  const reopened = new StorageManager(directory);
  assert.equal(
    reopened.recordSkillUse({ id: r.id, usageId: "consumer:task:1" })
      .usageCount,
    1,
  );
  assert.equal(
    reopened.recordSkillUse({ id: r.id, usageId: "consumer:task:2" })
      .usageCount,
    2,
  );
  const counted = store.getResource(r.id);
  for (const key of ["digest", "revision", "updatedAt"])
    assert.equal(counted[key], r[key]);
  assert.equal("usageEventIds" in counted, false);
  assert.equal("usageEventIds" in store.listResources().items[0], false);
  assert.equal("usageCount" in store.getSnapshot({ id: r.id }).resource, false);
  const updated = store.updateResource(
    r.id,
    { ...resource, name: "updated", usageCount: 999, usageEventIds: [] },
    r.revision,
  );
  assert.equal(updated.usageCount, 2);
  assert.equal(
    store.recordSkillUse({ id: r.id, usageId: "consumer:task:1" }).usageCount,
    2,
  );
  assert.equal(
    store.createResource({ ...resource, usageCount: 999 }).usageCount,
    0,
  );
  assert.equal(
    readFileSync(join(directory, "resources.json"), "utf8").includes(
      "consumer:task:1",
    ),
    false,
  );
});
test("usage validates target and id, lock protects data, browser cannot increment", (t) => {
  const { directory, store } = setup(t);
  const r = store.createResource(resource),
    agent = store.createResource({ ...resource, type: "agent" });
  for (const input of [
    { id: r.id },
    { id: r.id, usageId: " " },
    { id: r.id, usageId: "x".repeat(201) },
    { id: agent.id, usageId: "x" },
    { id: "missing", usageId: "x" },
    { id: r.id, usageId: "x", libraryId: "other" },
  ])
    assert.throws(() => store.recordSkillUse(input));
  assert.equal(store.getResource(r.id).usageCount, 0);
  const before = readFileSync(join(directory, "resources.json"), "utf8");
  mkdirSync(join(directory, "resources.json.lock"));
  assert.throws(
    () => store.recordSkillUse({ id: r.id, usageId: "x" }),
    (e) => e.code === "CONFLICT",
  );
  assert.equal(readFileSync(join(directory, "resources.json"), "utf8"), before);
  assert.equal(
    DESCRIPTORS.some((d) => /usage|recordSkillUse/i.test(d.method)),
    false,
  );
});
