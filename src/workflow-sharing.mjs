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
    configured: libraryId === "local" || Boolean(service?.url && service.userId && service.token),
  };
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
      demand(
        previous.sourceDigest === sourceDigest,
        409,
        "SOURCE_VERSION_CHANGED",
        "同一模板版本的内容已变化，请先另存为新版本",
      );
      try {
        const existing = await adapter.getResource(previous.id);
        demand(
          existing.canEdit === true && existing.type === "workflow",
          403,
          "UPLOAD_NOT_OWNED",
          "模板副本不属于当前用户，请先检查 Gallery 身份",
        );
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
