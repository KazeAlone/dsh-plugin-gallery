// Portable TeamFlow 0.2.12 template rules. Runtime state stays in TeamFlow.
const check = (ok, message) => {
  if (!ok)
    throw Object.assign(new Error(message), {
      status: 400,
      code: "INVALID_WORKFLOW",
    });
};
export function workflowNodeKind(task, loops = []) {
  return task.kind === "archive"
    ? "archive"
    : task.checkpoint
      ? task.checkpointKind === "gate" ||
        loops.some((loop) => loop.gateId === task.id)
        ? "gate"
        : "human"
      : "task";
}
export function workflowAncestors(tasks, id) {
  const found = new Set();
  const visit = (id) => {
    if (found.has(id)) return;
    found.add(id);
    tasks.find((t) => t.id === id)?.dependencies.forEach(visit);
  };
  tasks.find((t) => t.id === id)?.dependencies.forEach(visit);
  return found;
}
export function assertWorkflowDag(tasks) {
  const ids = new Set(tasks.map((t) => t.id)),
    done = new Set(),
    visiting = new Set();
  const visit = (id) => {
    check(!visiting.has(id), "普通依赖不能形成循环，请使用门控 REJECT 返回线");
    if (done.has(id)) return;
    check(ids.has(id), "节点依赖缺失");
    visiting.add(id);
    tasks.find((t) => t.id === id).dependencies.forEach(visit);
    visiting.delete(id);
    done.add(id);
  };
  tasks.forEach((t) => {
    check(
      new Set(t.dependencies).size === t.dependencies.length,
      "节点依赖重复",
    );
    visit(t.id);
  });
}
export function workflowLoopBody(tasks, { gateId, entryId }) {
  const ancestors = workflowAncestors(tasks, gateId);
  check(ancestors.has(entryId), "循环入口必须位于门控上游");
  const body = new Set([entryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of tasks)
      if (
        ancestors.has(t.id) &&
        !body.has(t.id) &&
        t.dependencies.some((id) => body.has(id))
      ) {
        body.add(t.id);
        changed = true;
      }
  }
  return [...body];
}
export function validateWorkflowLoops(value, tasks, members) {
  if (value === undefined) return undefined;
  check(Array.isArray(value) && value.length <= 16, "最多配置 16 个循环");
  const occupied = new Set();
  const loops = value.map((raw) => {
    check(
      raw &&
        typeof raw === "object" &&
        typeof raw.gateId === "string" &&
        typeof raw.entryId === "string" &&
        ["human", "ai"].includes(raw.mode),
      "请配置循环入口、门控和审核方式",
    );
    const maxRounds = Number(raw.maxRounds),
      timeoutMinutes = Number(raw.timeoutMinutes);
    check(
      Number.isSafeInteger(maxRounds) && maxRounds >= 1 && maxRounds <= 20,
      "轮次上限必须为 1–20，包含首次执行",
    );
    check(
      Number.isSafeInteger(timeoutMinutes) &&
        timeoutMinutes >= 1 &&
        timeoutMinutes <= 1440,
      "执行超时必须为 1–1440 分钟",
    );
    const loop = {
      gateId: raw.gateId,
      entryId: raw.entryId,
      mode: raw.mode,
      maxRounds,
      timeoutMinutes,
      ...(raw.rejectToEntry === true ? { rejectToEntry: true } : {}),
      ...(typeof raw.reviewer === "string" && raw.reviewer.trim()
        ? { reviewer: raw.reviewer.trim() }
        : {}),
    };
    const gate = tasks.find((t) => t.id === loop.gateId);
    check(
      gate?.checkpoint && gate.checkpointKind !== "acceptance",
      "循环需要独立门控，验收节点不能作为循环门控",
    );
    const body = new Set(workflowLoopBody(tasks, loop));
    check(
      body.size > 0 && body.size <= 32 && !body.has(gate.id),
      "循环区域无效",
    );
    for (const id of [...body, gate.id]) {
      check(!occupied.has(id), "不支持嵌套或共享节点的循环");
      occupied.add(id);
    }
    for (const id of body) {
      const task = tasks.find((t) => t.id === id);
      check(task.kind !== "archive", "成果归档节点应放在门控的 PASS 路径之后");
      check(
        task.assignee && members.some((m) => m.name === task.assignee),
        "请先为循环内任务指定有效负责人",
      );
      check(!task.checkpoint, "循环区域必须由执行任务组成并汇合到唯一门控");
      check(
        !tasks.some(
          (t) =>
            !body.has(t.id) && t.id !== gate.id && t.dependencies.includes(id),
        ),
        "循环内的输出必须经过门控才能连接环外",
      );
    }
    if (loop.mode === "ai") {
      check(
        loop.reviewer && members.some((m) => m.name === loop.reviewer),
        "请选择有效的 AI 审核成员",
      );
      check(
        !tasks.some((t) => body.has(t.id) && t.assignee === loop.reviewer),
        "AI 审核成员不能负责循环内任务，请选择独立审核成员",
      );
    }
    return loop;
  });
  return loops.length ? loops : undefined;
}
