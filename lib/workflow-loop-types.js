export function canEditLoopGate(gate) {
    return gate.status !== 'claimed' && gate.status !== 'in_progress' && !gate.reassigning;
}
export function isUnstartedLoop(loop) {
    return loop.status === 'ready' && !loop.queued && !loop.contracts && !loop.historyCount;
}
export function canAssignLoopTask(loop, task) {
    return isUnstartedLoop(loop) && loop.bodyIds.includes(task.id)
        && task.status === 'pending' && !task.attempt && !task.reassigning;
}
export function canToggleLoopTask(loop, taskId) {
    return taskId !== loop.gateId && (loop.status === 'ready' || loop.status === 'running' || loop.status === 'paused' && loop.lastDecision !== 'revise');
}
export function canRetryLoopTask(loop, task) {
    return loop.status === 'paused' && canToggleLoopTask(loop, task.id) && (task.status === 'failed' || task.status === 'cancelled');
}
export function canStartLoopWithFlow(loop) {
    if (loop.status === 'ready')
        return !loop.queued;
    return loop.status === 'paused' && (loop.lastDecision !== 'revise' || loop.round < loop.maxRounds);
}
