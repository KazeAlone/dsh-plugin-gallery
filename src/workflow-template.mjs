function demand(ok, status, code, message) {
  if (!ok) throw Object.assign(new Error(message), { status, code });
}

const object = (v, label) => {
  demand(v && typeof v === 'object' && !Array.isArray(v), 400, 'INVALID_WORKFLOW', `${label} 格式无效`);
  return v;
};
const text = (v, label, max, required = false) => {
  demand(typeof v === 'string' && v.length <= max && (!required || v.trim()), 400, 'INVALID_WORKFLOW', `${label} 不能为空或超过 ${max} 字符`);
  return v.trim();
};
const array = (v, label, max) => {
  demand(Array.isArray(v) && v.length <= max, 400, 'INVALID_WORKFLOW', `${label} 格式无效或过长`);
  return v;
};
export function validateWorkflowTemplate(input) {
  const v = object(input, '模板');
  const members = array(v.members, '成员', 32).map((raw) => {
    const m = object(raw, '成员');
    const access = {};
    for (const key of ['gallerySkill', 'galleryMcp']) {
      if (m[key] === undefined) continue;
      demand(typeof m[key] === 'boolean', 400, 'INVALID_WORKFLOW', `${key} 必须是布尔值`);
      access[key] = m[key];
    }
    return { ...access, name: text(m.name, '成员名称', 80, true), summary: text(m.summary, '简介', 16000), role: text(m.role, '角色', 16000), executionPrompt: text(m.executionPrompt, '执行指令', 16000) };
  });
  demand(members.every(m => /^[\p{L}\p{N}_-]+$/u.test(m.name) && m.name.toLowerCase() !== 'captain') && new Set(members.map(m => m.name.toLowerCase())).size === members.length, 400, 'INVALID_WORKFLOW', '成员名称重复或无效');
  const tasks = array(v.tasks, '节点', 32).map((raw) => {
    const t = object(raw, '节点'), g = object(t.general, '任务要求');
    const id = text(t.id, '节点 ID', 80, true);
    demand(/^[a-zA-Z0-9_-]+$/.test(id) && typeof t.checkpoint === 'boolean', 400, 'INVALID_WORKFLOW', '节点 ID 或类型无效');
    demand(!/^t\d+$/.test(id) || Number.isSafeInteger(Number(id.slice(1))) && Number(id.slice(1)) < Number.MAX_SAFE_INTEGER, 400, 'INVALID_WORKFLOW', '节点序号超出范围');
    return { id, subject: text(t.subject, '节点名称', 200, true), assignee: text(t.assignee, '负责人', 80), dependencies: array(t.dependencies, '依赖', 32).map(d => text(d, '依赖 ID', 80, true)), checkpoint: t.checkpoint, general: { requirements: text(g.requirements, '任务要求', 16000), deliverables: text(g.deliverables, '交付物', 16000), acceptance: text(g.acceptance, '验收标准', 16000) } };
  });
  demand(tasks.length > 0 && new Set(tasks.map(t => t.id)).size === tasks.length, 400, 'INVALID_WORKFLOW', '需要 1–32 个不同的节点');
  const ids = new Set(tasks.map(t => t.id)), names = new Set(members.map(m => m.name));
  for (const t of tasks) {
    demand(!(t.checkpoint && t.assignee) && (!t.assignee || t.assignee === 'captain' || names.has(t.assignee)), 400, 'INVALID_WORKFLOW', '节点负责人不存在或人工节点分配了负责人');
    demand(t.dependencies.every(id => ids.has(id)) && new Set(t.dependencies).size === t.dependencies.length, 400, 'INVALID_WORKFLOW', '节点依赖缺失或重复');
  }
  const done = new Set(), visiting = new Set();
  function visit(id) {
    demand(!visiting.has(id), 400, 'INVALID_WORKFLOW', '节点依赖产生循环');
    if (done.has(id)) return;
    visiting.add(id);
    tasks.find(t => t.id === id).dependencies.forEach(visit);
    visiting.delete(id); done.add(id);
  }
  tasks.forEach(t => visit(t.id));
  const positions = {};
  for (const [key, raw] of Object.entries(object(v.positions ?? {}, '画布位置'))) {
    const p = object(raw, '位置');
    demand(key.startsWith('task:') && ids.has(key.slice(5)) && ['x', 'y'].every(k => typeof p[k] === 'number' && Number.isFinite(p[k]) && p[k] >= 0 && p[k] <= 10000), 400, 'INVALID_WORKFLOW', '画布位置无效');
    positions[key] = { x: p.x, y: p.y };
  }
  return { name: text(v.name, '名称', 120, true), description: text(v.description, '描述', 2000), inputs: text(v.inputs, '输入', 4000), tags: [...new Set(array(v.tags, '标签', 12).map(t => text(t, '标签', 40, true)))], members, tasks, positions };
}
export function workflowFromResource(resource) {
  const file = resource.files?.find(f => f.path === 'workflow.json' && f.encoding === 'utf8');
  demand(file, 400, 'INVALID_WORKFLOW', '缺少 workflow.json');
  let definition;
  try { definition = JSON.parse(file.content); } catch { demand(false, 400, 'INVALID_WORKFLOW', 'workflow.json 不是有效 JSON'); }
  return validateWorkflowTemplate(definition);
}
