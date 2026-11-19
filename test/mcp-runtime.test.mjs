import test from 'node:test';
import assert from 'node:assert/strict';
import { GalleryMcpRuntime } from '../src/mcp-runtime.mjs';

test('Gallery MCP refresh mounts, replaces and disposes official plugin instances', async () => {
  const row = { id: 'one', type: 'mcp', metadata: { mcp: { serverName: 'demo', transport: 'streamable-http', url: 'http://localhost:9876/mcp', envRefs: {} } } };
  const rows = [row], mounted = [], disposed = [];
  const ctx = { plugin: async (_plugin, config) => { mounted.push(config); return { dispose: async () => disposed.push(config.serverName) }; }, logger: { warn: () => {} } };
  const runtime = new GalleryMcpRuntime(ctx, { adapter: () => ({ read: () => ({ resources: rows }) }) });
  await runtime.refresh(); assert.equal(mounted.length, 1); assert.equal(mounted[0].serverName, 'demo');
  assert.equal(runtime.ownsTool('mcp__demo__ping'), true);
  assert.equal(runtime.ownsTool('mcp__elsewhere__ping'), false);
  assert.equal(runtime.ownsServer('demo'), true);
  await runtime.refresh(); assert.equal(mounted.length, 1);
  row.metadata.mcp.url = 'http://localhost:9877/mcp';
  await runtime.refresh(); assert.equal(mounted.length, 2); assert.deepEqual(disposed, ['demo']);
  rows.length = 0; await runtime.refresh(); assert.deepEqual(disposed, ['demo', 'demo']);
  assert.equal(runtime.ownsTool('mcp__demo__ping'), false);
});

test('shared stdio commands require per-host opt-in and are disposed when revoked', async () => {
  let allowStdio = false;
  const rows = [{ id: 'shared', type: 'mcp', metadata: { mcp: { serverName: 'shared-command', transport: 'stdio', command: 'node', args: ['-v'], envRefs: {} } } }];
  let mounts = 0, disposals = 0;
  const runtime = new GalleryMcpRuntime({ plugin: async () => { mounts++; return { dispose: async () => { disposals++; } }; } }, {
    read: () => ({ activeLibraryId: 'center', service: { allowStdio } }),
    adapter: () => ({ read: async () => ({ resources: rows }) }),
  });
  await runtime.refresh(); assert.equal(mounts, 0);
  allowStdio = true; await runtime.refresh(); assert.equal(mounts, 1);
  allowStdio = false; await runtime.refresh(); assert.equal(disposals, 1);
  await runtime.dispose();
});
