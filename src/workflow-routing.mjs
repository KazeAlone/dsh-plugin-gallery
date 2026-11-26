import { workflowAncestors, workflowLoopBody } from "./workflow-loops.mjs";

const check = (ok, message) => {
  if (!ok)
    throw Object.assign(new Error(message), {
      status: 400,
      code: "INVALID_WORKFLOW",
    });
};
const text = (value, max) =>
  typeof value === "string" && !!value.trim() && value.length <= max;
const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

// Portable configuration only: decisions, history and execution state never enter templates.
export function parseWorkflowRoute(value) {
  const message =
    "动态路由需要 2–12 个输出状态，每项须填写名称、判断条件和有效去向；同名状态的判断条件须不同";
  check(record(value) && ["agent", "human"].includes(value.mode), message);
  check(
    Array.isArray(value.outcomes) &&
      value.outcomes.length >= 2 &&
      value.outcomes.length <= 12,
    message,
  );
  check(
    value.outcomes.every(
      (outcome) =>
        record(outcome) &&
        text(outcome.id, 80) &&
        /^[a-zA-Z0-9_-]+$/.test(outcome.id) &&
        text(outcome.label, 80) &&
        text(outcome.condition, 2000) &&
        Array.isArray(outcome.targets) &&
        outcome.targets.length <= 100 &&
        outcome.targets.every((id) => text(id, 160)) &&
        new Set(outcome.targets).size === outcome.targets.length,
    ),
    message,
  );
  check(
    new Set(value.outcomes.map((outcome) => outcome.id)).size ===
      value.outcomes.length &&
      new Set(
        value.outcomes.map((outcome) =>
          JSON.stringify([outcome.label.trim(), outcome.condition.trim()]),
        ),
      ).size === value.outcomes.length,
    message,
  );
  return {
    mode: value.mode,
    outcomes: value.outcomes.map(({ id, label, condition, targets }) => ({
      id,
      label: label.trim(),
      condition: condition.trim(),
      targets: [...targets],
    })),
  };
}

export function validateWorkflowRouting(tasks, loops = []) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const routed = new Set();
  for (const task of tasks) {
    check(
      !task.routeJoin?.some(
        (id) => !task.dependencies.includes(id) || byId.get(id)?.dynamicRoute,
      ),
      "分支汇合只能选择当前节点的普通上游连线",
    );
    if (!task.dynamicRoute) continue;
    routed.add(task.id);
    check(
      !task.checkpoint && task.kind !== "archive",
      "只有普通执行任务可以设置动态路由",
    );
    const targets = new Set(
      task.dynamicRoute.outcomes.flatMap((outcome) => outcome.targets),
    );
    const outgoing = tasks.filter((target) =>
      target.dependencies.includes(task.id),
    );
    check(
      targets.size === outgoing.length &&
        outgoing.every((target) => targets.has(target.id)),
      "请在动态路由设置中为每条后续连线指定输出状态",
    );
  }
  if (!routed.size) return;
  let grew = true;
  while (grew) {
    grew = false;
    for (const task of tasks)
      if (
        !routed.has(task.id) &&
        task.dependencies.some((id) => routed.has(id))
      ) {
        routed.add(task.id);
        grew = true;
      }
  }
  for (const loop of loops) {
    const body =
      loop.entryId && workflowAncestors(tasks, loop.gateId).has(loop.entryId)
        ? workflowLoopBody(tasks, loop)
        : [loop.entryId, ...(loop.rejectTaskIds || [])];
    check(
      ![loop.gateId, ...body].some((id) => routed.has(id)),
      "此版本的动态路由路径不能进入门控循环",
    );
  }
}

// Keep references consistent after deleting nodes/edges or enabling an upstream route.
// Do not assign new edges to arbitrary outcomes: the user must choose their meaning.
export function reconcileWorkflowRouting(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return tasks.map((task) => ({
    ...task,
    ...(task.dynamicRoute
      ? {
          dynamicRoute: {
            ...task.dynamicRoute,
            outcomes: task.dynamicRoute.outcomes.map((outcome) => ({
              ...outcome,
              targets: outcome.targets.filter((id) =>
                byId.get(id)?.dependencies.includes(task.id),
              ),
            })),
          },
        }
      : {}),
    ...(task.routeJoin
      ? {
          routeJoin: task.routeJoin.filter(
            (id) =>
              task.dependencies.includes(id) && !byId.get(id)?.dynamicRoute,
          ),
        }
      : {}),
  }));
}

// A shared downstream node may be selected by several outcomes. Removing one
// state wire must keep the dependency until the last state wire is removed.
export function disconnectWorkflowRoute(tasks, from, to, outcomeId) {
  const next = tasks.map((task) =>
    task.id === from && task.dynamicRoute && outcomeId
      ? {
          ...task,
          dynamicRoute: {
            ...task.dynamicRoute,
            outcomes: task.dynamicRoute.outcomes.map((outcome) =>
              outcome.id === outcomeId
                ? {
                    ...outcome,
                    targets: outcome.targets.filter((id) => id !== to),
                  }
                : outcome,
            ),
          },
        }
      : task,
  );
  const keepDependency =
    outcomeId &&
    next
      .find((task) => task.id === from)
      ?.dynamicRoute?.outcomes.some((outcome) => outcome.targets.includes(to));
  return reconcileWorkflowRouting(
    next.map((task) =>
      task.id === to && !keepDependency
        ? {
            ...task,
            dependencies: task.dependencies.filter((id) => id !== from),
          }
        : task,
    ),
  );
}

export function workflowRouteLabel(outcome, route) {
  return route?.outcomes.some(
    (other) =>
      other.id !== outcome.id && other.label.trim() === outcome.label.trim(),
  )
    ? `${outcome.label} · ${outcome.condition}`
    : outcome.label;
}
