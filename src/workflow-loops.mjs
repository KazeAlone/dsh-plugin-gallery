// Portable TeamFlow 0.2.15 template rules. Runtime state stays in TeamFlow.
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
export function workflowLoopBody(
  tasks,
  { gateId, entryId, rejectTaskIds = [] },
) {
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
  for (const id of rejectTaskIds) {
    check(id !== gateId && !ancestors.has(id), "退回任务不能同时位于首轮路径");
    check(
      tasks.some((task) => task.id === id),
      "退回路径中的任务不存在",
    );
    body.add(id);
  }
  return [...body];
}
export function validateWorkflowLoops(
  value,
  tasks,
  members,
  { draft = false, requireExecutionSetup = false } = {},
) {
  if (value === undefined) return undefined;
  check(Array.isArray(value) && value.length <= 256, "最多配置 256 个循环");
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
    const maxRounds = Number(raw.maxRounds);
    check(
      Number.isSafeInteger(maxRounds) && maxRounds >= 1 && maxRounds <= 20,
      "轮次上限必须为 1–20，包含首次执行",
    );
    const returns = raw.rejectTaskIds;
    check(
      returns === undefined ||
        (Array.isArray(returns) &&
          returns.length <= 31 &&
          returns.every((id) => typeof id === "string" && id) &&
          new Set(returns).size === returns.length),
      "退回路径中的任务无效或重复",
    );
    const loop = {
      gateId: raw.gateId,
      entryId: raw.entryId,
      mode: raw.mode,
      maxRounds,
      ...(raw.rejectToEntry === true || returns?.length
        ? { rejectToEntry: true }
        : {}),
      ...(returns?.length
        ? {
            rejectTaskIds: [...returns],
            ...(raw.rejectDag === true ? { rejectDag: true } : {}),
          }
        : {}),
      ...(typeof raw.reviewer === "string" && raw.reviewer.trim()
        ? { reviewer: raw.reviewer.trim() }
        : {}),
    };
    const gate = tasks.find((t) => t.id === loop.gateId);
    check(
      gate?.checkpoint && gate.checkpointKind !== "acceptance",
      "循环需要独立门控，验收节点不能作为循环门控",
    );
    const ancestors = workflowAncestors(tasks, gate.id);
    const connected = !!loop.entryId && ancestors.has(loop.entryId);
    check(draft || connected, "循环入口必须位于门控上游");
    const entry = tasks.find((t) => t.id === loop.entryId);
    check(
      !loop.entryId || (entry && !entry.checkpoint && entry.kind !== "archive"),
      "请选择有效的循环入口任务",
    );
    const body = new Set(
      connected
        ? workflowLoopBody(tasks, loop)
        : [loop.entryId, ...(returns || [])].filter(Boolean),
    );
    check(body.size <= 512 && !body.has(gate.id), "循环区域无效");
    for (const id of [...body, gate.id]) {
      check(!occupied.has(id), "不支持嵌套或共享节点的循环");
      occupied.add(id);
    }
    const returnIds = loop.rejectTaskIds || [];
    check(!returnIds.includes(loop.entryId), "退回任务不能同时位于首轮路径");
    for (const id of body) {
      const task = tasks.find((t) => t.id === id);
      check(
        task && !task.checkpoint && task.kind !== "archive",
        "循环与退回路径必须由普通执行任务组成",
      );
      if (requireExecutionSetup)
        check(
          task.assignee && members.some((m) => m.name === task.assignee),
          "请先为循环内任务指定有效负责人",
        );
      const index = returnIds.indexOf(id);
      if (index >= 0) {
        check(!ancestors.has(id), "退回任务不能同时位于首轮路径");
        if (draft && !connected) continue;
        const earlier = loop.rejectDag ? returnIds : returnIds.slice(0, index);
        const later = loop.rejectDag ? returnIds : returnIds.slice(index + 1);
        check(
          task.dependencies.every(
            (dep) =>
              earlier.includes(dep) || (ancestors.has(dep) && !body.has(dep)),
          ) &&
            !tasks.some(
              (other) =>
                other.dependencies.includes(id) && !later.includes(other.id),
            ),
          "退回任务只能依赖首轮外部输入或同一路径中的任务，输出不能绕过门控",
        );
      } else if (connected) {
        check(
          !tasks.some(
            (t) =>
              !body.has(t.id) &&
              t.id !== gate.id &&
              t.dependencies.includes(id),
          ),
          "循环内的输出必须经过门控才能连接环外",
        );
      }
    }
    if (loop.mode === "ai" && requireExecutionSetup) {
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
