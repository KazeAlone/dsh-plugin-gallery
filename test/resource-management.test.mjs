import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StorageManager } from "../src/storage-manager.mjs";
import { createSkillProvider } from "../src/skill-provider.mjs";
const input = {
  type: "skill",
  name: "review",
  description: "Review",
  files: [{ path: "SKILL.md", content: "# Review" }],
};
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-manage-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { directory, store: new StorageManager(directory) };
}
test("creator comes from local profile, persists and cannot be overwritten by edits or imports", (t) => {
  const { directory, store } = setup(t);
  assert.ok(store.username());
  store.setUsername(" Alice ");
  const r = store.createResource({ ...input, creator: { username: "Forged" } });
  assert.deepEqual(r.creator, { username: "Alice" });
  store.setUsername("Bob");
  const updated = store.updateResource(
    r.id,
    { ...input, creator: { username: "Forged" } },
    r.revision,
  );
  assert.equal(updated.creator.username, "Alice");
  assert.equal(store.createResource(input).creator.username, "Bob");
  assert.equal(new StorageManager(directory).username(), "Bob");
  assert.equal(
    store.listResources().items.find((x) => x.id === r.id).creator.username,
    "Alice",
  );
  for (const username of ["", " ", "x".repeat(81), "a\nb"])
    assert.throws(() => store.setUsername(username));
  assert.equal(store.username(), "Bob");
});
test("delete removes resource, usage and provider discovery but protects changed revisions", async (t) => {
  const { directory, store } = setup(t);
  const provider = createSkillProvider(store);
  const r = store.createResource(input);
  store.recordSkillUse({ id: r.id, usageId: "run-1" });
  const next = store.updateResource(r.id, input, r.revision);
  assert.throws(
    () => store.deleteResource(r.id, r.revision),
    (e) => e.code === "CONFLICT",
  );
  assert.equal((await provider.list()).length, 1);
  store.deleteResource(r.id, next.revision);
  assert.equal(store.listResources().total, 0);
  assert.equal((await provider.list()).length, 0);
  assert.throws(
    () => new StorageManager(directory).getResource(r.id),
    (e) => e.code === "NOT_FOUND",
  );
  assert.equal(
    readFileSync(join(directory, "resources.json"), "utf8").includes(r.id),
    false,
  );
  assert.throws(
    () => store.deleteResource(r.id, next.revision),
    (e) => e.code === "NOT_FOUND",
  );
});
test("delete honors storage lock and requires a revision", (t) => {
  const { directory, store } = setup(t);
  const r = store.createResource(input);
  assert.throws(() => store.deleteResource(r.id));
  mkdirSync(join(directory, "resources.json.lock"));
  assert.throws(
    () => store.deleteResource(r.id, r.revision),
    (e) => e.code === "CONFLICT",
  );
  assert.equal(store.getResource(r.id).name, "review");
});
