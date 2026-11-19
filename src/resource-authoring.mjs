import { demand, normalizeResource, revision, TYPES } from "./model.mjs";
import {
  readSkill,
  skillDocument,
  skillIssues,
  syncSkillAttachments,
} from "./client/skill-format.mjs";
import { agentIssues } from "./client/agent-format.mjs";
import { importResourceFiles } from "./client/resource-import.mjs";
import { validateMcpConfig, mergeMcpCredentials } from "./mcp-config.mjs";
import {
  workflowFromResource,
  workflowTemplateIssues,
} from "./workflow-template.mjs";

const file = (path, content) => ({ path, encoding: "utf8", content });
function editable(input) {
  const resource = normalizeResource(input);
  resource.files = resource.files.map(({ path, encoding, content }) => ({
    path,
    encoding,
    content,
  }));
  return resource;
}
export function resourceExample(type) {
  demand(
    TYPES.includes(type),
    400,
    "INVALID_TYPE",
    "资源类型必须为 skill、agent、mcp 或 workflow",
  );
  const base = {
    type,
    name: "示例资源",
    description: "说明用途与适用场景",
    tags: [],
    files: [],
    metadata: {},
    references: [],
  };
  if (type === "skill")
    base.files = [
      file(
        "SKILL.md",
        skillDocument(
          "example-skill",
          base.description,
          "## 步骤\n根据用户提供的材料处理任务，检查并交付结果。",
        ),
      ),
    ];
  if (type === "agent")
    base.files = [
      file(
        "AGENT.md",
        "---\nname: example-agent\ndescription: 根据材料完成审阅\n---\n\n## 行为指引\n核对事实，列出证据和待确认项。\n",
      ),
    ];
  if (type === "mcp") {
    base.metadata.mcp = {
      serverName: "example-service",
      transport: "streamable-http",
      url: "https://example.invalid/mcp",
      authType: "none",
    };
    base.files = [file("mcp.json", JSON.stringify(base.metadata.mcp, null, 2))];
  }
  if (type === "workflow")
    base.files = [
      file(
        "workflow.json",
        JSON.stringify(
          {
            name: base.name,
            description: base.description,
            inputs: "提供任务材料",
            tags: [],
            members: [
              {
                name: "worker",
                summary: "处理任务",
                role: "负责执行",
                executionPrompt: "检查材料并交付结果",
                gallerySkill: false,
                galleryMcp: false,
              },
            ],
            tasks: [
              {
                id: "work",
                subject: "处理材料",
                assignee: "worker",
                dependencies: [],
                checkpoint: false,
                general: {
                  requirements: "根据材料执行任务",
                  deliverables: "结果与证据",
                  acceptance: "结果可由材料核对",
                },
              },
            ],
            positions: {},
          },
          null,
          2,
        ),
      ),
    ];
  return base;
}

/** Conversation tools. Member Skill/MCP switches grant use, not management. */
export class GalleryResourceAuthoring {
  constructor({ store, allowed = () => true, changed = async () => {} }) {
    Object.assign(this, { store, allowed, changed });
  }
  check(exec = {}) {
    demand(
      exec.agent && typeof exec.agent === "object",
      403,
      "AGENT_REQUIRED",
      "资源管理需要当前 DSH Agent 作用域",
    );
    exec.signal?.throwIfAborted();
    demand(
      this.allowed(exec.agent),
      403,
      "GALLERY_MANAGEMENT_DENIED",
      "此成员只有资源使用权限，请在主会话管理 Gallery 资源",
    );
  }
  target(libraryId) {
    demand(
      ["local", "center"].includes(libraryId),
      400,
      "LIBRARY_REQUIRED",
      "请明确指定 libraryId：local 或 center，可先调用 gallery_resource_schema",
    );
    const library = this.store.library(libraryId);
    return this.store.adapter(library.id);
  }
  schema({ type }, exec) {
    this.check(exec);
    return {
      libraryId: this.store.read().activeLibraryId,
      resource: resourceExample(type),
      limits: { files: 100, fileBytes: 5 * 1024 * 1024 },
      instructions: [
        "修改示例后传 resource 对象，不要传 JSON 字符串。",
        "Skill / Agent 以 Markdown 为正文来源；附件与向导一致，保存不会执行附件。",
        "MCP 使用 metadata.mcp，密钥只能写入 resource.mcpCredentials，校验结果不回显，创建时需从原输入带上；stdio 可执行命令，保存会刷新连接。",
        "Workflow 可保存草稿；保存不等于注册或运行 TeamFlow。",
        "先 validate，再 create；update 是完整替换可编辑内容，先 get 并保留未修改字段，携带 libraryId 和 expectedRevision。",
        "保存成功以返回 saved:true 和资源 id 为准；网络中断后先查询核对，不自动重放 create。",
      ],
    };
  }
  async list({ libraryId, ...query }, exec) {
    this.check(exec);
    const adapter = this.target(libraryId);
    const result = await adapter.listResources(query);
    return {
      ...result,
      libraryId,
      items: result.items.map((row) => ({ ...row, libraryId })),
    };
  }
  async get({ id, libraryId }, exec) {
    this.check(exec);
    const row = await this.target(libraryId).getResource(id);
    return {
      id: row.id,
      libraryId,
      revision: row.revision,
      digest: row.digest,
      canEdit: row.canEdit,
      canDelete: row.canDelete,
      ...(row.creator ? { creator: row.creator } : {}),
      ...(row.mcpCredentialKeys
        ? { mcpCredentialKeys: row.mcpCredentialKeys }
        : {}),
      resource: editable(row),
    };
  }
  async prepare(input, adapter, previous) {
    let resource = normalizeResource(input),
      warnings = [];
    if (resource.type === "skill") {
      demand(
        resource.files.some((f) => f.path === "SKILL.md"),
        400,
        "INVALID_SKILL",
        "缺少 SKILL.md；调用 gallery_resource_schema 获取格式",
      );
      const parsed = readSkill(resource);
      const issues = [
        ...(parsed.error ? [parsed.error] : []),
        ...skillIssues(
          parsed.name,
          parsed.description,
          parsed.body,
          parsed.files,
        ),
      ];
      for (const key of ["user-invocable", "disable-model-invocation"])
        if (
          parsed.frontmatter[key] !== undefined &&
          typeof parsed.frontmatter[key] !== "boolean"
        )
          issues.push(`${key} 必须是布尔值`);
      demand(!issues.length, 400, "INVALID_SKILL", issues.join("；"));
      resource.files = [
        file(
          "SKILL.md",
          skillDocument(
            parsed.name,
            parsed.description,
            syncSkillAttachments(parsed.body, parsed.files),
            parsed.frontmatter,
          ),
        ),
        ...parsed.files,
      ];
      resource.description = parsed.description;
    }
    if (resource.type === "agent") {
      demand(
        resource.files.some((f) => f.path === "AGENT.md"),
        400,
        "INVALID_AGENT",
        "缺少 AGENT.md；调用 gallery_resource_schema 获取格式",
      );
      let imported;
      try {
        imported = importResourceFiles("agent", resource.files, resource.name);
      } catch (error) {
        demand(false, 400, "INVALID_AGENT", error.message);
      }
      const agent = imported.resource.metadata.agent;
      const attachments = imported.resource.files.filter(
        (f) => !["AGENT.md", "config.json"].includes(f.path),
      );
      const issues = agentIssues({
        ...agent,
        name: resource.name,
        files: attachments,
        tags: resource.tags,
      });
      demand(!issues.length, 400, "INVALID_AGENT", issues.join("；"));
      demand(
        !imported.warnings.some((w) => w.startsWith("未导入：")),
        400,
        "INVALID_FILES",
        "Agent 附件只支持 references/、assets/ 和 config.json",
      );
      warnings = imported.warnings;
      resource = {
        ...resource,
        description: agent.description,
        metadata: { ...resource.metadata, agent },
        files: imported.resource.files,
      };
    }
    if (resource.type === "mcp") {
      const config = validateMcpConfig(resource.metadata.mcp);
      demand(
        !Object.keys(config.envRefs).length,
        400,
        "INVALID_MCP_CREDENTIALS",
        "请使用 credentialKeys 和 mcpCredentials 填写认证，不使用宿主环境变量引用",
      );
      const duplicate = (await adapter.read("mcp")).resources.some(
        (row) =>
          row.type === "mcp" &&
          row.id !== previous?.id &&
          row.metadata?.mcp?.serverName === config.serverName,
      );
      demand(
        !duplicate,
        409,
        "DUPLICATE_MCP_NAME",
        "服务器名称已被其他 MCP 资源使用",
      );
      mergeMcpCredentials(
        config,
        input.mcpCredentials,
        Object.fromEntries(
          (previous?.mcpCredentialKeys || []).map((key) => [
            key,
            "stored-value",
          ]),
        ),
      );
      resource.metadata = { ...resource.metadata, mcp: config };
      resource.files = [
        file("mcp.json", JSON.stringify(config, null, 2) + "\n"),
        ...resource.files.filter((f) => f.path !== "mcp.json"),
      ];
    }
    if (resource.type === "workflow") {
      const definition = workflowFromResource(resource, { draft: true });
      warnings = workflowTemplateIssues(definition);
      resource.metadata = {
        ...resource.metadata,
        format: "dsh-teamflow-template-v1",
        workflowCanvas: {
          ...resource.metadata.workflowCanvas,
          draft: warnings.length > 0,
        },
      };
      resource.files = resource.files.map((f) =>
        f.path === "workflow.json"
          ? file(f.path, JSON.stringify(definition, null, 2) + "\n")
          : f,
      );
    }
    resource = editable(resource);
    return { resource, warnings };
  }
  async previous(adapter, id, expectedRevision, resource) {
    revision(expectedRevision);
    const previous = await adapter.getResource(id);
    demand(
      previous.canEdit === true,
      403,
      "FORBIDDEN",
      "只能修改或删除自己创建的资源",
    );
    demand(
      previous.revision === expectedRevision,
      409,
      "CONFLICT",
      "资源已更新，请重新读取后再操作",
    );
    demand(
      !resource || previous.type === resource.type,
      400,
      "TYPE_IMMUTABLE",
      "资源创建后不可更改类型",
    );
    return previous;
  }
  async validate({ resource, libraryId, id, expectedRevision }, exec) {
    this.check(exec);
    const adapter = this.target(libraryId);
    try {
      const previous = id
        ? await this.previous(adapter, id, expectedRevision, resource)
        : undefined;
      const result = await this.prepare(resource, adapter, previous);
      return { valid: true, libraryId, ...result };
    } catch (error) {
      if (!error.status || error.status >= 500) throw error;
      return {
        valid: false,
        libraryId,
        issues: [{ code: error.code, message: error.message }],
      };
    }
  }
  async notify(type, libraryId) {
    try {
      await this.changed(type, libraryId);
      return [];
    } catch {
      return [
        "资源变更已完成，但运行时刷新失败；请重新打开 Gallery 或重启 DSH 后再调用。",
      ];
    }
  }
  async create({ resource: input, libraryId }, exec) {
    this.check(exec);
    const adapter = this.target(libraryId),
      { resource, warnings } = await this.prepare(input, adapter);
    this.check(exec);
    const saved = await adapter.createResource(
      {
        ...resource,
        ...(resource.type === "mcp" && input.mcpCredentials !== undefined
          ? { mcpCredentials: input.mcpCredentials }
          : {}),
      },
      { username: this.store.username() },
    );
    return {
      saved: true,
      id: saved.id,
      type: saved.type,
      name: saved.name,
      libraryId,
      revision: saved.revision,
      digest: saved.digest,
      warnings: [...warnings, ...(await this.notify(resource.type, libraryId))],
    };
  }
  async update({ id, resource: input, libraryId, expectedRevision }, exec) {
    this.check(exec);
    const adapter = this.target(libraryId),
      previous = await this.previous(adapter, id, expectedRevision, input);
    const { resource, warnings } = await this.prepare(input, adapter, previous);
    this.check(exec);
    const saved = await adapter.updateResource(
      id,
      {
        ...resource,
        ...(resource.type === "mcp" && input.mcpCredentials !== undefined
          ? { mcpCredentials: input.mcpCredentials }
          : {}),
      },
      expectedRevision,
    );
    return {
      saved: true,
      id: saved.id,
      type: saved.type,
      name: saved.name,
      libraryId,
      revision: saved.revision,
      digest: saved.digest,
      warnings: [...warnings, ...(await this.notify(resource.type, libraryId))],
    };
  }
  async delete({ id, libraryId, expectedRevision }, exec) {
    this.check(exec);
    const adapter = this.target(libraryId),
      previous = await this.previous(adapter, id, expectedRevision);
    this.check(exec);
    await adapter.deleteResource(id, expectedRevision);
    return {
      deleted: true,
      id,
      libraryId,
      warnings: await this.notify(previous.type, libraryId),
    };
  }
}
