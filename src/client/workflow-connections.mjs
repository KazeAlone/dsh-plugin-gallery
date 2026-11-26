import {
  assertWorkflowDag,
  validateWorkflowLoops,
  workflowAncestors,
} from "../workflow-loops.mjs";
const plain = (task) => task && !task.checkpoint && task.kind !== "archive";
const fail = (message) => {
  throw new Error(message);
};

export function configureRejectTarget(tasks, loops = [], gateId, targetId) {
  const gate = tasks.find((t) => t.id === gateId),
    target = tasks.find((t) => t.id === targetId);
  if (
    !gate?.checkpoint ||
    gate.checkpointKind === "acceptance" ||
    !plain(target)
  )
    fail("REJECT 只能连接普通任务");
  const previous = loops.find((loop) => loop.gateId === gateId);
  const next = {
    gateId,
    entryId: "",
    mode: gate.reviewMode || "human",
    maxRounds: 3,
    rejectToEntry: true,
    ...previous,
  };
  if (workflowAncestors(tasks, gateId).has(targetId)) {
    next.entryId = targetId;
    next.rejectTaskIds = (next.rejectTaskIds || []).filter(
      (id) => id !== targetId,
    );
  } else {
    next.rejectTaskIds = [
      ...new Set([...(next.rejectTaskIds || []), targetId]),
    ];
    next.rejectDag =
      previous?.rejectTaskIds?.length && !previous.rejectDag ? undefined : true;
    next.rejectToEntry = true;
  }
  const result = [...loops.filter((loop) => loop.gateId !== gateId), next];
  validateWorkflowLoops(result, tasks, [], { draft: true });
  return result;
}

export function connectWorkflowNodes(tasks, loops = [], from, to) {
  if (
    !tasks.some((t) => t.id === from) ||
    !tasks.some((t) => t.id === to) ||
    from === to
  )
    fail("请选择两个不同的任务节点");
  const branch = loops.find((loop) => loop.rejectTaskIds?.includes(from));
  let nextLoops = loops;
  if (branch && to === branch.entryId) return { tasks, loops }; // implicit return, never a normal dependency
  if (branch && !branch.rejectTaskIds.includes(to))
    nextLoops = configureRejectTarget(tasks, loops, branch.gateId, to);
  const next = tasks.map((task) =>
    task.id === to
      ? { ...task, dependencies: [...new Set([...task.dependencies, from])] }
      : task,
  );
  assertWorkflowDag(next);
  validateWorkflowLoops(nextLoops, next, [], { draft: true });
  return { tasks: next, loops: nextLoops };
}

export function removeRejectTask(tasks, loops, gateId, id) {
  const loop = loops.find((loop) => loop.gateId === gateId);
  const branch = new Set(loop?.rejectTaskIds || []);
  return {
    tasks: tasks.map((t) => ({
      ...t,
      dependencies: t.dependencies.filter(
        (dep) =>
          !(
            (t.id === id && branch.has(dep)) ||
            (branch.has(t.id) && dep === id)
          ),
      ),
    })),
    loops: loops.map((l) =>
      l.gateId === gateId
        ? {
            ...l,
            rejectTaskIds: (l.rejectTaskIds || []).filter(
              (value) => value !== id,
            ),
          }
        : l,
    ),
  };
}

export function workflowRejectEdges(tasks, loop) {
  const ids = loop.rejectTaskIds || [],
    selected = new Set(ids),
    edges = [];
  if (!ids.length)
    return loop.entryId
      ? [
          {
            from: loop.gateId,
            to: loop.entryId,
            kind: "return",
            gateId: loop.gateId,
          },
        ]
      : [];
  if (!loop.rejectDag) {
    edges.push({
      from: loop.gateId,
      to: ids[0],
      kind: "reject-start",
      gateId: loop.gateId,
    });
    for (let i = 1; i < ids.length; i++)
      if (
        !tasks.find((t) => t.id === ids[i])?.dependencies.includes(ids[i - 1])
      )
        edges.push({
          from: ids[i - 1],
          to: ids[i],
          kind: "reject-order",
          gateId: loop.gateId,
        });
    if (loop.entryId)
      edges.push({
        from: ids.at(-1),
        to: loop.entryId,
        kind: "reject-end",
        gateId: loop.gateId,
      });
    return edges;
  }
  for (const id of ids) {
    if (
      !tasks
        .find((t) => t.id === id)
        ?.dependencies.some((dep) => selected.has(dep))
    )
      edges.push({
        from: loop.gateId,
        to: id,
        kind: "reject-start",
        gateId: loop.gateId,
      });
    if (
      loop.entryId &&
      !tasks.some((t) => selected.has(t.id) && t.dependencies.includes(id))
    )
      edges.push({
        from: id,
        to: loop.entryId,
        kind: "reject-end",
        gateId: loop.gateId,
      });
  }
  return edges;
}
