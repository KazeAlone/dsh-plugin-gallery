import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateWorkflowTemplate } from '../src/workflow-template.mjs';
import { publishToTeamflow } from '../src/teamflow-publish.mjs';

const definition = () => ({ name: '发布流程', description: '通用发布', inputs: '', tags: ['发布'], members: [{ name: 'writer', summary: '', role: '', executionPrompt: '' }], tasks: [
  { id: 't1', subject: '编写', assignee: 'writer', dependencies: [], checkpoint: false, general: { requirements: '编写说明', deliverables: '', acceptance: '' } },
  { id: 't2', subject: '验收', assignee: '', dependencies: ['t1'], checkpoint: true, general: { requirements: '检查说明', deliverables: '', acceptance: '' } },
], positions: {} });
test('TeamFlow workflow validation rejects cycles and invalid owners', () => {
  assert.equal(validateWorkflowTemplate(definition()).tasks.length, 2);
  const cyclic = definition(); cyclic.tasks[0].dependencies = ['t2'];
  assert.throws(() => validateWorkflowTemplate(cyclic), /循环/);
  const owner = definition(); owner.tasks[1].assignee = 'writer';
  assert.throws(() => validateWorkflowTemplate(owner), /人工节点/);
});
test('publishing creates compatible immutable TeamFlow versions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gallery-teamflow-'));
  try {
    const resource = { id: 'gallery-resource', files: [{ path: 'workflow.json', encoding: 'utf8', content: JSON.stringify(definition()) }] };
    const first = await publishToTeamflow(resource, root);
    const second = await publishToTeamflow(resource, root);
    assert.equal(second.id, first.id); assert.equal(second.version, 2);
    const record = JSON.parse(await readFile(join(root, `${first.id}.json`), 'utf8'));
    assert.equal(record.versions.length, 2); assert.equal(record.versions[0].tasks[1].checkpoint, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});
