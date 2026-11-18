import { canEditLoopGate, isDraftLoop } from "./workflow-loop-types.js";
export function parseLoopConfig(raw) {
    if (!raw || typeof raw !== 'object')
        throw new Error('循环配置无效');
    const value = raw;
    if (typeof value.gateId !== 'string' || typeof value.entryId !== 'string' || !['human', 'ai'].includes(String(value.mode)))
        throw new Error('请配置循环入口、门控和审核方式');
    const maxRounds = Number(value.maxRounds), timeoutMinutes = Number(value.timeoutMinutes);
    if (!Number.isSafeInteger(maxRounds) || maxRounds < 1 || maxRounds > 20)
        throw new Error('轮次上限必须为 1–20，包含首次执行');
    if (!Number.isSafeInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 1440)
        throw new Error('执行超时必须为 1–1440 分钟');
    const returnIds = value['rejectTaskIds'];
    if (returnIds !== undefined && (!Array.isArray(returnIds) || returnIds.length > 31 || returnIds.some(id => typeof id !== 'string' || !id) || new Set(returnIds).size !== returnIds.length))
        throw new Error('退回路径中的任务无效或重复');
    return { gateId: value.gateId, entryId: value.entryId, mode: value.mode, maxRounds, timeoutMinutes,
        ...(value.rejectToEntry === true || Array.isArray(returnIds) && returnIds.length ? { rejectToEntry: true } : {}),
        ...(Array.isArray(returnIds) && returnIds.length ? { rejectTaskIds: returnIds, ...(value.rejectDag === true ? { rejectDag: true } : {}) } : {}),
        ...(typeof value.reviewer === 'string' && value.reviewer.trim() ? { reviewer: value.reviewer.trim() } : {}) };
}
const loopsOf = (team) => team.workflow?.loops ?? [];
function taskOf(team, id) { const task = team.tasks.find(t => t.id === id); if (!task)
    throw new Error(`循环节点不存在：${id}`); return task; }
export function upstreamIds(tasks, gateId) {
    const ancestors = new Set();
    function visit(id) {
        if (ancestors.has(id))
            return;
        ancestors.add(id);
        tasks.find(task => task.id === id)?.dependencies.forEach(visit);
    }
    tasks.find(task => task.id === gateId)?.dependencies.forEach(visit);
    return ancestors;
}
export function deriveLoop(team, config, id, runId) {
    const ancestors = upstreamIds(team.tasks, config.gateId);
    if (!ancestors.has(config.entryId))
        throw new Error('循环入口必须位于门控上游');
    const body = new Set([config.entryId]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const task of team.tasks)
            if (ancestors.has(task.id) && !body.has(task.id) && task.dependencies.some(id => body.has(id))) {
                body.add(task.id);
                changed = true;
            }
    }
    for (const id of config.rejectTaskIds ?? []) {
        if (id === config.gateId || ancestors.has(id))
            throw new Error('退回任务不能同时位于首轮路径');
        body.add(id);
    }
    return { ...config, id, runId, bodyIds: [...body], round: 1, status: 'ready', historyCount: 0, captured: {}, externalInputs: {} };
}
export function reviewerConflicts(team, bodyIds, reviewer) {
    return team.tasks.filter(task => bodyIds.includes(task.id) && task.assignee === reviewer);
}
/** Apply the draft PASS edges to a new task list for both preview and save. */
export function gateRouteTasks(team, gateId, passTargets) {
    if (!Array.isArray(passTargets) || passTargets.some(id => typeof id !== 'string' || !team.tasks.some(task => task.id === id)))
        throw new Error('请选择有效的 PASS 目标');
    return team.tasks.map(task => {
        const connected = task.dependencies.includes(gateId);
        if (connected === passTargets.includes(task.id))
            return task;
        return { ...task, dependencies: connected ? task.dependencies.filter(id => id !== gateId) : [...task.dependencies, gateId] };
    });
}
export function planGateSettings(team, raw, passTargets, dependenciesChanged = false) {
    const config = parseLoopConfig(raw);
    if (config.mode === 'human')
        delete config.reviewer;
    const gate = taskOf(team, config.gateId);
    if (!gate.checkpoint || !canEditLoopGate(gate))
        throw new Error('门控正在执行，请在执行结束后编辑');
    const previous = loopsOf(team).find(loop => loop.gateId === config.gateId);
    for (const id of config.rejectTaskIds ?? []) {
        if (!previous?.rejectTaskIds?.includes(id) && !canEditLoopGate(taskOf(team, id)))
            throw new Error('请先停止要加入退回路径的任务');
    }
    const tasks = gateRouteTasks(team, gate.id, passTargets);
    const candidate = { ...team, tasks };
    const region = deriveLoop(candidate, config, previous?.id ?? gate.id, previous?.runId ?? gate.id);
    const rewired = dependenciesChanged || !previous || previous.entryId !== config.entryId
        || previous.rejectDag !== config.rejectDag
        || JSON.stringify(previous.rejectTaskIds ?? []) !== JSON.stringify(config.rejectTaskIds ?? [])
        || region.bodyIds.length !== previous.bodyIds.length || region.bodyIds.some(id => !previous.bodyIds.includes(id))
        || tasks.some((task, i) => task !== team.tasks[i]);
    const round = rewired ? 1 : previous.round;
    if (config.maxRounds < round)
        throw new Error('轮次上限不能低于当前轮');
    const loop = rewired ? { ...region, round } : { ...previous, ...config, rejectToEntry: config.rejectToEntry, rejectTaskIds: config.rejectTaskIds, rejectDag: config.rejectDag, reviewer: config.reviewer };
    const draftGate = { ...gate, assignee: config.mode === 'ai' ? config.reviewer : undefined };
    if (rewired)
        draftGate.status = 'pending';
    candidate.tasks = tasks.map(task => task.id === gate.id ? draftGate : task);
    const workflow = { ...team.workflow ?? { positions: {}, discussions: {}, history: [] }, loops: [...loopsOf(team).filter(item => item !== previous), loop] };
    validateLoopGraph({ ...candidate, workflow });
    return { config, tasks, previous, loop, rewired };
}
export function gateEntryConnected(tasks, config) {
    return !!config.entryId && upstreamIds(tasks, config.gateId).has(config.entryId);
}
export function previewGate(team, config, passTargets) {
    let bodyIds = [];
    try {
        if (!gateEntryConnected(team.tasks, config))
            return { bodyIds, error: '' };
        bodyIds = deriveLoop(team, config, config.gateId, config.gateId).bodyIds;
        planGateSettings(team, config, passTargets);
        return { bodyIds, error: '' };
    }
    catch (error) {
        return { bodyIds, error: error instanceof Error ? error.message : String(error) };
    }
}
export function validateDraftRejectPaths(team) {
    const reserved = new Set(loopsOf(team).flatMap(loop => [loop.gateId, ...loop.bodyIds]));
    for (const gate of team.tasks.filter(task => task.checkpoint?.kind === 'gate')) {
        if (loopsOf(team).some(loop => loop.gateId === gate.id))
            continue;
        const draft = gate.checkpoint?.draftLoopSettings;
        if (draft?.entryId) {
            const entry = taskOf(team, draft.entryId);
            if (entry.checkpoint || entry.kind === 'archive' || draft.rejectTaskIds?.includes(entry.id))
                throw new Error('请选择有效的循环入口任务');
            if (reserved.has(entry.id))
                throw new Error('不支持嵌套或共享节点的循环');
            reserved.add(entry.id);
        }
        for (const id of draft?.rejectTaskIds ?? []) {
            const task = taskOf(team, id);
            if (task.checkpoint || task.kind === 'archive')
                throw new Error('退回路径只能包含普通任务');
            if (reserved.has(id))
                throw new Error('不支持嵌套或共享节点的循环');
            if (!canEditLoopGate(task))
                throw new Error('请先停止要加入退回路径的任务');
            reserved.add(id);
        }
    }
}
export function validateLoopGraph(team, requireExecutionSetup = false) {
    validateDraftRejectPaths(team);
    if (!loopsOf(team).length)
        return;
    const visiting = new Set(), visited = new Set();
    const visit = (id) => {
        if (visiting.has(id))
            throw new Error('普通依赖不能形成循环，请使用门控回退边');
        if (visited.has(id))
            return;
        visiting.add(id);
        taskOf(team, id).dependencies.forEach(visit);
        visiting.delete(id);
        visited.add(id);
    };
    team.tasks.forEach(task => visit(task.id));
    const occupied = new Set();
    const identities = new Set();
    for (const loop of loopsOf(team)) {
        if (identities.has(loop.id))
            throw new Error('循环标识重复');
        identities.add(loop.id);
        parseLoopConfig(loop);
        const gate = taskOf(team, loop.gateId), body = new Set(loop.bodyIds);
        if (gate.checkpoint?.kind === 'acceptance')
            throw new Error('验收节点不能作为循环门控');
        if (body.size > 32)
            throw new Error('单个循环最多 32 个执行节点，请拆分流程');
        // A user-ended loop is terminal, but carries no approval to release downstream work.
        const forceEnded = team.halted === true && loop.status === 'cancelled'
            && Object.hasOwn(team.closeout?.originalStatuses ?? {}, gate.id)
            && team.tasks.every(task => task.status === 'completed');
        if (loop.status !== 'passed' && gate.status === 'completed' && !forceEnded)
            throw new Error('循环门控只能通过正式审核放行');
        if (!gate.checkpoint || !body.size || !body.has(loop.entryId) || body.has(gate.id))
            throw new Error('循环需要独立门控和有效入口');
        if (body.size !== loop.bodyIds.length)
            throw new Error('循环区域节点重复');
        for (const id of [...body, gate.id]) {
            if (occupied.has(id))
                throw new Error('不支持嵌套或共享节点的循环');
            occupied.add(id);
        }
        const reaches = (from, to, seen = new Set()) => {
            if (from === to)
                return true;
            if (seen.has(to))
                return false;
            seen.add(to);
            return taskOf(team, to).dependencies.some(dep => body.has(dep) && reaches(from, dep, seen));
        };
        const returnIds = loop.rejectTaskIds ?? [];
        const forwardInputs = returnIds.length ? upstreamIds(team.tasks, loop.gateId) : new Set();
        if (returnIds.some(id => !body.has(id) || id === loop.entryId) || (returnIds.length && !loop.rejectToEntry))
            throw new Error('退回路径中的任务无效或重复');
        for (const id of body) {
            const task = taskOf(team, id);
            if (task.kind === 'archive')
                throw new Error('成果归档节点应放在循环门控的 PASS 路径之后');
            if ((requireExecutionSetup || !isDraftLoop(loop)) && (!task.assignee || !team.members.some(m => m.name === task.assignee && (m.status !== 'removed' || ['paused', 'passed', 'cancelled'].includes(loop.status)))))
                throw new Error('请先为循环内任务指定有效负责人');
            const returnIndex = returnIds.indexOf(id);
            if (returnIndex >= 0) {
                const earlier = loop.rejectDag ? returnIds : returnIds.slice(0, returnIndex);
                const later = loop.rejectDag ? returnIds : returnIds.slice(returnIndex + 1);
                if (task.checkpoint || task.dependencies.some(dep => !earlier.includes(dep) && !(forwardInputs.has(dep) && !body.has(dep)))
                    || team.tasks.some(other => other.dependencies.includes(id) && !later.includes(other.id))) {
                    throw new Error('退回任务只能依赖已完成的首轮外部输入或同一路径中更早的任务，输出不能绕过门控');
                }
                continue;
            }
            if (task.checkpoint || !reaches(loop.entryId, id) || !reaches(id, gate.id))
                throw new Error('循环区域必须从入口可达并汇合到唯一门控');
            if (team.tasks.some(t => !body.has(t.id) && t.id !== gate.id && t.dependencies.includes(id)))
                throw new Error('循环内的输出必须经过门控才能连接环外');
        }
        if (loop.mode === 'ai') {
            if (gate.assignee !== loop.reviewer)
                throw new Error('AI 门控负责人必须与循环审核成员一致');
            if (!requireExecutionSetup && isDraftLoop(loop))
                continue;
            if (!loop.reviewer || !team.members.some(m => m.name === loop.reviewer && (m.status !== 'removed' || ['paused', 'passed', 'cancelled'].includes(loop.status))))
                throw new Error('请选择有效的 AI 审核成员');
            const conflicts = reviewerConflicts(team, loop.bodyIds, loop.reviewer);
            if (conflicts.length)
                throw new Error(`${loop.reviewer} 负责「${conflicts.map(task => task.subject).join('、')}」，请选择独立审核成员`);
        }
        else if (gate.assignee)
            throw new Error('人工门控不能分配执行成员');
    }
}
