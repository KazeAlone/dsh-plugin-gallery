import test from 'node:test';
import assert from 'node:assert/strict';
import { agentDocument } from '../src/client/agent-format.mjs';
import { registerGalleryAgentTools } from '../src/agent-runtime.mjs';

test('Gallery Agent tools list and delegate a saved Agent to DSH spawn', async () => {
  const resource = { id: 'agent-one', type: 'agent', name: 'Reviewer', description: 'Review code', tags: [], metadata: { agent: { slug: 'reviewer', goal: 'Review code', instructions: 'Check correctness.' } }, files: [{ path: 'AGENT.md', encoding: 'utf8', content: agentDocument({ slug: 'reviewer', description: 'Review code', goal: 'Review code', boundaries: '', instructions: 'Check correctness.' }) }] };
  const store = { directory: '/tmp/gallery-test', adapter: () => ({ read: () => ({ resources: [resource] }) }), getResource: () => resource };
  const tools = new Map(); let activation;
  const ctx = { tools: { register: def => { tools.set(def.name, def); return () => tools.delete(def.name); } }, subagents: { getProvider: () => ({}), startActivation: async spec => { activation = spec; return { childId: 'child-one' }; } } };
  const dispose = registerGalleryAgentTools(ctx, store);
  assert.equal((await tools.get('gallery_agent_list').execute({})).agents[0].name, 'Reviewer');
  const result = await tools.get('gallery_agent_run').execute({ id: resource.id, task: 'Review this file' }, { agent: { id: 'parent' }, signal: new AbortController().signal });
  assert.equal(result.child_id, 'child-one');
  assert.equal(activation.provider, 'spawn');
  assert.equal(activation.delivery, 'parent');
  assert.match(activation.request.prompt[0].text, /Check correctness/);
  assert.match(activation.request.prompt[0].text, /Review this file/);
  dispose(); assert.equal(tools.size, 0);
});
