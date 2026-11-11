import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalGalleryStore } from '../src/local-store.mjs';
import { installReferenceSkill, referenceSkill } from '../src/builtin-skill.mjs';
import { readSkill, skillIssues, syncSkillAttachments } from '../src/client/skill-format.mjs';
import { normalizeResource, digest } from '../src/model.mjs';
import { skillCandidate } from '../src/skill-provider.mjs';
test('complete reference Skill validates and seeds once without overwriting edits or restoring deletion', () => {
  const root = mkdtempSync(join(tmpdir(), 'gallery-builtin-'));
  try {
    const store = new LocalGalleryStore(join(root, 'resources.json'));
    installReferenceSkill(store);
    let resource = store.listResources({}).items[0];
    const parsed = readSkill(store.getResource(resource.id));
    assert.deepEqual(skillIssues(parsed.name, parsed.description, parsed.body, parsed.files), []);
    assert.ok(skillCandidate(store.getResource(resource.id)));
    assert.equal(parsed.files.length, 3);
    assert.equal((parsed.body.match(/## 附属文件/g) || []).length, 1);
    assert.equal(parsed.body.trimEnd(), syncSkillAttachments(parsed.body, parsed.files).trimEnd());
    const edited = store.updateResource(resource.id, { ...referenceSkill(), description: '用户修改' }, resource.revision);
    installReferenceSkill(store);
    assert.equal(store.getResource(resource.id).description, '用户修改');
    store.deleteResource(resource.id, edited.revision);
    installReferenceSkill(store);
    assert.equal(store.listResources({}).total, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

const legacyTemplate = JSON.parse(readFileSync(new URL('./fixtures/skill-reference-v1.json', import.meta.url), 'utf8'));

test('reference Skill matches the other examples while retaining all fields and attachments', () => {
  const resource = referenceSkill();
  const parsed = readSkill(resource);
  assert.equal(resource.name, '会议纪要整理与摘要 · Skill 示例');
  assert.equal(parsed.name, 'gallery-skill-reference');
  assert.equal(parsed.description, resource.description);
  assert.equal(parsed.frontmatter.metadata.author, 'ZelongWANG');
  assert.equal(parsed.frontmatter.metadata.version, '1.1.0');
  assert.equal(parsed.frontmatter.license, 'MIT');
  assert.ok(parsed.frontmatter.compatibility);
  assert.equal(parsed.frontmatter['user-invocable'], true);
  assert.equal(parsed.frontmatter['disable-model-invocation'], false);
  assert.deepEqual(resource.files.map(f => f.path), ['SKILL.md', 'scripts/inspect_note.py', 'references/summary-rules.md', 'assets/summary-template.md']);
  assert.match(parsed.body, /## 输入输出示例/);
  assert.doesNotMatch(parsed.body, /name 和 description 是基础字段/);
});

test('untouched old Skill templates refresh in place even after a previous automatic update', () => {
  for (const person of ['小黄', '小林']) for (const revision of [1, 3]) {
    const root = mkdtempSync(join(tmpdir(), 'gallery-builtin-upgrade-'));
    try {
      const store = new LocalGalleryStore(join(root, 'resources.json'));
      const input = structuredClone(legacyTemplate);
      input.files[0].content = input.files[0].content.replaceAll('小黄', person);
      const old = store.createResource(input, { username: 'ZelongWANG' });
      store.write((rows, data) => {
        data.builtinSeeds = [input.metadata.builtin];
        Object.assign(rows[0], { revision, usageCount: 42, usageEventIds: ['event-1'] });
        return rows[0];
      });
      installReferenceSkill(store);
      const updated = store.getResource(old.id);
      assert.equal(updated.name, referenceSkill().name);
      assert.equal(updated.digest, digest(JSON.stringify(normalizeResource(referenceSkill()))));
      assert.equal(updated.revision, revision + 1);
      assert.equal(updated.createdAt, old.createdAt);
      assert.equal(updated.usageCount, 42);
      assert.deepEqual(store.read().resources[0].usageEventIds, ['event-1']);
      assert.equal(store.listResources({}).total, 1);
      installReferenceSkill(store);
      assert.equal(store.getResource(old.id).revision, updated.revision);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test('upgrading examples preserves user changes to the old Skill template', () => {
  const root = mkdtempSync(join(tmpdir(), 'gallery-builtin-edited-'));
  try {
    const store = new LocalGalleryStore(join(root, 'resources.json'));
    const custom = { ...structuredClone(legacyTemplate), name: '我的会议整理', description: '用户自己的规则' };
    const saved = store.createResource(custom, { username: 'ZelongWANG' });
    store.write((rows, data) => { data.builtinSeeds = [custom.metadata.builtin]; return rows[0]; });
    installReferenceSkill(store);
    assert.equal(store.getResource(saved.id).name, custom.name);
    assert.equal(store.getResource(saved.id).description, custom.description);
    assert.equal(store.getResource(saved.id).revision, 1);
    store.deleteResource(saved.id, 1);
    installReferenceSkill(store);
    assert.equal(store.listResources({}).total, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
