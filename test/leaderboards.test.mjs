import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StorageManager } from "../src/storage-manager.mjs";
test("leaderboards rank the entire category before limiting, retain creators and search", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "gallery-rank-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = new StorageManager(dir);
  store.setUsername("Alice");
  const first = store.createResource({
    type: "skill",
    name: "old-winner",
    description: "Review",
    files: [],
  });
  for (let i = 0; i < 55; i++)
    store.createResource({ type: "skill", name: `new-${i}`, files: [] });
  for (let i = 0; i < 3; i++)
    store.recordSkillUse({ id: first.id, usageId: `run-${i}` });
  store.createResource({ type: "agent", name: "agent", files: [] });
  const board = store.listResources({
    type: "skill",
    sort: "usage",
    limit: 10,
  });
  assert.equal(board.total, 56);
  assert.equal(board.items.length, 10);
  assert.equal(board.items[0].id, first.id);
  assert.equal(board.items[0].usageCount, 3);
  assert.equal(board.items[0].creator.username, "Alice");
  assert.equal(store.listResources({ type: "agent", sort: "usage" }).total, 1);
  assert.equal(
    store.listResources({ type: "skill", q: "alice", sort: "usage" }).total,
    56,
  );
  assert.equal(store.listResources({ q: "missing", sort: "usage" }).total, 0);
  assert.deepEqual(
    store
      .listResources({ type: "skill", sort: "usage", limit: 10 })
      .items.map((r) => r.id),
    board.items.map((r) => r.id),
  );
  assert.throws(
    () => store.listResources({ sort: "invalid" }),
    (e) => e.code === "INVALID_SORT",
  );
});
