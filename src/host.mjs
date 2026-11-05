import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join } from "node:path";
import { homedir } from "node:os";
import { StorageManager } from "./storage-manager.mjs";
import { demand } from "./model.mjs";
import { validateMcpConfig } from "./mcp-config.mjs";
import { checkMcpConnection } from "./mcp-check.mjs";
import { GalleryMcpRuntime } from "./mcp-runtime.mjs";
import { registerGalleryAgentListTool, registerGalleryAgentRunTool } from "./agent-runtime.mjs";
import { workflowFromResource } from "./workflow-template.mjs";
import { publishToTeamflow } from "./teamflow-publish.mjs";
import { createSkillProvider } from "./skill-provider.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx) {
    super(ctx, "gallery");
    this.store = new StorageManager(
      join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "gallery"),
    );
    this.skillProvider = createSkillProvider(this.store);
    this.invalidateSkills = () => {};
    this.mcpRuntime = null;
    ctx.inject(["skills"], (scope) => {
      scope.effect(() =>
        scope.skills.registerProvider((control) => {
          this.invalidateSkills = control.invalidate;
          return this.skillProvider;
        }),
      );
    });
    ctx.inject(["tools"], (scope) => {
      const runtime = new GalleryMcpRuntime(scope, this.store);
      this.mcpRuntime = runtime;
      scope.effect(() => registerGalleryAgentListTool(scope, this.store));
      scope.effect(() => {
        void runtime.refresh();
        return async () => {
          if (this.mcpRuntime === runtime) this.mcpRuntime = null;
          await runtime.dispose();
        };
      });
    });
    ctx.inject(["tools", "subagents"], (scope) => {
      scope.effect(() => registerGalleryAgentRunTool(scope, this.store));
    });
    ctx.effect(() =>
      ctx.get("typert").register({
        package: "dsh-plugin-gallery",
        face: "host",
        schemas: [],
        model: { services: [], events: [], objects: [] },
        invocations: DESCRIPTORS,
      }),
    );
  }
  async listResources(query) {
    return this.store.listResources(query);
  }
  async getResource(id, options) {
    return this.store.getResource(id, options?.libraryId);
  }
  async resolveReference(ref) {
    return this.store.resolveReference(ref);
  }
  // Host consumer reports actual activation; never called from read or UI paths.
  async recordSkillUse(input) {
    return this.store.recordSkillUse(input);
  }
  async getSnapshot(ref) {
    return this.store.getSnapshot(ref);
  }
  async ownerCall(fn) {
    if (this.ctx.invocation?.peer?.principal?.kind !== "owner")
      throw new RemoteError(
        "gallery/forbidden",
        "Gallery UI requires the authenticated Host owner",
        {},
      );
    try {
      return await fn();
    } catch (e) {
      throw new RemoteError("gallery/error", e.message, {
        code: e.code ?? "GALLERY_ERROR",
        status: e.status ?? 500,
      });
    }
  }
  uiStatus() {
    return this.ownerCall(() => {
      this.store.adapter().read();
      return { ready: true, mode: "local", storage: this.store.settings() };
    });
  }
  uiList(payload) {
    return this.ownerCall(() => this.store.listResources(JSON.parse(payload)));
  }
  uiGet(id) {
    return this.ownerCall(() => this.store.getResource(id));
  }
  uiCreate(payload) {
    return this.ownerCall(async () => {
      const input = JSON.parse(payload);
      if (input.type === "mcp") this.validateMcpName(input);
      if (input.type === "workflow") workflowFromResource(input);
      const r = this.store.createResource(input);
      this.invalidateSkills();
      if (input.type === "mcp") await this.mcpRuntime?.refresh();
      return r;
    });
  }
  validateMcpName(resource, excludeId) {
    const config = validateMcpConfig(resource.metadata?.mcp);
    const duplicate = this.store
      .adapter()
      .read()
      .resources.some(
        (row) =>
          row.type === "mcp" &&
          row.id !== excludeId &&
          row.metadata?.mcp?.serverName === config.serverName,
      );
    demand(
      !duplicate,
      409,
      "DUPLICATE_MCP_NAME",
      "服务器名称已被其他 MCP 资源使用",
    );
  }
  uiCheckMcp(payload) {
    return this.ownerCall(() => checkMcpConnection(JSON.parse(payload)));
  }
  uiPublishWorkflow(id) {
    return this.ownerCall(async () => {
      const resource = this.store.getResource(id);
      demand(resource.type === "workflow", 400, "INVALID_TYPE", "仅 Workflow 可以安装到 TeamFlow");
      return publishToTeamflow(resource, process.env.DSH_TEAMFLOW_TEMPLATE_DIR);
    });
  }
  uiSkillCatalog() {
    return this.ownerCall(async () => {
      if (!this.ctx.get("skills"))
        throw new Error("DSH Skill 服务未启用，请使用支持 Skill 的预设。");
      const candidates = await this.skillProvider.list();
      return candidates
        .filter((c) => c.invocation.userInvocable)
        .map((c) => ({
          name: c.name,
          label: this.store.getResource(c.locator).name,
          description: c.description,
        }));
    });
  }
  uiUpdate(id, payload) {
    return this.ownerCall(async () => {
      const p = JSON.parse(payload);
      if (p.resource?.type === "mcp") this.validateMcpName(p.resource, id);
      if (p.resource?.type === "workflow") workflowFromResource(p.resource);
      const r = this.store.updateResource(id, p.resource, p.expectedRevision);
      this.invalidateSkills();
      if (r.type === "mcp") await this.mcpRuntime?.refresh();
      return r;
    });
  }
  uiDelete(id, payload) {
    return this.ownerCall(async () => {
      const before = this.store.getResource(id);
      const result = this.store.deleteResource(
        id,
        JSON.parse(payload).expectedRevision,
      );
      this.invalidateSkills();
      if (before.type === "mcp") await this.mcpRuntime?.refresh();
      return result;
    });
  }
  uiSetUsername(payload) {
    return this.ownerCall(() =>
      this.store.setUsername(JSON.parse(payload).username),
    );
  }
  uiStorageSettings() {
    return this.ownerCall(() => this.store.settings());
  }
  uiTestStorage(payload) {
    return this.ownerCall(() => this.store.testConnection(JSON.parse(payload)));
  }
  uiConfigureStorage() {
    return this.ownerCall(() => this.store.configure());
  }
}
