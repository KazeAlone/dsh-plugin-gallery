import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalGalleryStore } from '../src/local-store.mjs';
import { installReferenceSkill, referenceSkill } from '../src/builtin-skill.mjs';
import { readSkill, skillIssues, syncSkillAttachments } from '../src/client/skill-format.mjs';
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
