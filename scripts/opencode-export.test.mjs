import { registerHooks } from 'node:module'
registerHooks({ resolve(specifier, context, next) { return specifier.endsWith('.module.css') ? { url:'data:text/javascript,export default {}',shortCircuit:true } : next(specifier, context) } })
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { openCodeFiles } from '../lib/opencode-export.js'
import { textZip, downloadTextZip } from '../lib/client/export-zip.js'
const { OpenCodeExport } = await import('../lib/client/OpenCodeExport.js')
import { WorkflowLocale } from '../lib/client/workflow-i18n.js'
import { en } from '../lib/client/locales.js'
import { deriveLoop } from '../lib/workflow-loop-config.js'

const task = (id, dependencies = [], extra = {}) => ({ id, subject: `任务 ${id}`, description: `完成 ${id}`, dependencies, assignee: 'worker', status: 'pending', createdAt: 1, updatedAt: 1, ...extra })
const fixture = () => ({ id: '../../中文:name', name: '中文流程', description: '交付功能', captainSessionId: 'PRIVATE_SESSION', createdAt: 1, taskSeq: 3, members: [{ name: 'worker', id: 'PRIVATE_MEMBER_SESSION', summary: '开发者', executionPrompt: '检查代码', specificPrompt: '本次实现中文功能', provider: 'PRIVATE_PROVIDER', status: 'idle' }, { name: 'reviewer', id: '', summary: '独立审核', status: 'idle' }], tasks: [task('b', ['a']), task('a'), task('accept', ['b'], { assignee: undefined, checkpoint: { kind: 'acceptance', mode: 'human', round: 7, decision: 'approve', evidence: 'PRIVATE_EVIDENCE', history: [] } })] })
function loopFixture(mode = 'ai', rejectToEntry = false) {
  const team = fixture()
  team.tasks = [task('before'), task('a', ['before']), task('b', ['a']), task('gate', ['b'], { assignee: mode === 'ai' ? 'reviewer' : undefined, checkpoint: { kind: 'gate', mode, round: 9, history: [] } }), task('archive', ['gate'], { assignee: undefined, kind: 'archive', archive: { paths: ['src/中文.ts'], copyFiles: true } })]
  team.workflow = { positions: {}, discussions: { secret: 'PRIVATE_DISCUSSION' }, history: [], loops: [deriveLoop(team, { gateId: 'gate', entryId: 'a', mode, reviewer: mode === 'ai' ? 'reviewer' : undefined, maxRounds: 3, timeoutMinutes: 45, rejectToEntry }, 'private-loop', 'PRIVATE_RUN')] }
  return team
}

test('DAG export preserves contracts, roles and human review without state or mutation', () => {
  const team = fixture()
  Object.assign(team.tasks[0], { objective: '目标', inScope: ['src'], outOfScope: ['secrets'], acceptance: ['通过测试'], verify: ['npm test'], output: 'PRIVATE_OUTPUT', attemptId: 'PRIVATE_ATTEMPT' })
  const original = structuredClone(team), { files, definition, name } = openCodeFiles(team)
  assert.deepEqual(team, original)
  assert.deepEqual(definition.tasks.map(t => t.id), ['a', 'b', 'accept'])
  assert.deepEqual(definition.tasks[1].verify, ['npm test'])
  assert.deepEqual(definition.tasks[2].checkpoint, { kind: 'acceptance', mode: 'human' })
  assert.equal(definition.members[0].specificPrompt, '本次实现中文功能')
  assert.deepEqual(definition.loops, [])
  assert.doesNotMatch(JSON.stringify(files), /PRIVATE_/)
  assert.match(name, /^teamflow-[a-f0-9]{8}$/)
  assert.ok(files[`.opencode/commands/${name}.md`])
  assert.ok(files[`.opencode/agents/${definition.members[0].agent}.md`])
  assert.ok(!Object.keys(files).some(p => p.endsWith('progress.md')))
  assert.deepEqual(openCodeFiles(team), openCodeFiles(team))
})

for (const mode of ['human', 'ai']) for (const rejectToEntry of [false, true]) test(`${mode} loop exports return policy and archive with fresh runtime`, () => {
  const team = loopFixture(mode, rejectToEntry)
  const loop = team.workflow.loops[0]
  loop.status = 'passed'; loop.round = 3; loop.historyHead = 'PRIVATE_HISTORY'; loop.feedback = 'PRIVATE_FEEDBACK'; loop.bodyIds = ['stale-cache']
  team.tasks.forEach(t => t.status = 'completed')
  const before = structuredClone(team), { files, definition, name } = openCodeFiles(team)
  assert.deepEqual(team, before)
  assert.deepEqual(definition.loops[0].bodyIds, ['a', 'b'])
  assert.equal(definition.loops[0].mode, mode)
  assert.equal(definition.loops[0].maxRounds, 3)
  assert.equal(definition.loops[0].timeoutMinutes, 45)
  assert.equal(!!definition.loops[0].rejectToEntry, rejectToEntry)
  assert.deepEqual(definition.tasks.at(-1).archive, { paths: ['src/中文.ts'], copyFiles: true })
  assert.doesNotMatch(JSON.stringify(files), /PRIVATE_/)
  const rules = files[`teamflow/${name}/workflow.md`]
  for (const pattern of [/maxRounds INCLUDES/, /explicit user decision/, /downstream body dependents/, /external dependencies once/, /blocked stops/, /not a background timer/, /new documented rework branch/]) assert.match(rules, pattern)
})

test('invalid configuration cannot become a misleading executable package', () => {
  for (const mutate of [t => t.tasks = [], t => t.tasks[0].dependencies = ['missing'], t => t.tasks[1].dependencies = ['b'], t => t.tasks.push(t.tasks[0]), t => t.tasks[0].workflowConfigPending = true, t => t.tasks[0].adaptationIssue = '缺少输入', t => t.tasks[0].assignee = 'missing', t => t.tasks[2].checkpoint.kind = 'gate']) {
    const team = fixture(); mutate(team); assert.throws(() => openCodeFiles(team))
  }
  const badReviewer = loopFixture(); badReviewer.workflow.loops[0].reviewer = 'worker'; badReviewer.tasks.find(t => t.id === 'gate').assignee = 'worker'
  assert.throws(() => openCodeFiles(badReviewer), /独立审核/)
  const badLimit = loopFixture(); badLimit.workflow.loops[0].maxRounds = 21
  assert.throws(() => openCodeFiles(badLimit), /1–20/)
})

test('user text never enters command interpolation or YAML metadata', () => {
  const team = fixture(), malicious = '!`echo unsafe` $ARGUMENTS @secret\n---\nagent: injected'
  team.name = malicious; team.members[0].summary = malicious; team.members[0].executionPrompt = malicious; team.tasks[0].description = malicious
  const { files, definition } = openCodeFiles(team)
  for (const [path, text] of Object.entries(files)) {
    assert.doesNotMatch(path, /\.\.|[\\:$@!]/)
    if (path.startsWith('.opencode/')) assert.doesNotMatch(text, /unsafe|injected|\$ARGUMENTS|@secret/)
  }
  assert.equal(definition.tasks.find(t => t.id === 'b').description, malicious)
})

test('ZIP round trips all UTF-8 files with an independent platform ZIP reader', () => {
  const files = { ...openCodeFiles(loopFixture()).files, '中文/说明.md': '中文内容 😀\n' }
  const directory = mkdtempSync(join(tmpdir(), 'teamflow-export-'))
  try {
    const path = join(directory, 'export.zip'); writeFileSync(path, textZip(files))
    let result
    if (process.platform === 'win32') result = spawnSync('powershell.exe', ['-NoProfile', '-Command', '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead($env:TEAMFLOW_EXPORT_ZIP); $map = @{}; foreach ($entry in $zip.Entries) { $reader = [System.IO.StreamReader]::new($entry.Open()); $map[$entry.FullName] = $reader.ReadToEnd(); $reader.Dispose() }; $zip.Dispose(); ConvertTo-Json -InputObject $map -Compress'], { env: { ...process.env, TEAMFLOW_EXPORT_ZIP: path }, encoding: 'utf8', maxBuffer: 4e6 })
    else result = spawnSync('python3', ['-c', 'import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({p:z.read(p).decode("utf-8") for p in z.namelist()}))', path], { encoding: 'utf8', maxBuffer: 4e6 })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout.replace(/^\uFEFF/, '')), files)
  } finally { rmSync(directory, { recursive: true, force: true }) }
  assert.throws(() => textZip({ '../escape': 'bad' }), /Unsafe/)
})

test('download creates a ZIP attachment and cleans up the link and object URL', async () => {
  const originalDocument = globalThis.document, originalTimer = globalThis.setTimeout
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL
  let blob, revoked, clicked = false, removed = false, timer
  const anchor = { click() { clicked = true }, remove() { removed = true } }
  try {
    globalThis.document = { createElement: () => anchor, body: { append: element => assert.equal(element, anchor) } }
    URL.createObjectURL = value => { blob = value; return 'blob:test' }
    URL.revokeObjectURL = value => { revoked = value }
    globalThis.setTimeout = callback => { timer = callback }
    downloadTextZip('teamflow-test', { 'file.md': '中文' })
    assert.equal(anchor.download, 'teamflow-test-opencode.zip'); assert.equal(anchor.href, 'blob:test'); assert.ok(clicked && removed)
    assert.equal(blob.type, 'application/zip'); assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), textZip({ 'file.md': '中文' }))
    timer(); assert.equal(revoked, 'blob:test')
    removed = false; anchor.click = () => { throw new Error('download failed') }
    assert.throws(() => downloadTextZip('test', { 'file.md': 'text' }), /download failed/); assert.ok(removed); timer()
  } finally { globalThis.document = originalDocument; globalThis.setTimeout = originalTimer; URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke }
})

test('canvas export control renders accessible localized label and blocks unsaved/empty/busy exports', () => {
  const render = props => renderToStaticMarkup(React.createElement(OpenCodeExport, { team: fixture(), disabled: false, unsaved: false, ...props }))
  assert.match(render({}), /导出 OpenCode/)
  assert.doesNotMatch(render({}).split('<dialog')[0], /disabled=""/)
  for (const props of [{ disabled: true }, { unsaved: true }, { team: { ...fixture(), tasks: [] } }]) assert.match(render(props), /disabled=""/)
  assert.match(render({ unsaved: true }), /请先保存属性草稿/)
  const english = renderToStaticMarkup(React.createElement(WorkflowLocale, { t: key => en[key] ?? key }, React.createElement(OpenCodeExport, { team: fixture(), disabled: false, unsaved: false })))
  assert.match(english, /Export OpenCode/); assert.doesNotMatch(english, /\p{Script=Han}/u)
})
