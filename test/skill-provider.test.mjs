import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StorageManager } from "../src/storage-manager.mjs";
import {
  createSkillProvider,
  materializeSkill,
} from "../src/skill-provider.mjs";
import { createGalleryTrigger } from "../src/client/gallery-trigger.mjs";
const skill = {
  type: "skill",
  name: "review",
  description: "Review code",
  files: [
    {
      path: "SKILL.md",
      content: "---\nname: review\ndescription: Review code\n---\n# Review",
    },
    { path: "assets/icon.bin", encoding: "base64", content: "AAEC/w==" },
  ],
};
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "gallery-provider-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const store = new StorageManager(directory);
  return { directory, store, provider: createSkillProvider(store) };
}
test("provider lists valid Skills, preserves invocation policy and produces immutable attachment bundles", async (t) => {
  const { store, provider } = setup(t);
  const r = store.createResource(skill);
  store.createResource({ ...skill, type: "agent" });
  store.createResource({ ...skill, files: [] });
  const rows = await provider.list();
  assert.equal(rows.length, 1);
  const loaded = await provider.get(rows[0]);
  assert.match(loaded.content, /^# Review/);
  assert.match(loaded.content, /## Gallery 附件/);
  assert.ok(
    loaded.content.includes(join(loaded.resourceBase.path, "assets/icon.bin")),
  );
  assert.deepEqual(
    readFileSync(join(loaded.resourceBase.path, "assets/icon.bin")),
    Buffer.from([0, 1, 2, 255]),
  );
  assert.equal(
    (await provider.get(rows[0])).resourceBase.path,
    loaded.resourceBase.path,
  );
  store.updateResource(
    r.id,
    {
      ...skill,
      name: "renamed",
      files: [
        {
          path: "SKILL.md",
          content:
            "---\nname: renamed\ndescription: New\nuser-invocable: false\ndisable-model-invocation: true\n---\nUpdated",
        },
      ],
    },
    r.revision,
  );
  const [updated] = await provider.list();
  assert.equal(updated.name, rows[0].name);
  assert.deepEqual(updated.invocation, {
    userInvocable: false,
    modelInvocable: false,
  });
  const fresh = await provider.get(updated);
  assert.notEqual(fresh.resourceBase.path, loaded.resourceBase.path);
  assert.equal(
    readFileSync(join(loaded.resourceBase.path, "assets/icon.bin")).length,
    4,
  );
  assert.equal(store.getResource(r.id).usageCount, 0);
});
test("provider rejects unsafe materialization and respects cancellation", async (t) => {
  const { store, directory, provider } = setup(t);
  store.createResource(skill);
  assert.throws(() =>
    materializeSkill(directory, {
      ...skill,
      id: "id",
      files: [{ path: "../outside", content: "bad" }],
    }),
  );
  await assert.rejects(() => provider.list({ signal: AbortSignal.abort() }));
  store.createResource({
    ...skill,
    files: [{ path: "SKILL.md", content: "---\nname: [\n---\nBody" }],
  });
  assert.equal((await provider.list()).length, 1);
});
test("/gallery lists, filters and inserts native tokens without submitting or counting", async () => {
  const name = "gskill-" + "a".repeat(32);
  let calls = 0;
  const source = createGalleryTrigger({
    async uiSkillCatalog() {
      calls++;
      return [{ name, label: "code-review", description: "代码审查" }];
    },
  });
  const request = (query) => ({ query, signal: new AbortController().signal });
  const root = await source.candidates({}, request("gal"));
  assert.deepEqual(source.onPick({ candidate: root[0] }), {
    text: "/gallery/",
    continue: true,
  });
  const rows = await source.candidates({}, request("gallery"));
  assert.equal(rows[0].name, "code-review");
  assert.equal(
    (await source.candidates({}, request("gallery/代码"))).length,
    1,
  );
  assert.equal(
    (await source.candidates({}, request("gallery/missing"))).length,
    0,
  );
  assert.equal((await source.candidates({}, request("other"))).length, 0);
  assert.deepEqual(source.onPick({ candidate: rows[0] }), {
    text: `/${name} `,
  });
  assert.equal(source.onPick({ candidate: { value: "/other" } }), undefined);
  assert.deepEqual(await source.matchEnter({}, "/gallery"), {
    text: "/gallery/",
    continue: true,
  });
  assert.equal(await source.matchEnter({}, "ordinary task"), undefined);
  assert.equal(calls, 3);
});
test("/gallery cancellation and backend failures never insert stale results", async () => {
  const source = createGalleryTrigger({
    async uiSkillCatalog() {
      return { ok: false, error: { message: "offline" } };
    },
  });
  await assert.rejects(
    () =>
      source.candidates(
        {},
        { query: "gallery", signal: new AbortController().signal },
      ),
    /offline/,
  );
  const cancelled = createGalleryTrigger({
    async uiSkillCatalog() {
      return [];
    },
  });
  await assert.rejects(() =>
    cancelled.candidates({}, { query: "gallery", signal: AbortSignal.abort() }),
  );
});

test("Gallery access denies both skill discovery and direct loading for one member", async (t) => {
  const { store } = setup(t);
  store.createResource(skill);
  const denied = {};
  const allowed = {};
  const provider = createSkillProvider(store, scope => scope !== denied);
  const [candidate] = await provider.list({ scope: allowed });
  assert.ok(candidate);
  assert.deepEqual(await provider.list({ scope: denied }), []);
  assert.equal(await provider.get(candidate, { scope: denied }), undefined);
  assert.ok(await provider.get(candidate, { scope: allowed }));
});
