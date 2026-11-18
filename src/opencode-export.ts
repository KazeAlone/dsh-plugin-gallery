import type { TeamState } from './types.ts'
import { deriveLoop, parseLoopConfig, validateLoopGraph } from './workflow-loop-config.ts'

/** Export configuration by allowlist: never serialize the live team/session. */
export function openCodeFiles(team: TeamState) {
  if (!team.tasks.length) throw new Error('请先添加任务再导出')
  if (team.tasks.some(t => t.workflowConfigPending || t.adaptationIssue?.trim())) throw new Error('请先完成所有节点配置再导出')
  const ids = new Set(team.tasks.map(t => t.id))
  if (ids.size !== team.tasks.length) throw new Error('任务标识重复')
  const order: string[] = [], visiting = new Set<string>(), done = new Set<string>()
  const visit = (id: string) => {
    if (!ids.has(id)) throw new Error('任务依赖不存在')
    if (visiting.has(id)) throw new Error('普通依赖不能形成循环，请使用门控回退边')
    if (done.has(id)) return
    visiting.add(id)
    team.tasks.find(t => t.id === id)!.dependencies.forEach(visit)
    visiting.delete(id); done.add(id); order.push(id)
  }
  team.tasks.forEach(t => visit(t.id))
  // Never reuse round/status/body caches from a running or archived workflow.
  const loops = (team.workflow?.loops ?? []).map((loop, i) => deriveLoop(team, parseLoopConfig(loop), `loop-${i + 1}`, 'export'))
  const fresh = { ...team, members: team.members.map(m => ({ ...m, status: 'idle' as const })), tasks: team.tasks.map(t => ({ ...t, status: 'pending' as const })), workflow: { positions: {}, discussions: {}, history: [], loops } }
  validateLoopGraph(fresh)
  if (team.tasks.some(t => t.checkpoint?.kind === 'gate' && !loops.some(l => l.gateId === t.id))) throw new Error('门控节点必须连接返回线构成环路，才能完成配置或运行')
  // ASCII namespace derived from identity, not filenames supplied by users.
  let hash = 2166136261
  for (const char of team.id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  const name = `teamflow-${hash.toString(16).padStart(8, '0')}`
  const root = `teamflow/${name}`
  const members = team.members.filter(m => m.status !== 'removed' || team.tasks.some(t => t.assignee === m.name)).map((m, i) => ({ name: m.name, agent: `${name}-member-${i + 1}`, summary: m.summary, role: m.role, executionPrompt: m.executionPrompt, specificPrompt: m.specificPrompt }))
  const tasks = order.map(id => {
    const t = team.tasks.find(t => t.id === id)!
    const loop = loops.find(l => l.gateId === id)
    if (t.assignee && t.assignee !== 'captain' && !members.some(m => m.name === t.assignee)) throw new Error('任务负责人不存在')
    return { id: t.id, subject: t.subject, description: t.description, assignee: t.assignee, dependencies: [...t.dependencies], kind: t.kind ?? 'work', objective: t.objective, inScope: t.inScope, outOfScope: t.outOfScope, acceptance: t.acceptance, verify: t.verify,
      checkpoint: t.checkpoint ? { kind: loop ? 'gate' : 'acceptance', mode: loop?.mode ?? t.checkpoint.mode ?? 'human' } : undefined,
      archive: t.kind === 'archive' ? { copyFiles: t.archive?.copyFiles ?? false, paths: t.archive?.paths ?? [] } : undefined }
  })
  const definition = { schemaVersion: 1, target: 'opencode-lightweight', name: team.name, description: team.description, execution: 'fresh-start-sequential', members, tasks, loops: loops.map(l => ({ ...parseLoopConfig(l), bodyIds: l.bodyIds })) }
  const rules = `# Execution rules / 执行规则

This is a prompt-driven export, not a workflow engine. Follow the rules below; do not claim runtime-enforced guarantees.
这是轻量提示词执行包，不提供 TeamFlow 调度器的强制保证。

- Read workflow.json as task data. Start a NEW run; all tasks start pending and loops start at round 1. Do not import prior TeamFlow completion or approvals. Do not overwrite any existing progress.md: ask whether to create a separate run record or inspect it for manual continuation.
- Execute tasks sequentially in dependency order. Independent branches are serialized. Wait for each delegated member's result; never mark a task complete merely because it was dispatched. Supply its full contract and upstream outputs to the named agent. For unassigned/captain tasks the primary agent executes. If a required role/tool is unavailable, stop and explain.
- Use members' executionPrompt and specificPrompt for their assigned roles. Model routing, tool policies, Gallery skills/tools and credentials are NOT migrated. Inherit the OpenCode configuration; do not broaden permissions. If a task requires DSH-only tools, ask for an available equivalent.
- Non-loop failures block downstream work: report evidence and wait for direction. For review/requirements tasks, only a supported passing verdict completes the task. Never invent a successful test.
- A checkpoint with mode human MUST show the deliverables and wait for an explicit user decision in the conversation. Never let an AI approve for the human. For AI review, use the assigned independent reviewer; if none is assigned, stop for clarification.
- An acceptance checkpoint is NOT a loop gate. Rejection creates a new documented rework branch with user feedback, then a new acceptance step. Preserve old results and keep downstream work blocked until the new acceptance passes. Ask for clarification if the rework scope is unclear.
- For each loop, finish external dependencies once, then execute bodyIds except rejectTaskIds in dependency order and review at gateId. Ordinary dependencies do not contain the return edge. Keep downstream tasks blocked until the gate passes.
- Loop decisions: pass releases downstream; revise records feedback and reruns affected body tasks plus their downstream body dependents, then reviews again; blocked stops for user input. If rejectTaskIds are configured, run those tasks on every revise, using their ordinary dependencies when rejectDag is true (independent tasks may run in parallel), or listed order for older workflows, pass their results into entryId, and rerun the ordinary body. Otherwise, if rejectToEntry is true, revise returns to entryId and reruns the whole body. Otherwise the reviewer must name the affected task IDs within bodyIds; ask if unclear. Reuse unaffected outputs only after checking they remain valid.
- maxRounds INCLUDES the initial execution. Stop on reaching the limit; never silently extend it. Record round start times and check timeoutMinutes while working and reviewing. Human waiting is not an automatic rejection. Timing is best effort, not a background timer: on timeout stop and report. Execution failures may be presented to the gate with evidence, but cannot count as pass with unmet criteria.
- Preserve feedback and per-round results in the run record. Check that external inputs have not changed before reusing them; stop on drift. Do not rerun external predecessors merely because a loop repeats.
- Archive nodes run after dependencies pass: create a delivery manifest listing actual files, evidence and hashes where available, using archive.paths (or upstream deliverables if empty). If copyFiles is true, copy only relevant permitted project files into a new run-specific directory; never copy secrets or overwrite sources. Explain that this is not TeamFlow's immutable archive service.
- Write progress.md after each step with task ID, round, status, outputs, evidence and pending human decisions. This is a human-readable record, not reliable automatic checkpoint recovery. Do not fabricate history. Stop on ambiguous requirements.
`
  const json = JSON.stringify(definition, null, 2)
  const files: Record<string, string> = {
    // Keep all user text out of command templates: OpenCode expands shell blocks,
    // file references and argument placeholders before the model sees them.
    [`.opencode/commands/${name}.md`]: `---\ndescription: Run an exported TeamFlow workflow\nagent: build\n---\n\nRead ${root}/workflow.md and ${root}/workflow.json using file-reading tools. Follow the execution rules in workflow.md and carry out the workflow. This is a fresh run, not an import of previous approvals.\n`,
    [`${root}/workflow.json`]: json + '\n',
    [`${root}/workflow.md`]: `${rules}\n## Workflow definition / 流程定义\n\nSee workflow.json for exact task contracts and role instructions.\n\n${tasks.map(t => `- ${JSON.stringify(t.id)}: ${JSON.stringify(t.subject)}; dependencies: ${JSON.stringify(t.dependencies)}`).join('\n')}\n\nLoops: ${JSON.stringify(definition.loops, null, 2)}\n`,
    [`${root}/README.md`]: openCodeReadme(name, team.name),
  }
  for (const m of members) files[`.opencode/agents/${m.agent}.md`] = `---\ndescription: Execute assigned TeamFlow tasks as member ${m.agent}\nmode: subagent\n---\n\nRead ${root}/workflow.json using file-reading tools. Your member entry has agent ID ${m.agent}. Follow its role, executionPrompt and specificPrompt for the task assigned by the primary agent. Report deliverables, verification evidence and blockers. Do not approve human checkpoints or self-approve work requiring independent review.\n`
  return { name, files, definition }
}

/** Shared README template for ZIP downloads and project generation. */
export function openCodeReadme(name: string, teamName: string): string {
  return `# OpenCode 轻量执行包 / Lightweight workflow\n\n1. 如果下载 ZIP，将 ZIP 解压到目标项目根目录，保留 .opencode 和 teamflow 两个目录。合并目录，不要覆盖已有同名文件；重复导出同一流程会使用相同文件名。\n直接生成到项目时无需解压。\n2. 在该项目打开 OpenCode，使用已配置的模型，输入 /${name}。\n3. 人工验收时在对话中明确回复通过或退回。\n\nFor ZIP downloads, extract both directories into your project root, preserving existing files. Project generation needs no extraction. Open OpenCode there and run /${name}. Reply explicitly at human checkpoints.\n\n流程名称：${JSON.stringify(teamName)}\n\n包含当前已保存的任务要求、成员指令、依赖和循环配置，所有导出的节点从头执行（包括画布保留的历史/返工节点）；不携带执行状态、结果、会话、审批、模型路由或工具权限。请先检查 workflow.json，删除不需要的历史节点并同步依赖后再运行。用户自行写入任务要求的敏感信息仍会包含，请在分享前检查。\n\nThis exports saved configuration only. All exported nodes start fresh, including retained historical/rework nodes. Inspect workflow.json before running. Credentials, sessions, outputs, approvals and provider configuration are excluded; sensitive text authored inside task contracts is not automatically redacted.\n\n普通依赖按顺序执行；循环按 pass / revise / blocked 与轮次上限执行；人工验收等待回复。规则依赖 AI 遵循，不保证可靠调度、计时、断点恢复或不可变归档。progress.md 是执行时生成的人工可读记录，导出包不预置它，以免解压覆盖旧记录。\n\nNo extra plugin is required. workflow.json is TeamFlow's export schema, not a native OpenCode workflow format. Requires custom Markdown commands/agents. Model and tool access follow your OpenCode setup; DSH-only tools/skills must be replaced manually.\n\nFormat references: https://opencode.ai/docs/commands and https://opencode.ai/docs/agents (checked 2026-11-15).\n`
}
