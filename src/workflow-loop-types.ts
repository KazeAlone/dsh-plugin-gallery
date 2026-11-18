import type { TeamTask, TeamMember } from './types.ts'
export interface LoopConfig {
  gateId: string
  entryId: string
  mode: 'human' | 'ai'
  reviewer?: string
  rejectToEntry?: boolean
  rejectTaskIds?: string[]
  /** When absent on an existing run, preserve its original list order. */
  rejectDag?: true
  maxRounds: number
  timeoutMinutes: number
}
export interface WorkflowLoop extends LoopConfig {
  id: string
  bodyIds: string[]
  runId: string
  round: number
  status: 'ready' | 'running' | 'reviewing' | 'paused' | 'passed' | 'cancelled'
  reason?: string
  failedExecutionTaskId?: string
  feedback?: string
  requestedTaskIds?: string[]
  startedAt?: number
  reviewStartedAt?: number
  historyHead?: string
  historyCount: number
  captured: Record<string, string>
  externalInputs: Record<string, string>
  lastDecisionId?: string
  lastDecision?: 'pass' | 'revise' | 'blocked'
  previousOutputs?: Record<string,string>
  reviewArtifactEvidence?: string
  reviewRevision?: string
  queued?: boolean
  contracts?: Record<string, string>
  executionRounds?: Record<string, number>
}
export function canEditLoopGate(gate: Pick<TeamTask, 'status' | 'reassigning'>): boolean {
  return gate.status !== 'claimed' && gate.status !== 'in_progress' && !gate.reassigning
}
export function loopHasStarted(loop: Pick<WorkflowLoop, 'startedAt' | 'contracts'>): boolean {
  return loop.startedAt !== undefined || loop.contracts !== undefined
}
export function canEndLoop(loop: WorkflowLoop): boolean {
  return loopHasStarted(loop) && loop.status !== 'passed' && loop.status !== 'cancelled'
}
export function isDraftLoop(loop: WorkflowLoop): boolean {
  return loop.status === 'ready' && !loop.queued
}
export function isUnstartedLoop(loop: WorkflowLoop): boolean {
  return isDraftLoop(loop) && !loop.contracts && !loop.historyCount
}
export function canAssignLoopTask(loop: WorkflowLoop, task: TeamTask): boolean {
  return loop.bodyIds.includes(task.id) && task.status === 'pending' && !task.reassigning
}
export function canToggleLoopTask(loop: Pick<WorkflowLoop, 'gateId' | 'status' | 'lastDecision'>, taskId: string): boolean {
  return taskId !== loop.gateId && (loop.status === 'ready' || loop.status === 'running' || loop.status === 'paused' && loop.lastDecision !== 'revise')
}
export function canRetryLoopTask(loop: Pick<WorkflowLoop, 'gateId' | 'status' | 'lastDecision'>, task: {id: string; status: string}): boolean {
  return loop.status === 'paused' && canToggleLoopTask(loop, task.id) && (task.status === 'failed' || task.status === 'cancelled')
}
export function canStartLoopWithFlow(loop: Pick<WorkflowLoop, 'status' | 'queued' | 'lastDecision' | 'round' | 'maxRounds'>): boolean {
  if (loop.status === 'ready') return !loop.queued
  return loop.status === 'paused' && (loop.lastDecision !== 'revise' || loop.round < loop.maxRounds)
}
export interface LoopHistoryRecord {
  id: string
  previous?: string
  loopId: string
  runId: string
  round: number
  at: number
  kind: 'execution' | 'decision' | 'control'
  summary: string
  decision?: 'pass' | 'revise' | 'blocked'
  actor?: string
  tasks: TeamTask[]
  inputFingerprint: string
  artifactEvidence?: string
  members?: Pick<TeamMember, 'id'|'name'|'provider'|'model'|'reasoningEffort'|'activeProvider'|'activeModel'>[]
  executionRounds?: Record<string, number>
}

/** A return branch participates only after the first reject. */
export function isUntriggeredLoopTask(team: { workflow?: { loops?: readonly Pick<WorkflowLoop, 'round' | 'rejectTaskIds'>[] } }, taskId: string): boolean {
  return team.workflow?.loops?.some(loop => loop.round === 1 && loop.rejectTaskIds?.includes(taskId)) ?? false
}
export function roundBodyIds(loop: WorkflowLoop): string[] {
  return loop.round === 1 && loop.rejectTaskIds?.length
    ? loop.bodyIds.filter(id => !loop.rejectTaskIds!.includes(id))
    : loop.bodyIds
}

export function isDraftRejectTask(team: {tasks: readonly Pick<TeamTask, 'checkpoint'>[]}, taskId: string): boolean {
  return team.tasks.some(task => task.checkpoint?.draftLoopSettings?.rejectTaskIds?.includes(taskId))
}

/** A configured loop may be saved as a draft, but execution must enter it from the forward graph. */
export function loopHasExternalEntry(tasks: readonly Pick<TeamTask,'id'|'dependencies'>[], loop: Pick<WorkflowLoop,'entryId'|'gateId'|'bodyIds'>): boolean {
  const entry = tasks.find(task => task.id === loop.entryId)
  return entry?.dependencies.some(id => id !== loop.gateId && !loop.bodyIds.includes(id) && tasks.some(task => task.id === id)) ?? false
}

export function isPendingLoopEntry(team: {tasks: readonly Pick<TeamTask, 'checkpoint'>[]}, id: string): boolean {
  return team.tasks.some(task => task.checkpoint?.draftLoopSettings?.entryId === id)
}
