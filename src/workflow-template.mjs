import {
  parseWorkflowRoute,
  validateWorkflowRouting,
} from "./workflow-routing.mjs";
import { assertWorkflowDag, validateWorkflowLoops } from "./workflow-loops.mjs";

function demand(ok, status, code, message) {
  if (!ok) throw Object.assign(new Error(message), { status, code });
}

const object = (v, label) => {
  demand(
    v && typeof v === "object" && !Array.isArray(v),
    400,
    "INVALID_WORKFLOW",
    `${label} 格式无效`,
  );
  return v;
};
const text = (v, label, max, required = false) => {
  demand(
    typeof v === "string" && v.length <= max && (!required || v.trim()),
    400,
    "INVALID_WORKFLOW",
    `${label} 不能为空或超过 ${max} 字符`,
  );
  return v.trim();
};
const array = (v, label, max) => {
  demand(
    Array.isArray(v) && v.length <= max,
    400,
    "INVALID_WORKFLOW",
    `${label} 格式无效或过长`,
  );
  return v;
};
export const MAX_WORKFLOW_TEXT_LENGTH = 256000;
export const MAX_WORKFLOW_MEMBERS = 64;
export const MAX_WORKFLOW_TASKS = 512;
export const MAX_WORKFLOW_DEPENDENCIES = MAX_WORKFLOW_TASKS - 1;

export function validateWorkflowTemplate(input, options = {}) {
  const v = object(input, "模板");
  const members = array(v.members, "成员", MAX_WORKFLOW_MEMBERS).map((raw) => {
    const m = object(raw, "成员");
    const access = {};
    for (const key of ["gallerySkill", "galleryMcp"]) {
      if (m[key] === undefined) continue;
      demand(
        typeof m[key] === "boolean",
        400,
        "INVALID_WORKFLOW",
        `${key} 必须是布尔值`,
      );
      access[key] = m[key];
    }
    return {
      ...access,
      name: text(m.name, "成员名称", 80, true),
      summary: text(m.summary, "简介", MAX_WORKFLOW_TEXT_LENGTH),
      role: text(m.role, "角色", MAX_WORKFLOW_TEXT_LENGTH),
      executionPrompt: text(
        m.executionPrompt,
        "执行指令",
        MAX_WORKFLOW_TEXT_LENGTH,
      ),
    };
  });
  demand(
    members.every(
      (m) =>
        /^[\p{L}\p{N}_-]+$/u.test(m.name) && m.name.toLowerCase() !== "captain",
    ) &&
      new Set(members.map((m) => m.name.toLowerCase())).size === members.length,
    400,
    "INVALID_WORKFLOW",
    "成员名称重复或无效",
  );
  const tasks = array(v.tasks, "节点", MAX_WORKFLOW_TASKS).map((raw) => {
    const t = object(raw, "节点"),
      g = object(t.general, "任务要求");
    const id = text(t.id, "节点 ID", 80, true);
    demand(
      /^[a-zA-Z0-9_-]+$/.test(id) && typeof t.checkpoint === "boolean",
      400,
      "INVALID_WORKFLOW",
      "节点 ID 或类型无效",
    );
    demand(
      !/^t\d+$/.test(id) ||
        (Number.isSafeInteger(Number(id.slice(1))) &&
          Number(id.slice(1)) < Number.MAX_SAFE_INTEGER),
      400,
      "INVALID_WORKFLOW",
      "节点序号超出范围",
    );
    demand(
      t.reviewMode === undefined ||
        (t.checkpoint && ["human", "ai"].includes(t.reviewMode)),
      400,
      "INVALID_WORKFLOW",
      "模板审核方式无效",
    );
    demand(
      t.checkpointKind === undefined ||
        (t.checkpoint && ["gate", "acceptance"].includes(t.checkpointKind)),
      400,
      "INVALID_WORKFLOW",
      "模板审核节点类型无效",
    );
    demand(
      t.kind === undefined || ["work", "archive"].includes(t.kind),
      400,
      "INVALID_WORKFLOW",
      "模板任务类型无效",
    );
    let archive;
    if (t.kind === "archive") {
      demand(
        !t.checkpoint && !t.assignee,
        400,
        "INVALID_WORKFLOW",
        "归档节点不能设置负责人或门控",
      );
      const config =
        t.archive === undefined ? {} : object(t.archive, "归档配置");
      demand(
        config.copyFiles === undefined || typeof config.copyFiles === "boolean",
        400,
        "INVALID_WORKFLOW",
        "copyFiles 必须是布尔值",
      );
      archive = {
        copyFiles: config.copyFiles === true,
        paths: [
          ...new Set(
            array(config.paths ?? [], "归档路径", 100).map((p) =>
              text(p, "归档路径", 1000, true),
            ),
          ),
        ],
      };
    }
    return {
      ...(t.dynamicRoute === undefined
        ? {}
        : { dynamicRoute: parseWorkflowRoute(t.dynamicRoute) }),
      ...(t.routeJoin === undefined
        ? {}
        : {
            routeJoin: [
              ...new Set(
                array(t.routeJoin, "分支汇合", MAX_WORKFLOW_DEPENDENCIES).map(
                  (id) => text(id, "汇合上游 ID", 80, true),
                ),
              ),
            ],
          }),
      id,
      subject: text(t.subject, "节点名称", 200, true),
      assignee: text(t.assignee, "负责人", 80),
      dependencies: array(
        t.dependencies,
        "依赖",
        MAX_WORKFLOW_DEPENDENCIES,
      ).map((d) => text(d, "依赖 ID", 80, true)),
      checkpoint: t.checkpoint,
      ...(t.checkpointKind ? { checkpointKind: t.checkpointKind } : {}),
      ...(t.reviewMode ? { reviewMode: t.reviewMode } : {}),
      ...(archive ? { kind: "archive", archive } : {}),
      general: {
        requirements: text(
          g.requirements,
          "任务要求",
          MAX_WORKFLOW_TEXT_LENGTH,
        ),
        deliverables: text(g.deliverables, "交付物", MAX_WORKFLOW_TEXT_LENGTH),
        acceptance: text(g.acceptance, "验收标准", MAX_WORKFLOW_TEXT_LENGTH),
      },
    };
  });
  demand(
    tasks.length > 0 && new Set(tasks.map((t) => t.id)).size === tasks.length,
    400,
    "INVALID_WORKFLOW",
    `需要 1–${MAX_WORKFLOW_TASKS} 个不同的节点`,
  );
  const ids = new Set(tasks.map((t) => t.id)),
    names = new Set(members.map((m) => m.name));
  for (const t of tasks) {
    demand(
      !(t.checkpoint && t.assignee) &&
        (!t.assignee || t.assignee === "captain" || names.has(t.assignee)),
      400,
      "INVALID_WORKFLOW",
      "节点负责人不存在或人工节点分配了负责人",
    );
    demand(
      t.dependencies.every((id) => ids.has(id)) &&
        new Set(t.dependencies).size === t.dependencies.length,
      400,
      "INVALID_WORKFLOW",
      "节点依赖缺失或重复",
    );
  }
  assertWorkflowDag(tasks);
  const loops = validateWorkflowLoops(v.loops, tasks, members, options);
  validateWorkflowRouting(tasks, loops);
  const positions = {};
  for (const [key, raw] of Object.entries(
    object(v.positions ?? {}, "画布位置"),
  )) {
    const p = object(raw, "位置");
    demand(
      key.startsWith("task:") &&
        ids.has(key.slice(5)) &&
        ["x", "y"].every(
          (k) =>
            typeof p[k] === "number" &&
            Number.isFinite(p[k]) &&
            p[k] >= 0 &&
            p[k] <= 10000,
        ),
      400,
      "INVALID_WORKFLOW",
      "画布位置无效",
    );
    positions[key] = { x: p.x, y: p.y };
  }
  return {
    name: text(v.name, "名称", 120, true),
    description: text(v.description, "描述", 2000),
    inputs: text(v.inputs, "输入", 4000),
    tags: [
      ...new Set(
        array(v.tags, "标签", 12).map((t) => text(t, "标签", 40, true)),
      ),
    ],
    members,
    tasks,
    positions,
    ...(loops ? { loops } : {}),
  };
}
export function workflowFromResource(resource, options = {}) {
  const file = resource.files?.find(
    (f) => f.path === "workflow.json" && f.encoding === "utf8",
  );
  demand(file, 400, "INVALID_WORKFLOW", "缺少 workflow.json");
  let definition;
  try {
    definition = JSON.parse(file.content);
  } catch {
    demand(false, 400, "INVALID_WORKFLOW", "workflow.json 不是有效 JSON");
  }
  return validateWorkflowTemplate(definition, options);
}

export function workflowTemplateIssues(definition) {
  const issues = [];
  try {
    validateWorkflowTemplate(definition);
  } catch (error) {
    issues.push(error.message);
  }
  if (definition.tasks.some((t) => !t.general.requirements.trim()))
    issues.push("请填写每个节点的通用任务要求或通用检查要求");
  return issues;
}
