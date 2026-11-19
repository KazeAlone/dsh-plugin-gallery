import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { demand } from "./model.mjs";

const names = new Set([
  "teamflow",
  "dsh-agent-teams",
  "dsh-teamflow",
  "@yogurtss/dsh-teamflow",
]);
/** Cordis exposes live plugin runtimes and validated fiber configs. Never read unrelated config fields. */
export function teamflowTemplateTarget(ctx, environment = process.env) {
  const fallback = join(homedir(), ".dsh-teamflow", "templates");
  let found = false;
  const directories = new Set();
  for (const runtime of ctx.registry?.values?.() ?? []) {
    if (!names.has(runtime.name)) continue;
    found = true;
    for (const fiber of runtime.fibers ?? []) {
      // Cordis FiberState.ACTIVE = 2. Pending/failed plugins do not serve the template API.
      if (fiber.state !== 2) continue;
      const value = fiber.config?.templateDirectory;
      demand(
        value === undefined || typeof value === "string",
        400,
        "INVALID_TEAMFLOW_DIRECTORY",
        "TeamFlow 模板目录配置无效",
      );
      directories.add(value ? resolve(value) : fallback);
    }
  }
  demand(
    !found || directories.size > 0,
    409,
    "TEAMFLOW_INACTIVE",
    "TeamFlow 尚未启动成功，请先检查该插件状态",
  );
  demand(
    directories.size <= 1,
    409,
    "AMBIGUOUS_TEAMFLOW_DIRECTORY",
    "检测到多个不同的 TeamFlow 模板目录，无法确定目标，请检查当前宿主配置",
  );
  if (directories.size)
    return { directory: [...directories][0], source: "teamflow" };
  return {
    directory: resolve(environment.DSH_TEAMFLOW_TEMPLATE_DIR || fallback),
    source: environment.DSH_TEAMFLOW_TEMPLATE_DIR ? "environment" : "default",
  };
}
