import type { TeamTask, TeamMember } from './types.ts';
export interface LoopConfig {
    gateId: string;
    entryId: string;
    mode: 'human' | 'ai';
    reviewer?: string;
    rejectToEntry?: boolean;
    rejectTaskIds?: string[];
    /** When absent on an existing run, preserve its original list order. */
    rejectDag?: true;
    maxRounds: number;
    timeoutMinutes: number;
}
export interface WorkflowLoop extends LoopConfig {
    id: string;
    bodyIds: string[];
    runId: string;
    round: number;
    status: 'ready' | 'running' | 'reviewing' | 'paused' | 'passed' | 'cancelled';
    reason?: string;
    failedExecutionTaskId?: string;
    feedback?: string;
    requestedTaskIds?: string[];
    startedAt?: number;
    reviewStartedAt?: number;
    historyHead?: string;
    historyCount: number;
    captured: Record<string, string>;
    externalInputs: Record<string, string>;
    lastDecisionId?: string;
    lastDecision?: 'pass' | 'revise' | 'blocked';
    previousOutputs?: Record<string, string>;
    reviewArtifactEvidence?: string;
    reviewRevision?: string;
    queued?: boolean;
    contracts?: Record<string, string>;
    executionRounds?: Record<string, number>;
}
export declare function canEditLoopGate(gate: Pick<TeamTask, 'status' | 'reassigning'>): boolean;
export declare function loopHasStarted(loop: Pick<WorkflowLoop, 'startedAt' | 'contracts'>): boolean;
export declare function canEndLoop(loop: WorkflowLoop): boolean;
export declare function isDraftLoop(loop: WorkflowLoop): boolean;
export declare function isUnstartedLoop(loop: WorkflowLoop): boolean;
export declare function canAssignLoopTask(loop: WorkflowLoop, task: TeamTask): boolean;
export declare function canToggleLoopTask(loop: Pick<WorkflowLoop, 'gateId' | 'status' | 'lastDecision'>, taskId: string): boolean;
export declare function canRetryLoopTask(loop: Pick<WorkflowLoop, 'gateId' | 'status' | 'lastDecision'>, task: {
    id: string;
    status: string;
}): boolean;
export declare function canStartLoopWithFlow(loop: Pick<WorkflowLoop, 'status' | 'queued' | 'lastDecision' | 'round' | 'maxRounds'>): boolean;
export interface LoopHistoryRecord {
    id: string;
    previous?: string;
    loopId: string;
    runId: string;
    round: number;
    at: number;
    kind: 'execution' | 'decision' | 'control';
    summary: string;
    decision?: 'pass' | 'revise' | 'blocked';
    actor?: string;
    tasks: TeamTask[];
    inputFingerprint: string;
    artifactEvidence?: string;
    members?: Pick<TeamMember, 'id' | 'name' | 'provider' | 'model' | 'reasoningEffort' | 'activeProvider' | 'activeModel'>[];
    executionRounds?: Record<string, number>;
}
/** A return branch participates only after the first reject. */
export declare function isUntriggeredLoopTask(team: {
    workflow?: {
        loops?: readonly Pick<WorkflowLoop, 'round' | 'rejectTaskIds'>[];
    };
}, taskId: string): boolean;
export declare function roundBodyIds(loop: WorkflowLoop): string[];
export declare function isDraftRejectTask(team: {
    tasks: readonly Pick<TeamTask, 'checkpoint'>[];
}, taskId: string): boolean;
/** A configured loop may be saved as a draft, but execution must enter it from the forward graph. */
export declare function loopHasExternalEntry(tasks: readonly Pick<TeamTask, 'id' | 'dependencies'>[], loop: Pick<WorkflowLoop, 'entryId' | 'gateId' | 'bodyIds'>): boolean;
export declare function isPendingLoopEntry(team: {
    tasks: readonly Pick<TeamTask, 'checkpoint'>[];
}, id: string): boolean;
