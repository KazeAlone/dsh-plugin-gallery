import type { TeamTask, TeamMember } from './types.ts'
export interface LoopConfig {
  gateId: string
  entryId: string
  mode: 'human' | 'ai'
  reviewer?: string
  rejectToEntry?: boolean
  rejectTaskIds?: string[]
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
export function isDraftLoop(loop: WorkflowLoop): boolean {
  return loop.status === 'ready' && !loop.queued
}
export function isUnstartedLoop(loop: WorkflowLoop): boolean {
  return isDraftLoop(loop) && !loop.contracts && !loop.historyCount
}
export function canAssignLoopTask(loop: WorkflowLoop, task: TeamTask): boolean {
  return isUnstartedLoop(loop) && loop.bodyIds.includes(task.id)
    && task.status === 'pending' && !task.attempt && !task.reassigning
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
