import { browseServerDirectory, importResource } from "./resource-import.mjs";
import { registerMemberMcpGuidance } from "./member-mcp-guidance.mjs";
import { extractWorkflowAgent } from "./workflow-extraction.mjs";
import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join } from "node:path";
import { homedir } from "node:os";
import { StorageManager } from "./storage-manager.mjs";
import { demand } from "./model.mjs";
import { validateMcpConfig, mergeMcpCredentials } from "./mcp-config.mjs";
import { checkMcpConnection } from "./mcp-check.mjs";
import { GalleryMcpRuntime } from "./mcp-runtime.mjs";
import {
  registerGalleryAgentListTool,
  registerGalleryAgentRunTool,
} from "./agent-runtime.mjs";
import { GalleryResourceAuthoring } from "./resource-authoring.mjs";
import { registerResourceTools, MANAGEMENT_TOOLS } from "./resource-tools.mjs";
import { workflowSharingStatus, uploadWorkflowTemplate } from "./workflow-sharing.mjs";
import { workflowFromResource } from "./workflow-template.mjs";
import { syncWorkflowUsage } from "./workflow-usage.mjs";
import { publishToTeamflow } from "./teamflow-publish.mjs";
import { createSkillProvider } from "./skill-provider.mjs";
import { registerUsageTracking } from "./usage-runtime.mjs";
import { registerRuntimeDiagnostics } from "./runtime-diagnostics.mjs";
import { installReferenceExamples } from "./builtin-examples.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";
import {
  GalleryResourceDiscovery,
  registerDiscoveryTools,
  DISCOVERY_TOOLS,
  DISCOVERY_GUIDANCE,
} from "./resource-discovery.mjs";

const mcpResourceTools = new Set([
  "list_mcp_resources",
  "list_mcp_resource_templates",
  "read_mcp_resource",
]);

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx) {
    super(ctx, "gallery");
    this.store = new StorageManager(
      join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "gallery"),
    );
    installReferenceExamples(this.store.adapter("local"));
    this.memberAccess = new WeakMap();
    this.memberAccessDisposers = new WeakMap();
    this.memberToolUpdates = new WeakMap();
    this.mcpDispatches = new WeakMap();
    this.skillProvider = createSkillProvider(
      this.store,
      (scope) => this.memberAccess.get(scope)?.gallerySkill !== false,
      (scope) => this.memberAccess.get(scope)?.resourceMode !== "discovery",
    );
    this.discovery = new GalleryResourceDiscovery({
      ctx,
      store: this.store,
      provider: this.skillProvider,
      allowed: (agent, type) =>
        this.memberAccess.get(agent)?.[
          type === "skill" ? "gallerySkill" : "galleryMcp"
        ] !== false,
      getRuntime: () => this.mcpRuntime,
      dispatchMcp: (name, args, exec) => this.dispatchMcp(name, args, exec),
    });
    this.authoring = new GalleryResourceAuthoring({
      store: this.store,
      allowed: (agent) => !this.memberAccess.has(agent),
      changed: async (type, libraryId) => {
        if (this.store.read().activeLibraryId !== libraryId) return;
        this.invalidateSkills();
        if (type === "mcp") await this.mcpRuntime?.refresh();
      },
    });
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
    registerUsageTracking(ctx, this.store, () => this.mcpRuntime);
    registerRuntimeDiagnostics(ctx);
    ctx.inject(["tools"], (scope) => {
      const runtime = new GalleryMcpRuntime(scope, this.store);
      this.mcpRuntime = runtime;
      scope.effect(() =>
        scope.tools.guard((exec) => this.resourceCallDenial(exec)),
      );
      scope.effect(() => registerDiscoveryTools(scope, this.discovery));
      scope.effect(() => registerResourceTools(scope, this.authoring));
      scope.effect(() => registerGalleryAgentListTool(scope, this.store));
      scope.effect(() => {
        void runtime
          .refresh()
          .catch((error) =>
            this.ctx.logger?.warn?.(
              `Gallery MCP refresh failed: ${error.message}`,
            ),
          );
        const timer = setInterval(() => {
          try {
            if (this.store.read().activeLibraryId !== "center") return;
            this.invalidateSkills();
            void runtime
              .refresh()
              .catch((error) =>
                this.ctx.logger?.warn?.(
                  `Gallery center refresh failed: ${error.message}`,
                ),
              );
          } catch (error) {
            this.ctx.logger?.warn?.(
              `Gallery storage configuration error: ${error.message}`,
            );
          }
        }, 30000);
        timer.unref?.();
        return async () => {
          clearInterval(timer);
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
  resourceCallDenial(exec) {
    const { agent, name, arguments: args } = exec;
    const access = this.memberAccess.get(agent);
    const runtime = this.mcpRuntime;
    if (access && MANAGEMENT_TOOLS.includes(name))
      return "此成员只有资源使用权限，请在主会话管理 Gallery 资源";
    if (access?.gallerySkill === false && DISCOVERY_TOOLS.skill.includes(name))
      return "此 TeamFlow 成员未启用 Gallery Skill";
    if (
      access?.galleryMcp === false &&
      (DISCOVERY_TOOLS.mcp.includes(name) ||
        runtime?.ownsTool(name) ||
        (mcpResourceTools.has(name) && runtime?.ownsServer(args?.server)))
    )
      return "此 TeamFlow 成员未启用 Gallery MCP";
    if (
      access?.resourceMode === "discovery" &&
      runtime?.ownsTool(name) &&
      !this.mcpDispatches
        .get(agent)
        ?.some(
          (permit) => permit.name === name && permit.parent === exec.parent,
        )
    )
      return "请通过 gallery_mcp_search、gallery_mcp_tools 和 gallery_mcp_call 按需调用";
  }
  workflowSharingStatus() { return workflowSharingStatus(this.store); }
  uploadWorkflowTemplate(definition, source) { return uploadWorkflowTemplate(this.store, definition, source); }
  resourceCapabilities() {
    return {
      version: 1,
      mode: "discovery",
      tools: Object.values(DISCOVERY_TOOLS).flat(),
      defaultPageSize: 5,
      maxSearchPageSize: 20,
      maxToolPageSize: 10,
    };
  }
  searchSkills(query, exec) {
    return this.discovery.searchSkills(query, exec);
  }
  loadSkill(input, exec) {
    return this.discovery.loadSkill(input, exec);
  }
  searchMcp(query, exec) {
    return this.discovery.searchMcp(query, exec);
  }
  getMcpTools(input, exec) {
    return this.discovery.mcpTools(input, exec);
  }
  callMcpTool(input, exec) {
    return this.discovery.callMcp(input, exec);
  }
  /** Nested execution keeps the original caller scope, policies and cancellation. */
  async dispatchMcp(name, args, exec) {
    demand(
      exec.agent && exec.token && exec.signal && exec.callId,
      400,
      "EXECUTION_REQUIRED",
      "MCP 调用必须来自 DSH 工具执行上下文",
    );
    const permits = this.mcpDispatches.get(exec.agent) || [];
    const permit = { name, parent: exec.token };
    permits.push(permit);
    this.mcpDispatches.set(exec.agent, permits);
    try {
      this.memberToolUpdates.get(exec.agent)?.();
      const tools = exec.agent.ctx.get("tools");
      const result = await tools.execute({
        name,
        arguments: args,
        agent: exec.agent,
        signal: exec.signal,
        callId: `${exec.callId}:gallery-mcp`,
        rootCallId: exec.rootCallId || exec.callId,
        parent: exec.token,
      });
      if (result.isError)
        throw Object.assign(new Error(result.error.message), {
          code: result.error.info?.code || "MCP_CALL_FAILED",
        });
      for (const context of result.additionalContexts || [])
        exec.deferContext(context);
      if (result.concludesTurn) exec.concludeTurn();
      return { tool: name, value: result.value, content: result.content };
    } finally {
      permits.splice(permits.indexOf(permit), 1);
      this.memberToolUpdates.get(exec.agent)?.();
    }
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
  /** Same-process integration for TeamFlow child activation. */
  setMemberAccess(agent, access) {
    demand(
      agent &&
        typeof agent === "object" &&
        access &&
        typeof access === "object",
      400,
      "INVALID_MEMBER_ACCESS",
      "需要有效的成员与访问配置",
    );
    demand(
      access.resourceMode === undefined ||
        access.resourceMode === "discovery" ||
        access.resourceMode === "native",
      400,
      "INVALID_RESOURCE_MODE",
      "资源访问模式仅支持 discovery 或 native",
    );
    demand(
      [access.gallerySkill, access.galleryMcp].every(
        (value) => value === undefined || typeof value === "boolean",
      ),
      400,
      "INVALID_MEMBER_ACCESS",
      "Gallery 访问开关必须为布尔值",
    );
    this.memberAccessDisposers.get(agent)?.();
    const token = { ...access };
    this.memberAccess.set(agent, token);
    this.invalidateSkills();
    let stopListener,
      stopFilter,
      stopPrompt,
      stopAssembly,
      signature = "";
    let disposed = false;
    const update = () => {
      if (disposed) return;
      const tools = agent.ctx.get("tools");
      const deny =
        tools
          ?.schemas()
          .map((tool) => tool.name)
          .filter(
            (name) =>
              MANAGEMENT_TOOLS.includes(name) ||
              (this.mcpRuntime?.ownsTool(name) &&
                (token.galleryMcp === false ||
                  token.resourceMode === "discovery") &&
                !this.mcpDispatches
                  .get(agent)
                  ?.some((permit) => permit.name === name)) ||
              (token.gallerySkill === false &&
                DISCOVERY_TOOLS.skill.includes(name)) ||
              (token.galleryMcp === false &&
                DISCOVERY_TOOLS.mcp.includes(name)),
          )
          .sort() ?? [];
      const next = deny.join("\n");
      if (next === signature) return;
      const previous = stopFilter;
      stopFilter = deny.length ? tools.restrict({ deny }) : undefined;
      signature = next;
      previous?.();
    };
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      stopListener?.();
      stopFilter?.();
      stopPrompt?.();
      stopAssembly?.();
      if (this.memberAccess.get(agent) !== token) return;
      this.memberAccess.delete(agent);
      if (this.memberToolUpdates.get(agent) === update)
        this.memberToolUpdates.delete(agent);
      if (this.memberAccessDisposers.get(agent) === cleanup)
        this.memberAccessDisposers.delete(agent);
      this.invalidateSkills();
    };
    try {
      if (access.resourceMode === "discovery") {
        const prompt = agent.ctx.get("systemPrompt");
        stopPrompt = prompt?.section({
          name: `gallery.discovery.${agent.id}`,
          order: 118,
          interpolate: false,
          text: () =>
            this.memberAccess.get(agent) === token
              ? DISCOVERY_GUIDANCE +
                `\nSkill: ${token.gallerySkill === false ? "禁止" : "允许"}；MCP: ${token.galleryMcp === false ? "禁止" : "允许"}。`
              : "",
        });
      } else if (access.galleryMcp === true) {
        stopPrompt = registerMemberMcpGuidance(
          agent,
          this.store,
          () => this.mcpRuntime,
          () =>
            this.memberAccess.get(agent) === token && token.galleryMcp === true,
        );
      }
      this.memberToolUpdates.set(agent, update);
      this.memberAccessDisposers.set(agent, cleanup);
      if (
        access.galleryMcp === false ||
        access.gallerySkill === false ||
        access.resourceMode === "discovery"
      ) {
        // Official MCP clients can also contribute server instructions. These
        // must not reintroduce a full catalog through a different prompt path.
        if (
          access.galleryMcp === false ||
          access.resourceMode === "discovery"
        ) {
          stopAssembly = agent.ctx.on(
            "system-prompt/assemble",
            async (_assembly, _context, next) => {
              const assembly = await next();
              return {
                ...assembly,
                sections: assembly.sections.filter(
                  (section) =>
                    !(
                      section.name.startsWith("mcp:") &&
                      this.mcpRuntime?.ownsServer(section.name.slice(4))
                    ),
                ),
              };
            },
          );
        }
        update();
        stopListener = agent.ctx.on("tools/change", () =>
          queueMicrotask(() => {
            try {
              update();
            } catch (error) {
              this.ctx.logger?.warn?.(
                `Gallery MCP visibility update failed: ${error.message}`,
              );
            }
          }),
        );
      }
      return cleanup;
    } catch (error) {
      cleanup();
      throw error;
    }
  }
  uiStatus() {
    return this.ownerCall(() => {
      if (this.store.read().activeLibraryId === "local")
        this.store.adapter().read();
      return {
        ready: true,
        mode: this.store.read().activeLibraryId,
        storage: this.store.settings(),
      };
    });
  }
  uiList(payload) {
    return this.ownerCall(async () => {
      const query = JSON.parse(payload);
      if (!query.type || query.type === "workflow")
        await syncWorkflowUsage(this.ctx, this.store);
      return this.store.listResources(query);
    });
  }
  uiGet(id) {
    return this.ownerCall(async () => {
      const resource = await this.store.getResource(id);
      if (resource.type !== "workflow") return resource;
      await syncWorkflowUsage(this.ctx, this.store);
      return this.store.getResource(id);
    });
  }
  uiCreate(payload) {
    return this.ownerCall(async () => {
      const input = JSON.parse(payload);
      if (input.type === "mcp") await this.validateMcpName(input);
      if (input.type === "workflow") workflowFromResource(input, { draft: true });
      const r = await this.store.createResource(input);
      this.invalidateSkills();
      if (input.type === "mcp") await this.mcpRuntime?.refresh();
      return r;
    });
  }
  async validateMcpName(resource, excludeId) {
    const config = validateMcpConfig(resource.metadata?.mcp);
    const duplicate = (await this.store.adapter().read("mcp")).resources.some(
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
    return this.ownerCall(async () => {
      const { resourceId, credentials, ...config } = JSON.parse(payload);
      const row = resourceId
        ? (await this.store.adapter().read("mcp")).resources.find(
            (r) => r.id === resourceId && r.type === "mcp",
          )
        : undefined;
      demand(!resourceId || row, 404, "NOT_FOUND", "MCP 资源不存在");
      return checkMcpConnection(
        config,
        mergeMcpCredentials(config, credentials, row?.privateMcpCredentials),
      );
    });
  }
  uiExtractWorkflowAgent(payload) {
    return this.ownerCall(async () => {
      const { resourceId } = JSON.parse(payload);
      return extractWorkflowAgent(
        this.ctx,
        await this.store.getResource(resourceId),
      );
    });
  }
  uiPublishWorkflow(id) {
    return this.ownerCall(async () => {
      const resource = await this.store.getResource(id);
      demand(
        resource.type === "workflow",
        400,
        "INVALID_TYPE",
        "仅 Workflow 可以安装到 TeamFlow",
      );
      return publishToTeamflow(resource, process.env.DSH_TEAMFLOW_TEMPLATE_DIR);
    });
  }
  uiImportDirectory(payload) {
    return this.ownerCall(() => browseServerDirectory(JSON.parse(payload)));
  }
  uiImportResource(payload) {
    return this.ownerCall(() => importResource(JSON.parse(payload)));
  }
  uiSkillCatalog() {
    return this.ownerCall(async () => {
      if (!this.ctx.get("skills"))
        throw new Error("DSH Skill 服务未启用，请使用支持 Skill 的预设。");
      const candidates = await this.skillProvider.list();
      return Promise.all(
        candidates
          .filter((c) => c.invocation.userInvocable)
          .map(async (c) => ({
            name: c.name,
            label: (await this.store.getResource(c.locator)).name,
            description: c.description,
          })),
      );
    });
  }
  uiUpdate(id, payload) {
    return this.ownerCall(async () => {
      const p = JSON.parse(payload);
      if (p.resource?.type === "mcp")
        await this.validateMcpName(p.resource, id);
      if (p.resource?.type === "workflow") workflowFromResource(p.resource, { draft: true });
      const r = await this.store.updateResource(
        id,
        p.resource,
        p.expectedRevision,
      );
      this.invalidateSkills();
      if (r.type === "mcp") await this.mcpRuntime?.refresh();
      return r;
    });
  }
  uiDelete(id, payload) {
    return this.ownerCall(async () => {
      const before = await this.store.getResource(id);
      const result = await this.store.deleteResource(
        id,
        JSON.parse(payload).expectedRevision,
      );
      this.invalidateSkills();
      if (before.type === "mcp")
        await this.mcpRuntime
          ?.refresh()
          .catch((error) =>
            this.ctx.logger?.warn?.(
              `Gallery MCP refresh failed: ${error.message}`,
            ),
          );
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
  uiConfigureStorage(payload = "{}") {
    return this.ownerCall(async () => {
      const before = this.store.read();
      const result = await this.store.configure(JSON.parse(payload));
      if (
        before.activeLibraryId !== result.activeLibraryId ||
        before.service?.url !== result.service?.url
      ) {
        await this.mcpRuntime?.dispose();
      }
      this.invalidateSkills();
      await this.mcpRuntime
        ?.refresh()
        .catch((error) =>
          this.ctx.logger?.warn?.(
            `Gallery MCP refresh failed: ${error.message}`,
          ),
        );
      return result;
    });
  }
}
