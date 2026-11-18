import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installMemberGalleryAccess } from '../lib/gallery-runtime.js'
import { installMemberSelectionRuntime } from '../lib/members.js'
import { createTeamDir } from '../lib/state.js'

const tools = ['gallery_skill_search', 'gallery_skill_load', 'gallery_mcp_search', 'gallery_mcp_tools', 'gallery_mcp_call']
const resourceCapabilities = () => ({ version: 1, mode: 'discovery', tools })
const context = gallery => ({ get: key => key === 'gallery' ? gallery : undefined })

test('four switch combinations preserve independent access and select bounded discovery', () => {
  for (const gallerySkill of [true, false]) for (const galleryMcp of [true, false]) {
    const child = {}; let applied, disposed = false
    const gallery = { resourceCapabilities, setMemberAccess(agent, access) { assert.equal(agent, child); applied = access; return () => { disposed = true } } }
    const filter = { deny: ['owner_only'] }, snapshot = structuredClone(filter)
    const off = installMemberGalleryAccess(context(gallery), child, { gallerySkill, galleryMcp }, filter)
    assert.deepEqual(applied, { gallerySkill, galleryMcp, ...(gallerySkill || galleryMcp ? { resourceMode: 'discovery' } : {}) })
    assert.deepEqual(filter, snapshot)
    off(); assert.equal(disposed, true)
  }
})

test('enabled access requires new Gallery; absent flags and closed switches remain compatible', () => {
  installMemberGalleryAccess(context(), {}, undefined)()
  installMemberGalleryAccess(context(), {}, { gallerySkill: false, galleryMcp: false })()
  assert.throws(() => installMemberGalleryAccess(context(), {}, { gallerySkill: true }), /安装.*Gallery 0.30.0/)
  let calls = 0
  const old = { setMemberAccess() { calls++; return () => {} } }
  assert.throws(() => installMemberGalleryAccess(context(old), {}, { galleryMcp: true }), /升级到 0.30.0/)
  assert.equal(calls, 0)
  installMemberGalleryAccess(context(old), {}, { gallerySkill: false, galleryMcp: false })()
  assert.equal(calls, 1)
  for (const value of [{ version: 0, mode: 'discovery', tools }, { version: NaN, mode: 'discovery', tools }, { version: 1, mode: 'native', tools }, { version: 1, mode: 'discovery', tools: tools.slice(0, 2) }]) {
    assert.throws(() => installMemberGalleryAccess(context({ ...old, resourceCapabilities: () => value }), {}, { galleryMcp: true }), /升级到 0.30.0/)
  }
})

test('administrator allow/deny policies are checked and never broadened', () => {
  const gallery = { resourceCapabilities, setMemberAccess() { return () => {} } }, access = { gallerySkill: true, galleryMcp: false }
  assert.throws(() => installMemberGalleryAccess(context(gallery), {}, access, { deny: ['gallery_skill_load'] }), /工具策略.*gallery_skill_load/)
  assert.throws(() => installMemberGalleryAccess(context(gallery), {}, access, { deny: [], allow: ['read'] }), /工具策略.*gallery_skill_search/)
  const filter = { deny: ['delete_file'], allow: tools.slice(0, 2) }, snapshot = structuredClone(filter)
  installMemberGalleryAccess(context(gallery), {}, access, filter)()
  assert.deepEqual(filter, snapshot)
})

function scope(extra = {}) {
  const listeners = new Map(), effects = []
  return { agents: { list: () => [] }, ...extra, listeners, logger: { warn() {} },
    on(name, callback) { const set = listeners.get(name) ?? new Set(); listeners.set(name, set); set.add(callback); return () => set.delete(callback) },
    effect(setup) { const off = setup(); effects.push(off); return off },
    emit(name, payload) { for (const callback of [...listeners.get(name) ?? []]) callback(payload) },
    dispose() { for (const off of effects.splice(0).reverse()) off?.() },
  }
}
function member(workspace) {
  return { id: 'worker', status: 'idle', options: {},
    session: { header: { parentSession: 'captain', cwd: workspace }, ownEvents: () => [{ type: 'subagent/descriptor', data: { version: 3, mode: 'continuable', provider: 'spawn', label: 'agent-teams:team:worker', agentProvider: 'selected', agentModel: 'model' } }] },
    ctx: scope({ tools: { restrict: () => () => {} }, systemPrompt: { getSectionOrder: () => 0, section: () => () => {} } }),
  }
}
function runtime(gallery, managed = false) {
  const ctx = scope({ subagents: { [Symbol.for('dsh.subagent.deliverPrompt')]() {}, sendMessage() {}, ...(managed ? { startActivation() {} } : {}) }, ...context(gallery) })
  return { ctx, bridge: installMemberSelectionRuntime(ctx, '.agent-teams') }
}
async function firstRequest(agent) {
  for (const callback of agent.ctx.listeners.get("system-prompt/assemble") ?? []) await callback({}, {}, async () => ({ variables: {} }))
  let result = { provider: 'parent', model: 'parent' }
  for (const callback of agent.ctx.listeners.get('agent/request') ?? []) { const previous = result; result = await callback({ agent }, async () => previous) }
  return result
}

test('fresh activation installs access before the first request, deduplicates events and cleans up', async t => {
  const workspace = await mkdtemp(join(tmpdir(), 'teamflow-gallery-fresh-')); t.after(() => rm(workspace, { recursive: true, force: true }))
  const calls = []; let disposals = 0
  const gallery = { resourceCapabilities, setMemberAccess(agent, access) { calls.push({ agent, access }); return () => { disposals++ } } }
  const { ctx, bridge } = runtime(gallery, true), agent = member(workspace)
  try {
    await bridge.withPending('captain', 'agent-teams:team:worker', { provider: 'selected', model: 'model' }, async () => {
      ctx.emit('agent/session-start', { agent, source: 'startup' })
      assert.equal(calls.length, 1); assert.equal(calls[0].agent, agent); assert.equal(calls[0].access.resourceMode, 'discovery')
      assert.deepEqual(await firstRequest(agent), { provider: 'selected', model: 'model' })
      ctx.emit('agent/session-start', { agent, source: 'compact' }); assert.equal(calls.length, 1)
    }, { persona: 'Worker', toolFilter: { deny: ['owner_only'] }, gallerySkill: true, galleryMcp: false })
  } finally { ctx.dispose(); agent.ctx.dispose() }
  assert.equal(disposals, 1)
})

for (const savedSetup of [false, true]) test(`cold resume restores switches and discovery (runtimeSetup=${savedSetup})`, async t => {
  const workspace = await mkdtemp(join(tmpdir(), 'teamflow-gallery-cold-')); t.after(() => rm(workspace, { recursive: true, force: true }))
  const access = { gallerySkill: false, galleryMcp: true }
  await createTeamDir(join(workspace, '.agent-teams'), { id: 'team', name: 'Team', captainSessionId: 'captain', createdAt: 1, taskSeq: 0, tasks: [], members: [{ id: 'worker', name: 'worker', status: 'idle', joinedAt: 1, provider: 'selected', model: 'model', ...access, ...(savedSetup ? { runtimeSetup: { persona: 'Worker', toolFilter: { deny: ['owner_only'] }, ...access } } : {}) }] })
  const calls = [], gallery = { resourceCapabilities, setMemberAccess(agent, value) { calls.push(value); return () => {} } }
  const { ctx } = runtime(gallery, savedSetup), agent = member(workspace)
  try {
    ctx.emit('agent/session-start', { agent, source: 'resume' })
    assert.deepEqual(calls, [{ ...access, resourceMode: 'discovery' }])
    assert.deepEqual(await firstRequest(agent), { provider: 'selected', model: 'model' })
  } finally { ctx.dispose(); agent.ctx.dispose() }
})

test('an old Gallery blocks the first request instead of continuing with a full catalog', async t => {
  const workspace = await mkdtemp(join(tmpdir(), 'teamflow-gallery-upgrade-')); t.after(() => rm(workspace, { recursive: true, force: true }))
  const { ctx, bridge } = runtime({ setMemberAccess: () => () => {} }), agent = member(workspace)
  try {
    await bridge.withPending('captain', 'agent-teams:team:worker', { provider: 'selected', model: 'model' }, async () => {
      ctx.emit('agent/session-start', { agent })
      await assert.rejects(firstRequest(agent), /initialization failed.*Gallery.*0.30.0/)
    }, { persona: 'Worker', toolFilter: { deny: ['owner_only'] }, gallerySkill: true, galleryMcp: true })
  } finally { ctx.dispose(); agent.ctx.dispose() }
})
