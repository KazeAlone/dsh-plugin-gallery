import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { StorageManager } from "../src/storage-manager.mjs";
import {
  workflowSharingStatus,
  uploadWorkflowTemplate,
} from "../src/workflow-sharing.mjs";
const definition = JSON.parse(
  readFileSync(
    new URL("./fixtures/workflow-gated.json", import.meta.url),
    "utf8",
  ),
);
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-sharing-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const store = new StorageManager(directory);
  store.configure();
  store.setUsername("Alice");
  const rows = new Map(),
    created = [];
  const remote = {
    async getResource(id) {
      if (!rows.has(id))
        throw Object.assign(new Error("missing"), { status: 404 });
      return rows.get(id);
    },
    async createResource(input, creator) {
      const row = { ...input, id: randomUUID(), canEdit: true, creator };
      created.push(row);
      rows.set(row.id, row);
      return row;
    },
  };
  return {
    store,
    rows,
    created,
    remote,
    connect() {
      store.change((config) => {
        config.service = {
          url: "http://center.internal:8088",
          token: "guser_fixture_only",
          userId: "user-one",
        };
      });
    },
  };
}
test("workflow uploads require a configured independent center identity and never fall back locally", async (t) => {
  const { store } = setup(t);
  assert.equal(workflowSharingStatus(store).configured, false);
  await assert.rejects(
    uploadWorkflowTemplate(store, definition, { id: "source", version: 1 }),
    { code: "CENTER_NOT_CONFIGURED" },
  );
  assert.equal(store.listResources().total, 0);
  assert.equal(store.read().activeLibraryId, "local");
});
test("shared uploads preserve portable fields, attribution and current local selection; retries do not overwrite edits", async (t) => {
  const { store, connect, remote, rows, created } = setup(t);
  connect();
  const original = structuredClone(definition),
    source = { id: "personal-template", version: 1 };
  const first = await uploadWorkflowTemplate(
    store,
    definition,
    source,
    () => remote,
  );
  assert.equal(first.libraryId, "center");
  assert.equal(first.reused, false);
  assert.equal(store.read().activeLibraryId, "local");
  assert.equal(store.listResources().total, 0);
  assert.deepEqual(JSON.parse(created[0].files[0].content), definition);
  assert.deepEqual(definition, original);
  assert.deepEqual(created[0].creator, { username: "Alice" });
  assert.deepEqual(created[0].metadata.teamflowSource, source);
  assert.ok(!JSON.stringify(created[0]).includes("guser_fixture_only"));
  rows.get(first.id).name = "Edited in Gallery";
  const again = await uploadWorkflowTemplate(
    store,
    definition,
    source,
    () => remote,
  );
  assert.equal(again.id, first.id);
  assert.equal(again.name, "Edited in Gallery");
  assert.equal(again.reused, true);
  assert.equal(created.length, 1);
  assert.equal(
    statSync(join(store.directory, "workflow-uploads.json")).mode & 0o777,
    0o600,
  );
  const second = await uploadWorkflowTemplate(
    store,
    { ...definition, name: "New version" },
    { id: source.id, version: 2 },
    () => remote,
  );
  assert.notEqual(second.id, first.id);
  assert.equal(created.length, 2);
  assert.equal(rows.get(first.id).name, "Edited in Gallery");
});
test("ownership, deleted copies, changed same-version content and malformed registries are handled safely", async (t) => {
  const { store, connect, remote, rows, created } = setup(t);
  connect();
  const source = { id: "source", version: 1 };
  const first = await uploadWorkflowTemplate(
    store,
    definition,
    source,
    () => remote,
  );
  rows.get(first.id).canEdit = false;
  await assert.rejects(
    uploadWorkflowTemplate(store, definition, source, () => remote),
    { code: "UPLOAD_NOT_OWNED" },
  );
  assert.equal(created.length, 1);
  rows.delete(first.id);
  const recreated = await uploadWorkflowTemplate(
    store,
    definition,
    source,
    () => remote,
  );
  assert.notEqual(recreated.id, first.id);
  await assert.rejects(
    uploadWorkflowTemplate(
      store,
      { ...definition, name: "Changed" },
      source,
      () => remote,
    ),
    { code: "SOURCE_VERSION_CHANGED" },
  );
  writeFileSync(
    join(store.directory, "workflow-uploads.json"),
    JSON.stringify({ format: 99 }),
  );
  await assert.rejects(
    uploadWorkflowTemplate(store, definition, source, () => remote),
    { code: "INVALID_UPLOAD_REGISTRY" },
  );
});
test("invalid versions and incomplete templates never reach the center", async (t) => {
  const { store, connect, remote, created } = setup(t);
  connect();
  for (const source of [
    { id: "source", version: 0 },
    { id: "source", version: 1, language: "xx" },
  ])
    await assert.rejects(
      uploadWorkflowTemplate(store, definition, source, () => remote),
      { code: "INVALID_TEMPLATE_SOURCE" },
    );
  const draft = structuredClone(definition);
  draft.tasks[0].general.requirements = "";
  await assert.rejects(
    uploadWorkflowTemplate(
      store,
      draft,
      { id: "source", version: 1 },
      () => remote,
    ),
    { code: "INCOMPLETE_TEMPLATE" },
  );
  assert.equal(created.length, 0);
});
