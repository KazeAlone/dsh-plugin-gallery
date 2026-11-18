/** Optional real Gallery + DSH rc5 integration. Set GALLERY_SOURCE to its checkout. */
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire, registerHooks } from 'node:module'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const source = process.env.GALLERY_SOURCE

test('TeamFlow and real Gallery: bounded Skills, authenticated MCP, original chat and host policy', { skip: !source }, async t => {
  const root = resolve(source), requireGallery = createRequire(join(root, 'package.json'))
  // Both plugins must use the same host service/scope identities, just as in DSH.
  const hooks = registerHooks({ resolve(specifier, context, next) {
    if (specifier.startsWith('@deepseek-ai/')) {
      try { return { url: pathToFileURL(requireGallery.resolve(specifier)).href, shortCircuit: true } } catch {}
    }
    return next(specifier, context)
  } })
  const [{ Context }, { ToolRuntime }, { default: SystemPrompt }, { createScope }, { default: GalleryService }, { installMemberGalleryAccess }] = await Promise.all([
    import('@deepseek-ai/cordis'), import('@deepseek-ai/dsh-tools'), import('@deepseek-ai/dsh-system-prompt'), import('@deepseek-ai/dsh-scope'),
    import(pathToFileURL(join(root, 'src/host.mjs')).href), import('../lib/gallery-runtime.js'),
  ])
  const home = await mkdtemp(join(tmpdir(), 'teamflow-gallery-live-')), oldHome = process.env.DSH_HOME
  process.env.DSH_HOME = home
  let runtime, offAccess
  const scopes = []
  let mcpCalls = 0
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
    if (req.headers.authorization !== 'Bearer integration-fixture-key') { res.writeHead(401); res.end(); return }
    let body = ''; for await (const chunk of req) body += chunk
    const message = JSON.parse(body)
    if (message.id === undefined) { res.writeHead(202); res.end(); return }
    let result = {}
    if (message.method === 'initialize') result = { protocolVersion: message.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'joint-papers', version: '1' }, instructions: 'MCP-FULL-SERVER-INSTRUCTIONS' }
    if (message.method === 'tools/list') result = { tools: [{ name: 'search', description: 'Find internal research papers', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } }] }
    if (message.method === 'tools/call') { mcpCalls++; result = { content: [{ type: 'text', text: `Internal papers: ${message.params.arguments.query}` }] } }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }))
  })
  t.after(async () => {
    offAccess?.(); for (const scope of scopes) await scope.dispose()
    await runtime?.dispose(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
    if (oldHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = oldHome
    hooks.deregister(); await rm(home, { recursive: true, force: true })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const ctx = new Context()
  ctx.provide('typert', { register: () => () => {} })
  new SystemPrompt(ctx, { includeHarnessIdentity: false })
  new ToolRuntime(ctx)
  const gallery = new GalleryService(ctx)
  const skill = gallery.store.createResource({ type: 'skill', name: 'Joint skill', description: 'Review research papers', files: [{ path: 'SKILL.md', content: '---\nname: joint-skill\ndescription: Review research papers\n---\n\nUse the paper knowledge base.' }, { path: 'references/guide.md', content: 'ATTACHMENT-NOT-AUTO-LOADED' }] })
  gallery.store.adapter().write(rows => { for (let i = 1; i < 1000; i++) rows.push({ ...structuredClone(rows.find(row => row.id === skill.id)), id: `joint-skill-${i}`, name: `Joint skill ${i}` }); return rows[0] })
  const mcp = gallery.store.createResource({ type: 'mcp', name: 'Joint papers', description: 'Company paper library', files: [], metadata: { mcp: { serverName: 'joint_papers', transport: 'streamable-http', url: `http://127.0.0.1:${server.address().port}/mcp`, credentialKeys: ['Authorization'] } }, mcpCredentials: { Authorization: 'Bearer integration-fixture-key' } })
  await new Promise(resolve => setImmediate(resolve))
  runtime = gallery.mcpRuntime; assert.ok(runtime)
  await runtime.refresh()
  const nativeName = 'mcp__joint_papers__search'
  for (let i = 0; i < 100 && !ctx.tools.schemas().some(tool => tool.name === nativeName); i++) await new Promise(resolve => setTimeout(resolve, 10))
  assert.ok(ctx.tools.schemas().some(tool => tool.name === nativeName))
  const makeAgent = id => { const agent = { id }; const scope = createScope(ctx, agent); scopes.push(scope); agent.ctx = scope.ctx; return agent }
  const worker = makeAgent('workflow-worker'), chat = makeAgent('ordinary-chat')
  offAccess = installMemberGalleryAccess(ctx, worker, { gallerySkill: true, galleryMcp: true }, { deny: [] })
  assert.equal(ctx.tools.schemas(worker).filter(tool => tool.name.startsWith('gallery_skill_') || tool.name.startsWith('gallery_mcp_')).length, 5)
  assert.ok(!ctx.tools.schemas(worker).some(tool => tool.name.startsWith('mcp__')))
  assert.ok(ctx.tools.schemas(chat).some(tool => tool.name === nativeName))
  assert.equal((await gallery.skillProvider.list({ scope: worker })).length, 0)
  assert.ok((await gallery.skillProvider.list({ scope: chat })).length >= 1000)
  const prompt = await ctx.systemPrompt.assemble({ scope: worker })
  assert.ok(!JSON.stringify(prompt).includes('MCP-FULL-SERVER-INSTRUCTIONS'))
  let sequence = 0
  const call = (agent, name, args) => ctx.tools.execute({ agent, name, arguments: args, callId: `joint-${sequence++}`, signal: new AbortController().signal })
  const found = await call(worker, 'gallery_skill_search', { q: 'Joint skill' })
  assert.equal(found.isError, false, JSON.stringify(found)); assert.equal(found.value.total, 1000); assert.equal(found.value.items.length, 5)
  const loaded = await call(worker, 'gallery_skill_load', { id: skill.id })
  assert.equal(loaded.isError, false, JSON.stringify(loaded)); assert.ok(!loaded.value.content.includes('ATTACHMENT-NOT-AUTO-LOADED'))
  assert.equal(gallery.store.getResource(skill.id).usageCount, 1)
  const services = await call(worker, 'gallery_mcp_search', { q: 'Joint papers' }); assert.equal(services.value.items[0].id, mcp.id)
  const listed = await call(worker, 'gallery_mcp_tools', { id: mcp.id }); assert.equal(listed.value.tools[0].name, nativeName)
  const input = { id: mcp.id, tool: nativeName, arguments: { query: 'agent orchestration' } }
  const called = await call(worker, 'gallery_mcp_call', input)
  assert.equal(called.isError, false, JSON.stringify(called)); assert.match(JSON.stringify(called.content), /Internal papers: agent orchestration/)
  assert.equal(mcpCalls, 1); assert.equal(gallery.store.getResource(mcp.id).usageCount, 1)
  assert.ok(!JSON.stringify(called).includes('integration-fixture-key'))
  const deny = worker.ctx.get('tools').restrict({ deny: [nativeName] })
  assert.equal((await call(worker, 'gallery_mcp_call', input)).isError, true); deny()
  assert.equal(mcpCalls, 1, 'original host policy still blocks the real MCP call')
  offAccess(); offAccess = installMemberGalleryAccess(ctx, worker, { gallerySkill: false, galleryMcp: false }, { deny: [] })
  assert.equal((await call(worker, 'gallery_skill_search', {})).isError, true)
  assert.equal((await call(worker, 'gallery_mcp_call', input)).isError, true)
  assert.equal((await call(chat, nativeName, { query: 'ordinary chat' })).isError, false)
})
