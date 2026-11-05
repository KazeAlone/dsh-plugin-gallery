import { digest } from "./model.mjs";
import { gallerySkillName } from "./skill-provider.mjs";

export function countUsage(ctx, store, id, type, identity) {
  try {
    store.adapter().recordResourceUse({
      id,
      type,
      usageId: digest(JSON.stringify([type, ...identity])),
    });
  } catch (error) {
    ctx.logger?.warn?.(`Gallery usage could not be recorded: ${error.message}`);
  }
}

function countSkill(ctx, store, name, identity) {
  try {
    const row = store.adapter().read().resources.find(
      (resource) => resource.type === "skill" && gallerySkillName(resource.id) === name,
    );
    if (row) countUsage(ctx, store, row.id, "skill", identity);
  } catch (error) {
    ctx.logger?.warn?.(`Gallery Skill usage could not be recorded: ${error.message}`);
  }
}

export function registerUsageTracking(ctx, store, getMcpRuntime) {
  ctx.on("agent/pre-step", async ({ agent, turn, signal }, next) => {
    const decision = await next();
    if (decision.kind !== "reject" && !signal.aborted) {
      for (const { source } of decision.messages) {
        if (source.kind === "skill-invocation" && source.name.startsWith("gskill-")) {
          countSkill(ctx, store, source.name, ["turn", agent.id, turn]);
        }
      }
    }
    return decision;
  });

  ctx.on("tools/post-execute", async (exec, result, next) => {
    const resourceId = exec.name.startsWith("mcp__")
      ? getMcpRuntime()?.resourceForTool(exec.name)
      : undefined;
    const decision = await next();
    if (!exec.agent || result.isError || decision.kind !== "accept" || exec.signal.aborted) {
      return decision;
    }
    const identity = ["tool", exec.agent.id, exec.callId];
    if (resourceId) countUsage(ctx, store, resourceId, "mcp", identity);
    if (exec.name === "skill" && result.value?.provider === "gallery") {
      countSkill(ctx, store, result.value.name, identity);
    }
    return decision;
  });
}
