import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MAX_WORKFLOW_TEXT_LENGTH } from "../workflow-types.js";
import { useEffect, useRef, useState } from 'react';
import { canEditLoopGate } from "../workflow-loop-types.js";
import { workflowRequest } from "./workflow-request.js";
import { useWorkflowText } from "./workflow-i18n.js";
import { workflowMessage } from "./workflow-text.js";
import { previewGate, upstreamIds } from "../workflow-loop-config.js";
import { RoundComparison } from "./RoundComparison.js";
import css from './LoopPanel.module.css';
export function LoopPanel({ team, task, sessionId, base, archived, busy, perform, modeSelect, onSelectTask }) {
    const l = useWorkflowText(), tr = (zh, en) => l.language === 'en' ? en : zh;
    const loop = team.workflow?.loops?.find(item => item.gateId === task.id || item.bodyIds.includes(task.id));
    const [entry, setEntry] = useState(loop?.entryId ?? '');
    const reviewer = loop?.reviewer ?? task.checkpoint?.draftReviewer;
    const mode = loop?.mode ?? task.checkpoint?.mode ?? 'human';
    const savedRounds = loop?.maxRounds ?? task.checkpoint?.draftLoopSettings?.maxRounds ?? 3;
    const savedTimeout = loop?.timeoutMinutes ?? task.checkpoint?.draftLoopSettings?.timeoutMinutes ?? 30;
    const [rounds, setRounds] = useState(savedRounds), [timeout, setTimeoutMinutes] = useState(savedTimeout), [extra, setExtra] = useState(1);
    const [returnIds, setReturnIds] = useState(loop?.rejectTaskIds ?? []);
    const [rejectToEntry, setRejectToEntry] = useState(loop ? !!loop.rejectToEntry : true);
    const [passTargets, setPassTargets] = useState(() => team.tasks.filter(t => t.dependencies.includes(task.id)).map(t => t.id));
    const savedPassTargets = JSON.stringify(team.tasks.filter(t => t.dependencies.includes(task.id)).map(t => t.id));
    const savedReturnIds = JSON.stringify(loop?.rejectTaskIds ?? []);
    useEffect(() => {
        setReturnIds(JSON.parse(savedReturnIds));
        setEntry(loop?.entryId ?? '');
        setRounds(savedRounds);
        setTimeoutMinutes(savedTimeout);
        setRejectToEntry(loop ? !!loop.rejectToEntry : true);
        setPassTargets(JSON.parse(savedPassTargets));
    }, [team.id, task.id, loop?.id, loop?.entryId, loop?.mode, loop?.reviewer, savedRounds, savedTimeout, loop?.rejectToEntry, savedPassTargets, savedReturnIds]);
    const [note, setNote] = useState(''), [targets, setTargets] = useState(loop ? [loop.entryId] : []), [error, setError] = useState(''), [loading, setLoading] = useState(false);
    const [materials, setMaterials] = useState();
    const [history, setHistory] = useState(), [comparison, setComparison] = useState();
    const historyScope = `${team.id}:${loop?.runId}:${task.id}`;
    const historyScopeRef = useRef(historyScope);
    historyScopeRef.current = historyScope;
    const scope = `${historyScope}:${loop?.round}:${loop?.reviewRevision ?? ''}`;
    const scopeRef = useRef(scope);
    scopeRef.current = scope;
    useEffect(() => { setMaterials(undefined); setNote(''); setTargets(loop ? [loop.entryId] : []); setError(''); setLoading(false); }, [scope]);
    useEffect(() => { setHistory(undefined); setComparison(undefined); }, [historyScope]);
    if (!loop && (task.checkpoint?.kind !== 'gate' || task.status !== 'pending' || (task.attempt ?? 0) > 0 || archived))
        return null;
    const ancestors = upstreamIds(team.tasks, task.id);
    const exhausted = !!loop && loop.lastDecision === 'revise' && loop.round >= loop.maxRounds;
    const capped = exhausted && loop.maxRounds >= 20;
    const request = async (action, fields = {}) => {
        const result = await workflowRequest({ action, sessionId, teamId: team.id, loopId: loop?.id, archived, ...fields });
        if (action === 'loop_history' ? historyScopeRef.current !== historyScope : scopeRef.current !== scope)
            throw new Error(tr('轮次已变化，请重新读取', 'Round changed; reload the materials'));
        return result;
    };
    const guarded = async (fn) => {
        setLoading(true);
        setError('');
        try {
            await fn();
        }
        catch (err) {
            if (scopeRef.current === scope)
                setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            if (scopeRef.current === scope)
                setLoading(false);
        }
    };
    const blocked = busy || loading;
    const config = { gateId: task.id, entryId: entry, rejectToEntry: !!returnIds.length || rejectToEntry, rejectTaskIds: returnIds, mode, reviewer: mode === 'ai' ? reviewer : undefined, maxRounds: rounds, timeoutMinutes: timeout };
    const editing = !archived && canEditLoopGate(task) && (!loop || loop.gateId === task.id);
    const preview = editing && entry ? previewGate(team, config, passTargets) : { bodyIds: [], error: '' };
    const statuses = { ready: tr('等待启动', 'Ready'), running: tr('执行中', 'Running'), reviewing: tr('审核中', 'Reviewing'), paused: tr('已暂停', 'Paused'), passed: tr('已通过', 'Passed'), cancelled: tr('已结束', 'Cancelled') };
    return _jsxs("section", { className: css.panel, "data-loop-panel": true, "aria-label": tr('门控节点', 'Gate node'), children: [_jsx("h3", { children: tr('门控节点', 'Gate node') }), _jsxs("label", { children: [tr('审核方式', 'Review mode'), modeSelect] }), loop?.gateId === task.id && _jsxs("nav", { className: css.steps, "aria-label": tr('循环任务', 'Loop tasks'), children: [_jsx("strong", { children: tr('循环任务', 'Loop tasks') }), loop.bodyIds.map(id => _jsx("button", { type: "button", onClick: () => onSelectTask(id), children: team.tasks.find(item => item.id === id)?.subject ?? id }, id))] }), error && _jsx("p", { role: "alert", children: error }), editing && _jsxs("details", { open: !loop || undefined, children: [_jsx("summary", { children: tr('配置 IF 路径与审核', 'Configure IF routes and review') }), _jsxs("div", { className: css.settings, children: [_jsxs("fieldset", { children: [_jsx("legend", { children: tr('PASS · 通过后继续', 'PASS · Continue to') }), team.tasks.filter(t => t.id !== task.id && !ancestors.has(t.id) && !returnIds.includes(t.id)).map(t => _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: passTargets.includes(t.id), onChange: e => setPassTargets(ids => e.target.checked ? [...ids, t.id] : ids.filter(id => id !== t.id)) }), t.subject] }, t.id)), !passTargets.length && _jsx("small", { children: tr('通过后结束此路径', 'This path ends on pass') })] }), _jsxs("label", { children: ["REJECT \u00B7 ", tr('返回连线目标（必选）', 'Return target (required)'), _jsxs("select", { "aria-label": tr('返回连线目标（必选）', 'Return target (required)'), value: entry, onChange: e => setEntry(e.target.value), children: [_jsx("option", { value: "", children: tr('选择上游任务', 'Select an upstream task') }), team.tasks.filter(t => !t.checkpoint && ancestors.has(t.id)).map(t => _jsx("option", { value: t.id, children: t.subject }, t.id))] })] }), _jsxs("fieldset", { children: [_jsx("legend", { children: tr('仅退回时执行', 'Run only on reject') }), _jsx("p", { children: tr('按顺序添加任务。全部完成后回到所选入口。', 'Add tasks in order. Return to the selected entry after all of them finish.') }), returnIds.map((id, index) => _jsxs("div", { children: [index + 1, ". ", team.tasks.find(node => node.id === id)?.subject ?? id, _jsx("button", { type: "button", onClick: () => setReturnIds(ids => ids.filter(item => item !== id)), children: tr('从退回路径移除', 'Remove from reject path') })] }, id)), _jsxs("select", { "aria-label": tr('添加退回任务', 'Add reject task'), value: "", onChange: e => { const id = e.currentTarget.value; if (id)
                                            setReturnIds(ids => [...ids, id]); }, children: [_jsx("option", { value: "", children: tr('添加退回任务', 'Add reject task') }), team.tasks.filter(node => !node.checkpoint && node.kind !== 'archive' && !ancestors.has(node.id) && !returnIds.includes(node.id) && !passTargets.includes(node.id)
                                                && !team.workflow?.loops?.some(other => other.id !== loop?.id && other.bodyIds.includes(node.id)))
                                                .map(node => _jsx("option", { value: node.id, children: node.subject }, node.id))] })] }), _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", disabled: !!returnIds.length, checked: config.rejectToEntry, onChange: e => setRejectToEntry(e.target.checked) }), tr('退回时从所选入口重跑；取消勾选可在审核时指定返工任务', 'Restart at the selected entry on reject. Uncheck to choose tasks during review.')] }), _jsxs("label", { children: [tr('轮次上限（包含首次）', 'Round limit (including first)'), _jsx("input", { "aria-label": tr('轮次上限（包含首次）', 'Round limit (including first)'), type: "number", min: 1, max: 20, value: rounds, onChange: e => setRounds(Number(e.target.value)) })] }), _jsxs("label", { children: [tr('每轮超时（分钟）', 'Round timeout (minutes)'), _jsx("input", { "aria-label": tr('每轮超时（分钟）', 'Round timeout (minutes)'), type: "number", min: 1, max: 1440, value: timeout, onChange: e => setTimeoutMinutes(Number(e.target.value)) })] }), preview.error && _jsx("p", { role: "status", children: workflowMessage(preview.error, l) }), !loop && !entry && _jsx("button", { type: "button", disabled: blocked || rounds === savedRounds && timeout === savedTimeout, onClick: () => void guarded(() => perform('loop_configure', { base, config })), children: tr('保存门控参数', 'Save gate settings') }), _jsx("button", { disabled: blocked || !entry || !!preview.error, onClick: () => void guarded(() => perform('loop_configure', { base, config, loopId: loop?.id, passTargets })), children: loop ? tr('保存 IF 配置', 'Save IF settings') : tr('连接返回线并创建环路', 'Connect return edge and create loop') })] })] }), loop && _jsxs(_Fragment, { children: [_jsxs("strong", { children: [statuses[loop.status], " \u00B7 ", tr('第', 'Round'), " ", loop.round, "/", loop.maxRounds, " \u00B7 ", loop.mode === 'ai' ? `AI · ${loop.reviewer}` : tr('人工审核', 'Human review')] }), _jsx("p", { children: loop.reason || tr('通过门控后才会继续执行环外任务。', 'Downstream tasks wait until this gate passes.') }), loop.feedback && _jsx("p", { className: css.feedback, children: loop.feedback }), !archived && _jsxs("div", { className: css.controls, children: [['ready', 'paused'].includes(loop.status) && _jsxs(_Fragment, { children: [exhausted && !capped && _jsxs("label", { children: [tr('明确追加轮数', 'Add rounds explicitly'), _jsx("input", { "aria-label": tr('明确追加轮数', 'Add rounds explicitly'), type: "number", min: 1, max: 20 - loop.maxRounds, value: extra, onChange: e => setExtra(Number(e.target.value)) })] }), capped && _jsx("p", { children: tr('已达单次运行 20 轮上限，请结束后建立新流程。', 'This run reached its 20-round maximum. End it and create a new workflow.') }), _jsx("button", { disabled: blocked || capped || team.phase === 'staged' || !!team.halted, onClick: () => void guarded(() => perform('loop_start', { base, loopId: loop.id, additionalRounds: loop.lastDecision === 'revise' && loop.round >= loop.maxRounds ? extra : 0 })), children: loop.status === 'ready' ? tr('启动循环', 'Start loop') : tr('继续循环', 'Resume loop') })] }), !['passed', 'cancelled', 'ready'].includes(loop.status) && _jsx("button", { disabled: blocked, onClick: () => void guarded(() => perform('loop_pause', { base, loopId: loop.id })), children: tr('暂停并停止执行', 'Pause and stop execution') }), !['passed', 'cancelled'].includes(loop.status) && _jsx("button", { disabled: blocked, onClick: () => void guarded(() => perform('loop_cancel', { base, loopId: loop.id })), children: tr('结束循环', 'End loop') })] }), !archived && loop.status === 'reviewing' && loop.mode === 'human' && _jsxs(_Fragment, { children: [_jsx("button", { disabled: blocked, onClick: () => void guarded(async () => setMaterials(await request('loop_materials'))), children: tr('读取本轮审核材料', 'Read current review materials') }), materials && _jsxs(_Fragment, { children: [materials.files?.map(file => _jsxs("details", { children: [_jsxs("summary", { children: [file.path, " \u00B7 ", file.skipped ? tr('按策略跳过内容审计，请在本机检查', 'Content audit skipped by policy; check this file locally') : !file.present ? tr('文件不存在', 'File does not exist') : tr('已读取摘要', 'Digest recorded')] }), file.size !== undefined && _jsxs("p", { children: [file.size.toLocaleString(), " bytes"] }), file.reason && _jsx("p", { children: file.reason }), file.sha256 && _jsx("code", { children: file.sha256 })] }, file.path)), _jsx("p", { children: task.description }), _jsx(RoundComparison, { ...materials }), _jsxs("label", { children: [tr('审核意见、修改要求与复验条件', 'Findings, required changes and revalidation'), _jsx("textarea", { "aria-label": tr('审核意见、修改要求与复验条件', 'Findings, required changes and revalidation'), rows: 5, maxLength: MAX_WORKFLOW_TEXT_LENGTH, value: note, onChange: e => setNote(e.target.value) })] }), !loop.rejectToEntry && _jsxs("fieldset", { children: [_jsx("legend", { children: tr('需要改进的任务（其下游也会重跑）', 'Tasks to revise (their descendants rerun too)') }), loop.bodyIds.map(id => _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: targets.includes(id), onChange: e => setTargets(value => e.target.checked ? [...value, id] : value.filter(v => v !== id)) }), team.tasks.find(t => t.id === id)?.subject] }, id))] }), _jsx("div", { className: css.controls, children: ['pass', 'revise', 'blocked'].map(decision => _jsx("button", { disabled: blocked || !note.trim() || decision === 'revise' && !loop.rejectToEntry && !targets.length, onClick: () => void guarded(async () => {
                                                const result = await perform('loop_decide', { loopId: loop.id, decisionId: crypto.randomUUID(), runId: materials.runId, round: materials.round, fingerprint: materials.fingerprint, artifactEvidence: materials.artifactEvidence, decision, note, taskIds: targets });
                                                if (result) {
                                                    setMaterials(undefined);
                                                    setNote('');
                                                    setTargets([]);
                                                }
                                            }), children: decision === 'pass' ? tr('通过并继续', 'Pass and continue') : decision === 'revise' ? tr('按意见改进', 'Revise with feedback') : tr('无法继续，暂停', 'Blocked, pause') }, decision)) })] })] }), _jsxs("button", { disabled: blocked, onClick: () => void guarded(async () => setHistory(await request('loop_history'))), children: [tr('查看多轮历史', 'View round history'), " (", loop.historyCount, ")"] }), history && _jsxs("div", { className: css.history, children: [_jsx("p", { children: tr('历史只读，按页加载。文件摘要不等于历史文件副本。', 'Read-only, paginated history. File digests are not historical file copies.') }), history.records.map(record => _jsxs("details", { children: [_jsxs("summary", { children: [tr('第', 'Round'), " ", record.round, " \u00B7 ", { execution: tr('执行记录', 'Execution'), decision: tr('审核决定', 'Decision'), control: tr('运行控制', 'Control') }[record.kind], " \u00B7 ", new Date(record.at).toLocaleString(), " \u00B7 ", record.decision ? { pass: tr('通过', 'Pass'), revise: tr('改进', 'Revise'), blocked: tr('暂停', 'Blocked') }[record.decision] : ''] }), _jsx("pre", { children: record.summary }), record.members?.map(member => _jsxs("small", { children: [member.name, " \u00B7 ", member.activeProvider ?? member.provider, " / ", member.activeModel ?? member.model, " \u00B7 ", member.reasoningEffort] }, member.name)), record.tasks.map(t => _jsxs("details", { children: [_jsxs("summary", { children: [t.subject, " \u00B7 ", tr('执行', 'Attempt'), " ", t.attempt ?? 0, " \u00B7 ", t.status, record.executionRounds?.[t.id] && record.executionRounds[t.id] < record.round ? ` · ${tr('沿用第', 'Reused from round')} ${record.executionRounds[t.id]}` : ''] }), _jsx("pre", { children: t.output || '—' }), _jsx("pre", { children: JSON.stringify({ requirements: t.description, acceptance: t.acceptanceResults, commands: t.commandsRun, findings: t.findings, feedback: t.workflowRerunContext?.instructions }, null, 2) })] }, t.id)), _jsx("button", { onClick: () => setComparison(record), children: tr('固定此记录用于比较', 'Pin this record to compare') })] }, record.id)), comparison && _jsxs("details", { open: true, children: [_jsxs("summary", { children: [tr('比较基准', 'Comparison reference'), " \u00B7 ", comparison.round] }), _jsx("pre", { children: comparison.summary }), comparison.tasks.map(t => _jsxs("pre", { children: [t.subject, '\n', t.output] }, t.id)), _jsx("button", { onClick: () => setComparison(undefined), children: tr('取消固定', 'Unpin') })] }), history.next && _jsx("button", { disabled: blocked, onClick: () => void guarded(async () => setHistory(await request('loop_history', { cursor: history.next }))), children: tr('更早记录', 'Older records') })] })] })] });
}
