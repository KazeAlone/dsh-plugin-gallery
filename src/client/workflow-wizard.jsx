import React, { useState } from 'react';
import { Modal } from './modal.jsx';
import { Glyph } from './icons.jsx';
import { validateWorkflowTemplate } from '../workflow-template.mjs';

const steps = ['基本信息', '团队成员', '任务节点', '检查保存'];
const member = () => ({ name: '', summary: '', role: '', executionPrompt: '' });
const task = (n) => ({ id: `t${n}`, subject: '', assignee: '', dependencies: [], checkpoint: false, general: { requirements: '', deliverables: '', acceptance: '' } });
function initial(resource) {
  try { return JSON.parse(resource.files.find(f => f.path === 'workflow.json').content); }
  catch { return { name: resource?.name || '', description: resource?.description || '', tags: resource?.tags || [], inputs: '', members: [], tasks: [], positions: {} }; }
}
export function WorkflowWizard({ resource, onClose, onSave }) {
  const [draft, setDraft] = useState(() => initial(resource));
  const [step, setStep] = useState(0), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const update = (patch) => setDraft(d => ({ ...d, ...patch }));
  const changeMember = (i, key, value) => update({ members: draft.members.map((m, index) => index === i ? { ...m, [key]: value } : m) });
  const changeTask = (i, patch) => update({ tasks: draft.tasks.map((t, index) => index === i ? { ...t, ...patch } : t) });
  let issue = '';
  try { validateWorkflowTemplate(draft); } catch (e) { issue = e.message; }
  async function save() {
    setBusy(true); setError('');
    try {
      const value = validateWorkflowTemplate(draft);
      if (value.tasks.some(t => !t.general.requirements)) throw Error('每个任务节点都需要填写通用任务要求');
      await onSave({ type: 'workflow', name: value.name, description: value.description, tags: value.tags, files: [{ path: 'workflow.json', encoding: 'utf8', content: JSON.stringify(value, null, 2) + '\n' }], metadata: { ...(resource?.metadata || {}), format: 'dsh-teamflow-template-v1' }, references: resource?.references || [] });
    } catch (e) { setError(e?.rpcError?.message || e.message || String(e)); setBusy(false); }
  }
  return <Modal onClose={() => !busy && onClose()}><section className="gal-dialog gal-skill-wizard" role="dialog" aria-modal="true" aria-label={resource ? '编辑 Workflow' : '新建 Workflow'}>
    <header className="gal-dialog-head"><h2><Glyph name="workflow" /> {resource ? '编辑' : '新建'} Workflow</h2><button aria-label="关闭编辑" disabled={busy} onClick={onClose}><Glyph name="close" /></button></header>
    <nav className="gal-skill-steps" aria-label="创建进度">{steps.map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} disabled={busy} onClick={() => setStep(i)}><span>{i < step ? '✓' : i + 1}</span>{label}</button>)}</nav>
    <div className="gal-dialog-body gal-skill-layout"><main><h3>{steps[step]}</h3>
      {step === 0 && <div className="gal-skill-fields"><label>名称<input aria-label="名称" value={draft.name} onChange={e => update({ name: e.target.value })} /></label><label>描述<textarea aria-label="描述" value={draft.description} onChange={e => update({ description: e.target.value })} /></label><label>适用输入<textarea aria-label="适用输入" value={draft.inputs} onChange={e => update({ inputs: e.target.value })} /></label><label>标签<input aria-label="标签" value={draft.tags.join(', ')} onChange={e => update({ tags: e.target.value.split(/[,，]/).map(x => x.trim()).filter(Boolean) })} /></label></div>}
      {step === 1 && <div className="gal-skill-fields"><p>成员名称用于指定任务负责人；队长使用 captain。</p>{draft.members.map((m, i) => <div className="gal-workflow-card" key={i}><button onClick={() => update({ members: draft.members.filter((_, n) => n !== i) })}>删除成员</button>{[['name','名称'],['summary','简介'],['role','角色'],['executionPrompt','执行指令']].map(([key,label]) => <label key={key}>{label}<input aria-label={`成员${i+1}${label}`} value={m[key]} onChange={e => changeMember(i, key, e.target.value)} /></label>)}</div>)}<button onClick={() => update({ members: [...draft.members, member()] })}>添加成员</button></div>}
      {step === 2 && <div className="gal-skill-fields">{draft.tasks.map((t, i) => <div className="gal-workflow-card" key={i}><button onClick={() => update({ tasks: draft.tasks.filter((_, n) => n !== i) })}>删除节点</button><label>节点 ID<input aria-label={`节点${i+1} ID`} value={t.id} onChange={e => changeTask(i, { id: e.target.value })} /></label><label>名称<input aria-label={`节点${i+1}名称`} value={t.subject} onChange={e => changeTask(i, { subject: e.target.value })} /></label><label><input type="checkbox" checked={t.checkpoint} onChange={e => changeTask(i, { checkpoint: e.target.checked, assignee: e.target.checked ? '' : t.assignee })} />人工验收点</label>{!t.checkpoint && <label>负责人<select aria-label={`节点${i+1}负责人`} value={t.assignee} onChange={e => changeTask(i, { assignee: e.target.value })}><option value="">未指定</option><option value="captain">队长</option>{draft.members.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}</select></label>}<label>依赖节点<select aria-label={`节点${i+1}依赖`} multiple value={t.dependencies} onChange={e => changeTask(i, { dependencies: [...e.target.selectedOptions].map(o => o.value) })}>{draft.tasks.filter(x => x.id !== t.id).map(x => <option key={x.id} value={x.id}>{x.subject || x.id}</option>)}</select></label>{[['requirements','通用任务要求'],['deliverables','交付物'],['acceptance','验收标准']].map(([key,label]) => <label key={key}>{label}<textarea aria-label={`节点${i+1}${label}`} value={t.general[key]} onChange={e => changeTask(i, { general: { ...t.general, [key]: e.target.value } })} /></label>)}</div>)}<button onClick={() => update({ tasks: [...draft.tasks, task(Math.max(0, ...draft.tasks.map(t => Number(/^t(\d+)$/.exec(t.id)?.[1]) || 0)) + 1)] })}>添加节点</button></div>}
      {step === 3 && <div className="gal-skill-fields"><p>{draft.members.length} 位成员 · {draft.tasks.length} 个节点 · {draft.tasks.filter(t => t.checkpoint).length} 个验收点</p>{draft.tasks.map(t => <p key={t.id}>{t.subject || t.id} ← {t.dependencies.join('、') || '起点'}</p>)}<p>保存到 Gallery 后，可以从资源详情安装到 TeamFlow 模板库。</p>{issue && <p role="alert" className="gal-error">{issue}</p>}</div>}
      {error && <p role="alert" className="gal-error">{error}</p>}
    </main></div><footer className="gal-dialog-footer"><button disabled={busy} onClick={() => step ? setStep(step - 1) : onClose()}>{step ? '上一步' : '取消'}</button>{step < 3 ? <button className="gal-primary" disabled={busy} onClick={() => setStep(step + 1)}>下一步</button> : <button className="gal-primary" disabled={busy || !!issue || draft.tasks.some(t => !t.general.requirements.trim())} onClick={save}>保存 Workflow</button>}</footer>
  </section></Modal>;
}
