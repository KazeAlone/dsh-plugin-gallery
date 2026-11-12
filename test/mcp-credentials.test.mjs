import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalGalleryStore } from "../src/local-store.mjs";
import {
  mergeMcpCredentials,
  resolveMcpConfig,
  validateMcpConfig,
  redactMcpError,
} from "../src/mcp-config.mjs";
import { GalleryMcpRuntime } from "../src/mcp-runtime.mjs";
const config = {
  serverName: "papers",
  transport: "streamable-http",
  url: "https://example.com/mcp",
  envRefs: {},
  credentialKeys: ["Authorization"],
  authType: "bearer",
};
const resource = (cfg = config) => ({
  type: "mcp",
  name: "论文库",
  description: "论文检索",
  tags: [],
  metadata: { mcp: cfg },
  files: [{ path: "mcp.json", content: JSON.stringify(cfg), encoding: "utf8" }],
});
test("page credentials resolve without host variables, validate fields and redact diagnostics", () => {
  assert.equal(
    resolveMcpConfig(config, {}, { Authorization: "Bearer direct-secret" })
      .headers.Authorization,
    "Bearer direct-secret",
  );
  assert.deepEqual(
    resolveMcpConfig(
      {
        serverName: "local",
        transport: "stdio",
        command: "node",
        args: [],
        credentialKeys: ["API_KEY"],
      },
      {},
      { API_KEY: "local-secret" },
    ).env,
    { API_KEY: "local-secret" },
  );
  assert.throws(
    () => mergeMcpCredentials(config, {}),
    (e) => e.code === "MISSING_MCP_CREDENTIAL",
  );
  assert.throws(() =>
    mergeMcpCredentials(config, { Authorization: "abc\r\nInjected: yes" }),
  );
  assert.throws(() =>
    mergeMcpCredentials(config, { Authorization: "x", Other: "y" }),
  );
  assert.throws(() =>
    validateMcpConfig({
      ...config,
      credentialKeys: ["Authorization", "authorization"],
    }),
  );
  assert.throws(() =>
    validateMcpConfig({ ...config, envRefs: { authorization: "HOST_TOKEN" } }),
  );
  assert.doesNotMatch(
    redactMcpError(new Error("Bearer direct-secret / direct-secret"), {
      Authorization: "Bearer direct-secret",
    }),
    /direct-secret/,
  );
});
test("credentials persist privately, stay out of read/list/snapshots, survive edits and delete atomically", async () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-mcp-credentials-"));
  try {
    const path = join(root, "resources.json");
    const store = new LocalGalleryStore(path);
    const saved = store.createResource({
      ...resource(),
      mcpCredentials: { Authorization: "Bearer private-token" },
    });
    assert.deepEqual(saved.mcpCredentialKeys, ["Authorization"]);
    assert.equal(statSync(path).mode & 0o777, 0o600);
    for (const publicValue of [
      saved,
      store.getResource(saved.id),
      store.listResources({}),
      store.getSnapshot({ id: saved.id }),
    ])
      assert.doesNotMatch(
        JSON.stringify(publicValue),
        /private-token|privateMcpCredentials/,
      );
    assert.equal(
      new LocalGalleryStore(path).read().resources[0].privateMcpCredentials
        .Authorization,
      "Bearer private-token",
    );
    const edited = store.updateResource(saved.id, resource(), saved.revision);
    assert.equal(
      store.read().resources[0].privateMcpCredentials.Authorization,
      "Bearer private-token",
    );
    const before = readFileSync(path, "utf8");
    assert.throws(
      () =>
        store.updateResource(
          saved.id,
          { ...resource(), mcpCredentials: { Authorization: "replacement" } },
          saved.revision,
        ),
      (e) => e.code === "CONFLICT",
    );
    assert.equal(readFileSync(path, "utf8"), before);
    const mounted = [],
      disposed = [];
    const runtime = new GalleryMcpRuntime(
      {
        plugin: async (_plugin, c) => {
          mounted.push(c);
          return { dispose: async () => disposed.push(true) };
        },
        logger: { warn: () => {} },
      },
      { adapter: () => store },
    );
    await runtime.refresh();
    assert.equal(mounted[0].headers.Authorization, "Bearer private-token");
    const changed = store.updateResource(
      saved.id,
      {
        ...resource(),
        mcpCredentials: { Authorization: "Bearer changed-token" },
      },
      edited.revision,
    );
    await runtime.refresh();
    assert.equal(mounted[1].headers.Authorization, "Bearer changed-token");
    assert.equal(disposed.length, 1);
    const cleared = store.updateResource(
      saved.id,
      resource({ ...config, credentialKeys: [], authType: "none" }),
      changed.revision,
    );
    assert.deepEqual(store.read().resources[0].privateMcpCredentials, {});
    await runtime.refresh();
    assert.deepEqual(mounted[2].headers, {});
    store.deleteResource(saved.id, cleared.revision);
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /private-token|changed-token/,
    );
    await runtime.dispose();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("runtime activation errors never print saved credential values", async () => {
  const messages = [];
  const row = {
    ...resource(),
    id: "one",
    privateMcpCredentials: { Authorization: "Bearer private-value" },
  };
  const runtime = new GalleryMcpRuntime(
    {
      plugin: async () => {
        throw new Error("authorization failed private-value");
      },
      logger: { warn: (m) => messages.push(m) },
    },
    { adapter: () => ({ read: () => ({ resources: [row] }) }) },
  );
  await runtime.refresh();
  assert.equal(messages.length, 1);
  assert.doesNotMatch(messages[0], /private-value/);
});

test("HTTP connection checks send page credentials and reject unauthorized requests", async () => {
  const { createServer } = await import("node:http");
  const { checkMcpConnection } = await import("../src/mcp-check.mjs");
  const headers = [];
  const server = createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }
    headers.push(req.headers.authorization);
    if (req.headers.authorization !== "Bearer page-test-key") {
      res.writeHead(401);
      res.end("Unauthorized");
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
    const result =
      message.method === "initialize"
        ? {
            protocolVersion: message.params.protocolVersion,
            capabilities: { tools: {} },
            serverInfo: { name: "auth-test", version: "1.0.0" },
          }
        : message.method === "tools/list"
          ? {
              tools: [
                {
                  name: "search",
                  description: "Search papers",
                  inputSchema: { type: "object", properties: {} },
                },
              ],
            }
          : {};
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const c = {
      ...config,
      url: `http://127.0.0.1:${server.address().port}/mcp`,
    };
    const result = await checkMcpConnection(c, {
      Authorization: "Bearer page-test-key",
    });
    assert.equal(result.connected, true);
    assert.equal(result.tools[0].name, "search");
    assert.ok(headers.length >= 2);
    assert.ok(headers.every((value) => value === "Bearer page-test-key"));
    await assert.rejects(() =>
      checkMcpConnection(c, { Authorization: "Bearer wrong-key" }),
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("stdio connection checks pass page values only to the service environment", async () => {
  const { checkMcpConnection } = await import("../src/mcp-check.mjs");
  const result = await checkMcpConnection(
    {
      serverName: "local-auth",
      transport: "stdio",
      command: process.execPath,
      args: ["test/mcp-fixture.mjs", "--require-key"],
      cwd: process.cwd(),
      credentialKeys: ["GALLERY_API_KEY"],
    },
    { GALLERY_API_KEY: "page-local-key" },
  );
  assert.equal(result.connected, true);
  assert.equal(result.tools[0].name, "ping");
  assert.notEqual(process.env.GALLERY_API_KEY, "page-local-key");
});
