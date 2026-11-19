import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import SystemPrompt from "@deepseek-ai/dsh-system-prompt";
import { GalleryMcpRuntime } from "../src/mcp-runtime.mjs";
import { Context } from "@deepseek-ai/cordis";
import { createScope } from "@deepseek-ai/dsh-scope";
import { ToolRuntime, defineTool } from "@deepseek-ai/dsh-tools";
import GalleryService from "../src/host.mjs";
import { StorageManager } from "../src/storage-manager.mjs";
import { createSkillProvider } from "../src/skill-provider.mjs";
import {
  GalleryResourceDiscovery,
  registerDiscoveryTools,
} from "../src/resource-discovery.mjs";
import { registerUsageTracking } from "../src/usage-runtime.mjs";

const skill = {
  type: "skill",
  name: "Review",
  description: "Review code",
  tags: ["code"],
  files: [
    {
      path: "SKILL.md",
      content:
        "---\nname: review\ndescription: Review code\n---\n\n# Review\nRead references/check.md when necessary.",
    },
    {
      path: "references/check.md",
      content: "Do not load this attachment automatically.",
    },
  ],
};
function setup(t, realPrompt = false) {
  const root = mkdtempSync(join(tmpdir(), "gallery-discovery-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const ctx = new Context();
  const sections = [];
  if (realPrompt) new SystemPrompt(ctx, { includeHarnessIdentity: false });
  else
    ctx.provide("systemPrompt", {
      tools() {},
      section(section) {
        sections.push(section);
        return () => sections.splice(sections.indexOf(section), 1);
      },
    });
  new ToolRuntime(ctx);
  const store = new StorageManager(root);
  const service = Object.create(GalleryService.prototype);
  Object.assign(service, {
    ctx,
    store,
    memberAccess: new WeakMap(),
    memberAccessDisposers: new WeakMap(),
    memberToolUpdates: new WeakMap(),
    mcpDispatches: new WeakMap(),
    invalidateSkills() {},
  });
  service.skillProvider = createSkillProvider(
    store,
    (scope) => service.memberAccess.get(scope)?.gallerySkill !== false,
    (scope) => service.memberAccess.get(scope)?.resourceMode !== "discovery",
  );
  const toolIds = new Map();
  service.mcpRuntime = {
    active: new Map(),
    resourceForTool: (name) => toolIds.get(name),
    ownsTool: (name) => toolIds.has(name),
    ownsServer: (name) => name === "papers",
  };
  service.discovery = new GalleryResourceDiscovery({
    ctx,
    store,
    provider: service.skillProvider,
    allowed: (agent, type) =>
      service.memberAccess.get(agent)?.[
        type === "skill" ? "gallerySkill" : "galleryMcp"
      ] !== false,
    getRuntime: () => service.mcpRuntime,
    dispatchMcp: (name, args, exec) => service.dispatchMcp(name, args, exec),
  });
  const offTools = registerDiscoveryTools(ctx, service.discovery);
  const offGuard = ctx.tools.guard((exec) => service.resourceCallDenial(exec));
  t.after(offTools);
  t.after(offGuard);
  registerUsageTracking(ctx, store, () => service.mcpRuntime);
  const makeAgent = (id) => {
    const agent = { id };
    const scope = createScope(ctx, agent);
    agent.ctx = scope.ctx;
    t.after(async () => {
      service.memberAccessDisposers.get(agent)?.();
      await scope.dispose();
    });
    return agent;
  };
  const call = (
    agent,
    name,
    args,
    callId = "call",
    signal = new AbortController().signal,
  ) => ctx.tools.execute({ agent, name, arguments: args, callId, signal });
  return { ctx, store, service, sections, makeAgent, call, toolIds };
}

test("1,000 Skills: bounded summaries, one load, no automatic attachments and stable usage", async (t) => {
  const { store, service, ctx, makeAgent, call } = setup(t);
  const first = store.createResource(skill);
  store.adapter().write((rows) => {
    for (let i = 1; i < 1000; i++)
      rows.push({
        ...structuredClone(rows[0]),
        id: "skill-" + i,
        name: "Review " + i,
      });
    return rows[0];
  });
  const agent = makeAgent("researcher");
  service.setMemberAccess(agent, {
    gallerySkill: true,
    galleryMcp: true,
    resourceMode: "discovery",
  });
  const result = await call(agent, "gallery_skill_search", {});
  assert.equal(result.isError, false, JSON.stringify(result));
  assert.equal(result.value.items.length, 5);
  assert.equal(result.value.total, 1000);
  assert.equal(result.value.hasMore, true);
  assert.ok(JSON.stringify(result.value).length < 4000);
  assert.ok(!JSON.stringify(result.value).includes("SKILL.md"));
  assert.equal((await store.getResource(first.id)).usageCount, 0);
  assert.deepEqual(await service.skillProvider.list({ scope: agent }), []);
  const next = await service.searchSkills(
    { q: "Review", limit: 5, offset: 5 },
    { agent },
  );
  assert.equal(next.items.length, 5);
  assert.ok(
    !result.value.items.some((a) => next.items.some((b) => a.id === b.id)),
  );
  const loaded = await call(
    agent,
    "gallery_skill_load",
    { id: first.id },
    "load-one",
  );
  assert.equal(loaded.isError, false, JSON.stringify(loaded));
  assert.match(loaded.value.content, /# Review/);
  assert.ok(
    !loaded.value.content.includes("Do not load this attachment automatically"),
  );
  assert.equal(
    readFileSync(
      join(loaded.value.resourceBase.path, "references/check.md"),
      "utf8",
    ),
    "Do not load this attachment automatically.",
  );
  assert.equal(store.getResource(first.id).usageCount, 1);
  await call(agent, "gallery_skill_load", { id: first.id }, "load-one");
  assert.equal(
    store.getResource(first.id).usageCount,
    1,
    "same invocation retry is deduplicated",
  );
  assert.equal(ctx.tools.schemas(agent).length, 5);
  assert.equal(
    (await call(agent, "gallery_skill_search", { limit: 1000 })).isError,
    true,
  );
  assert.equal(
    (
      await call(
        agent,
        "gallery_skill_search",
        {},
        "cancelled",
        AbortSignal.abort(),
      )
    ).isError,
    true,
  );
});

test("MCP discovery proxies preserve native policies, output, scope and counting while hiding definitions", async (t) => {
  const { ctx, store, service, makeAgent, call, toolIds, sections } = setup(t);
  const mcp = store.createResource({
    type: "mcp",
    name: "Papers",
    description: "Research library",
    metadata: {
      mcp: {
        serverName: "papers",
        transport: "streamable-http",
        url: "https://example.com/mcp",
        credentialKeys: ["Authorization"],
      },
    },
    files: [],
    mcpCredentials: { Authorization: "Bearer must-not-leak" },
  });
  service.mcpRuntime.active.set(mcp.id, {});
  let executed = 0,
    nested;
  const offNative = ctx.tools.register(
    defineTool({
      name: "mcp__papers__search",
      description: "Search papers",
      parameters: { query: { type: "string", required: true } },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { answer: { type: "string", required: true } },
        },
        render: (_a, v) => [{ type: "text", text: v.answer }],
      },
      async execute(args, exec) {
        executed++;
        nested = exec;
        return { answer: "Found: " + args.query };
      },
    }),
  );
  t.after(offNative);
  toolIds.set("mcp__papers__search", mcp.id);
  for (let i = 0; i < 25; i++) {
    const name = `mcp__papers__extra_${i}`;
    toolIds.set(name, mcp.id);
    t.after(
      ctx.tools.register(
        defineTool({
          name,
          description: `Extra tool ${i}`,
          parameters: {},
          output: { schema: { type: "json" }, render: () => [] },
          execute: async () => null,
        }),
      ),
    );
  }
  const agent = makeAgent("reader"),
    other = makeAgent("other");
  const cleanup = service.setMemberAccess(agent, {
    gallerySkill: true,
    galleryMcp: true,
    resourceMode: "discovery",
  });
  assert.ok(!ctx.tools.schemas(agent).some((t) => t.name.startsWith("mcp__")));
  assert.ok(ctx.tools.schemas(other).some((t) => t.name.startsWith("mcp__")));
  assert.ok(sections[0].text().length < 2000);
  assert.ok(!sections[0].text().includes("Papers"));
  const search = await call(agent, "gallery_mcp_search", { q: "Papers" });
  assert.equal(search.isError, false, JSON.stringify(search));
  assert.equal(search.value.items.length, 1);
  assert.ok(!JSON.stringify(search.value).includes("must-not-leak"));
  const tools = await call(agent, "gallery_mcp_tools", { id: mcp.id });
  assert.equal(tools.isError, false, JSON.stringify(tools));
  assert.equal(tools.value.tools[0].parameters.properties.query.type, "string");
  assert.equal(tools.value.tools.length, 5);
  assert.equal(tools.value.total, 26);
  assert.equal(tools.value.hasMore, true);
  assert.equal(executed, 0);
  assert.equal(store.getResource(mcp.id).usageCount, 0);
  assert.equal(
    (await call(agent, "mcp__papers__search", { query: "x" })).isError,
    true,
  );
  const params = {
    id: mcp.id,
    tool: "mcp__papers__search",
    arguments: { query: "agents" },
  };
  const invoked = await call(agent, "gallery_mcp_call", params, "invoke");
  assert.equal(invoked.isError, false, JSON.stringify(invoked));
  assert.equal(invoked.content[0].text, "Found: agents");
  assert.equal(nested.agent, agent);
  assert.equal(nested.callId, "invoke:gallery-mcp");
  assert.equal(nested.rootCallId, "invoke");
  assert.ok(nested.parent);
  assert.equal(store.getResource(mcp.id).usageCount, 1);
  assert.ok(
    !ctx.tools.schemas(agent).some((t) => t.name.startsWith("mcp__")),
    "temporary visibility is restored",
  );
  const deny = ctx.tools.guard((exec) =>
    exec.name === "mcp__papers__search"
      ? "Host policy denies this tool"
      : undefined,
  );
  const rejected = await call(agent, "gallery_mcp_call", params, "denied");
  assert.equal(rejected.isError, true);
  assert.match(rejected.error.message, /Host policy/);
  assert.equal(executed, 1);
  assert.equal(store.getResource(mcp.id).usageCount, 1);
  deny();
  const offExternal = agent.ctx
    .get("tools")
    .restrict({ deny: ["mcp__papers__search"] });
  assert.equal(
    (await call(agent, "gallery_mcp_call", params, "restricted")).isError,
    true,
  );
  assert.equal(executed, 1);
  offExternal();
  assert.equal(
    (await call(agent, "gallery_mcp_call", { ...params, tool: "another_tool" }))
      .isError,
    true,
  );
  cleanup();
  assert.equal(sections.length, 0);
  assert.ok(ctx.tools.schemas(agent).some((t) => t.name.startsWith("mcp__")));
});

test("switches deny search/load/call, repeated access replaces old filters, stdio opt-in remains enforced", async (t) => {
  const { store, service, ctx, makeAgent, call } = setup(t);
  const row = store.createResource(skill);
  const command = store.createResource({
    type: "mcp",
    name: "Command",
    metadata: {
      mcp: {
        serverName: "command",
        transport: "stdio",
        command: "node",
        args: ["-v"],
      },
    },
    files: [],
  });
  const agent = makeAgent("blocked");
  const old = service.setMemberAccess(agent, {
    gallerySkill: false,
    galleryMcp: false,
    resourceMode: "discovery",
  });
  assert.deepEqual(ctx.tools.schemas(agent), []);
  await assert.rejects(service.searchSkills({}, { agent }), {
    code: "GALLERY_ACCESS_DENIED",
  });
  await assert.rejects(service.loadSkill({ id: row.id }, { agent }), {
    code: "GALLERY_ACCESS_DENIED",
  });
  await assert.rejects(service.searchMcp({}, { agent }), {
    code: "GALLERY_ACCESS_DENIED",
  });
  assert.equal(
    (await call(agent, "gallery_mcp_tools", { id: command.id })).isError,
    true,
  );
  service.setMemberAccess(agent, {
    gallerySkill: true,
    galleryMcp: true,
    resourceMode: "discovery",
  });
  old();
  assert.equal(ctx.tools.schemas(agent).length, 5);
  assert.equal((await call(agent, "gallery_skill_search", {})).isError, false);
  const read = store.read.bind(store);
  store.read = () => ({
    ...read(),
    activeLibraryId: "center",
    service: { allowStdio: false },
  });
  // getResource would use a remote adapter; this test isolates the stdio consent gate.
  const get = store.getResource.bind(store);
  store.getResource = (id) => (id === command.id ? command : get(id));
  await assert.rejects(service.getMcpTools({ id: command.id }, { agent }), {
    code: "STDIO_DISABLED",
  });
  await assert.rejects(
    service.discovery.callMcp({ id: command.id, tool: "anything" }, { agent }),
    { code: "STDIO_DISABLED" },
  );
  await assert.rejects(service.searchSkills({}, { agent: undefined }), {
    code: "AGENT_REQUIRED",
  });
});

test("official HTTP MCP: search/inspect/call with saved credentials and no inherited server prompt", async (t) => {
  const { ctx, store, service, makeAgent, call } = setup(t, true);
  let requests = 0;
  const server = createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }
    if (req.headers.authorization !== "Bearer saved-page-key") {
      res.writeHead(401);
      res.end();
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    const message = JSON.parse(body);
    if (message.id === undefined) {
      res.writeHead(202);
      res.end();
      return;
    }
    let result = {};
    if (message.method === "initialize")
      result = {
        protocolVersion: message.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: "papers", version: "1.0.0" },
        instructions: "SERVER-CATALOG-INSTRUCTIONS",
      };
    if (message.method === "tools/list")
      result = {
        tools: [
          {
            name: "search",
            description: "Search the internal paper library",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: { query: { type: "string" } },
              required: ["query"],
            },
          },
        ],
      };
    if (message.method === "tools/call") {
      requests++;
      result = {
        content: [
          {
            type: "text",
            text: "Internal papers: " + message.params.arguments.query,
          },
        ],
      };
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const row = store.createResource({
    type: "mcp",
    name: "Internal papers",
    description: "Company research library",
    files: [],
    metadata: {
      mcp: {
        serverName: "papers",
        transport: "streamable-http",
        url: `http://127.0.0.1:${server.address().port}/mcp`,
        credentialKeys: ["Authorization"],
      },
    },
    mcpCredentials: { Authorization: "Bearer saved-page-key" },
  });
  const runtime = new GalleryMcpRuntime(ctx, store);
  service.mcpRuntime = runtime;
  t.after(async () => {
    await runtime.dispose();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const agent = makeAgent("live-reader"),
    other = makeAgent("native-reader");
  service.setMemberAccess(agent, {
    gallerySkill: true,
    galleryMcp: true,
    resourceMode: "discovery",
  });
  await runtime.refresh();
  for (
    let attempt = 0;
    attempt < 100 &&
    !ctx.tools.schemas().some((t) => t.name === "mcp__papers__search");
    attempt++
  )
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(
    ctx.tools.schemas().some((t) => t.name === "mcp__papers__search"),
    "official MCP client registered its tool",
  );
  assert.ok(!ctx.tools.schemas(agent).some((t) => t.name.startsWith("mcp__")));
  const prompt = await ctx.systemPrompt.assemble({ scope: agent });
  assert.ok(!JSON.stringify(prompt).includes("SERVER-CATALOG-INSTRUCTIONS"));
  const nativePrompt = await ctx.systemPrompt.assemble({ scope: other });
  assert.ok(
    JSON.stringify(nativePrompt).includes("SERVER-CATALOG-INSTRUCTIONS"),
  );
  const tools = await call(agent, "gallery_mcp_tools", { id: row.id });
  assert.equal(tools.isError, false, JSON.stringify(tools));
  assert.equal(tools.value.tools[0].name, "mcp__papers__search");
  const result = await call(
    agent,
    "gallery_mcp_call",
    {
      id: row.id,
      tool: "mcp__papers__search",
      arguments: { query: "agent workflows" },
    },
    "live-call",
  );
  assert.equal(result.isError, false, JSON.stringify(result));
  assert.match(
    JSON.stringify(result.content),
    /Internal papers: agent workflows/,
  );
  assert.ok(!JSON.stringify(result).includes("saved-page-key"));
  assert.equal(requests, 1);
  assert.equal(store.getResource(row.id).usageCount, 1);
});
