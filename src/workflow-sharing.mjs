import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { demand, digest } from "./model.mjs";
import {
  validateWorkflowTemplate,
  workflowTemplateIssues,
} from "./workflow-template.mjs";
import { RemoteGalleryStore } from "./remote-store.mjs";

export function workflowSharingStatus(store) {
  const { activeLibraryId: libraryId, service } = store.read();
  return {
    available: true,
    libraryId,
    configured:
      libraryId === "local" ||
      Boolean(service?.url && service.userId && service.token),
  };
}

// Reconstruct only the removed timeout field in its former canonical order.
// Matching the stored source hash still detects every meaningful source edit.
function legacySourceMatches(clean, loops, expected) {
  if (!clean.loops?.length || !Array.isArray(loops)) return false;
  const legacyLoops = clean.loops.map(
    ({ gateId, entryId, mode, maxRounds, ...rest }) => ({
      gateId,
      entryId,
      mode,
      maxRounds,
      timeoutMinutes: loops.find((loop) => loop?.gateId === gateId)
        ?.timeoutMinutes,
      ...rest,
    }),
  );
  if (
    legacyLoops.some(
      (loop) =>
        !Number.isSafeInteger(loop.timeoutMinutes) ||
        loop.timeoutMinutes < 1 ||
        loop.timeoutMinutes > 1440,
    )
  )
    return false;
  return digest(JSON.stringify({ ...clean, loops: legacyLoops })) === expected;
}
function writeRegistry(file, registry) {
  const temp = file + "." + randomUUID();
  try {
    writeFileSync(temp, JSON.stringify(registry) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    renameSync(temp, file);
  } finally {
    rmSync(temp, { force: true });
  }
}

/** Upload to the library selected when the request begins. */
export async function uploadWorkflowTemplate(
  store,
  definition,
  source,
  createRemote = (connection) => new RemoteGalleryStore(connection),
) {
  demand(
    source &&
      typeof source.id === "string" &&
      source.id.length > 0 &&
      source.id.length <= 200 &&
      Number.isSafeInteger(source.version) &&
      source.version > 0 &&
      (source.language === undefined || ["zh", "en"].includes(source.language)),
    400,
    "INVALID_TEMPLATE_SOURCE",
    "模板来源或版本无效",
  );
  const clean = validateWorkflowTemplate(definition);
  demand(
    workflowTemplateIssues(clean).length === 0,
    400,
    "INCOMPLETE_TEMPLATE",
    "请先补全模板的通用任务要求",
  );
  const { activeLibraryId: libraryId, service } = store.read();
  const useCenter = libraryId === "center";
  demand(
    !useCenter || Boolean(service?.url && service.userId && service.token),
    400,
    "CENTER_NOT_CONFIGURED",
    "请先在 Gallery 存储设置中重新连接中心服务",
  );
  const adapter = useCenter ? createRemote(service) : store.adapter(libraryId);
  const key = digest(
    JSON.stringify([
      ...(useCenter ? [service.url, service.userId] : ["local"]),
      source.id,
      source.version,
      source.language || "",
    ]),
  );
  const sourceDigest = digest(JSON.stringify(clean));
  mkdirSync(store.directory, { recursive: true, mode: 0o700 });
  const file = join(store.directory, "workflow-uploads.json"),
    lock = file + ".lock";
  try {
    mkdirSync(lock);
  } catch (error) {
    if (error.code === "EEXIST")
      demand(false, 409, "UPLOAD_BUSY", "模板正在上传，请稍后重试");
    throw error;
  }
  try {
    let registry;
    try {
      registry = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") registry = { format: 1, entries: {} };
      else throw error;
    }
    demand(
      registry?.format === 1 &&
        registry.entries &&
        typeof registry.entries === "object" &&
        !Array.isArray(registry.entries),
      500,
      "INVALID_UPLOAD_REGISTRY",
      "模板上传记录无效，请先备份检查",
    );
    const previous = registry.entries[key];
    if (previous) {
      let existing;
      let matches =
        previous.sourceDigest === sourceDigest ||
        legacySourceMatches(clean, definition.loops, previous.sourceDigest);
      if (!matches) {
        try {
          existing = await adapter.getResource(previous.id);
        } catch (error) {
          if (error.status !== 404) throw error;
        }
        let saved;
        try {
          saved = JSON.parse(
            existing?.files?.find((file) => file.path === "workflow.json")
              ?.content,
          );
        } catch {
          /* No recoverable legacy timeout. */
        }
        matches = legacySourceMatches(
          clean,
          saved?.loops,
          previous.sourceDigest,
        );
      }
      demand(
        matches,
        409,
        "SOURCE_VERSION_CHANGED",
        "同一模板版本的内容已变化，请先另存为新版本",
      );
      try {
        existing ??= await adapter.getResource(previous.id);
        demand(
          existing.canEdit === true && existing.type === "workflow",
          403,
          "UPLOAD_NOT_OWNED",
          "模板副本不属于当前用户，请先检查 Gallery 身份",
        );
        if (previous.sourceDigest !== sourceDigest) {
          previous.sourceDigest = sourceDigest;
          writeRegistry(file, registry);
        }
        return {
          id: existing.id,
          name: existing.name,
          libraryId,
          sourceVersion: source.version,
          reused: true,
        };
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
    const created = await adapter.createResource(
      {
        type: "workflow",
        name: clean.name,
        description: clean.description,
        tags: clean.tags,
        files: [
          {
            path: "workflow.json",
            encoding: "utf8",
            content: JSON.stringify(clean, null, 2) + "\n",
          },
        ],
        metadata: {
          format: "dsh-teamflow-template-v1",
          teamflowSource: {
            id: source.id,
            version: source.version,
            ...(source.language ? { language: source.language } : {}),
          },
        },
      },
      { username: store.username() },
    );
    registry.entries[key] = { id: created.id, sourceDigest };
    writeRegistry(file, registry);
    return {
      id: created.id,
      name: created.name,
      libraryId,
      sourceVersion: source.version,
      reused: false,
    };
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}
