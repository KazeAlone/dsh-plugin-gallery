import test from 'node:test';
import assert from 'node:assert/strict';
import { registerRuntimeDiagnostics } from '../src/runtime-diagnostics.mjs';
test('host diagnostics preserve stacks and causes without logging conversation data', () => {
  let handler, log;
  registerRuntimeDiagnostics({ on: (event, callback) => { assert.equal(event, 'agent/error'); handler = callback; } }, message => { log = message; });
  handler({ agent: { id: 'session1', secretPrompt: 'private conversation' }, turn: 2, step: 3, error: new Error('turn failed', { cause: new TypeError('undefined prepare') }) });
  assert.match(log, /session=session1 turn=2 step=3/);
  assert.match(log, /Caused by: TypeError: undefined prepare/);
  assert.match(log, /runtime-diagnostics.test.mjs/);
  assert.doesNotMatch(log, /private conversation/);
});
