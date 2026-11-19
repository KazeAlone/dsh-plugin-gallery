import { digest } from "./model.mjs";
import { gallerySkillName } from "./skill-provider.mjs";

export async function countUsage(ctx, store, id, type, identity) {
  try {
    await store.adapter().recordResourceUse({
      id,
      type,
      usageId: digest(JSON.stringify([type, ...identity])),
    });
  } catch (error) {
    ctx.logger?.warn?.(`Gallery usage could not be recorded: ${error.message}`);
  }
}

async function countSkill(ctx, store, name, identity) {
  try {
    const row = (await store.adapter().read("skill")).resources.find(
      (resource) =>
        resource.type === "skill" && gallerySkillName(resource.id) === name,
    );
    if (row) await countUsage(ctx, store, row.id, "skill", identity);
  } catch (error) {
    ctx.logger?.warn?.(
      `Gallery Skill usage could not be recorded: ${error.message}`,
    );
  }
}

export function registerUsageTracking(ctx, store, getMcpRuntime) {
  ctx.on("agent/pre-step", async ({ agent, turn, signal }, next) => {
    const decision = await next();
    if (decision.kind !== "reject" && !signal.aborted) {
      for (const { source } of decision.messages) {
        if (
          source.kind === "skill-invocation" &&
          source.name.startsWith("gskill-")
        ) {
          await countSkill(ctx, store, source.name, ["turn", agent.id, turn]);
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
    if (
      !exec.agent ||
      result.isError ||
      decision.kind !== "accept" ||
      exec.signal.aborted
    ) {
      return decision;
    }
    const identity = ["tool", exec.agent.id, exec.callId];
    if (resourceId) await countUsage(ctx, store, resourceId, "mcp", identity);
    if (exec.name === "skill" && result.value?.provider === "gallery") {
      await countSkill(ctx, store, result.value.name, identity);
    }
    if (exec.name === "gallery_skill_load" && result.value?.id) {
      await countUsage(ctx, store, result.value.id, "skill", identity);
    }
    return decision;
  });
}
