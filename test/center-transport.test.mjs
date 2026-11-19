import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { GalleryClient } from "../src/client-api.mjs";
import { RemoteGalleryStore } from "../src/remote-store.mjs";
import { StorageManager } from "../src/storage-manager.mjs";

async function server(t, handler) {
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  });
  return "http://127.0.0.1:" + server.address().port;
}

test("center direct transport ignores replaced global fetch and host proxy dispatcher, with all CRUD methods and credentials preserved", async (t) => {
  const requests = [];
  const url = await server(t, async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    requests.push({
      method: req.method,
      url: req.url,
      accept: req.headers.accept,
      auth: req.headers.authorization,
      body,
    });
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ready: true,
        protocol: 3,
        storage: "postgres",
        ownership: true,
        identity: { kind: "enrollment" },
      }),
    );
  });
  const oldDispatcher = getGlobalDispatcher(),
    oldFetch = globalThis.fetch;
  const mock = new MockAgent();
  mock.disableNetConnect();
  mock
    .get(url)
    .intercept({ path: "/v2/health", method: "GET" })
    .reply(200, "<html>proxy login private-body-secret</html>", {
      headers: { "content-type": "text/html" },
    })
    .persist();
  setGlobalDispatcher(mock);
  globalThis.fetch = async () => {
    throw Error("packaged host replaced fetch");
  };
  try {
    const client = new GalleryClient({ url, credential: "fixture-identity" });
    for (const method of ["GET", "POST", "PUT", "DELETE"])
      await client.request("/v2/health", {
        method,
        ...(method !== "GET" ? { body: { value: method } } : {}),
      });
    assert.equal(requests.length, 4);
    assert.deepEqual(
      requests.map((r) => r.method),
      ["GET", "POST", "PUT", "DELETE"],
    );
    assert.ok(
      requests.every(
        (r) =>
          r.accept === "application/json" &&
          r.auth === "Bearer fixture-identity",
      ),
    );
    const adapter = new RemoteGalleryStore({ url, token: "fixture-identity" });
    assert.equal((await adapter.health()).ready, true);
    // Explicit host-proxy mode still uses the host dispatcher, but never the replaced global fetch function.
    const proxied = new GalleryClient({ url, useHostProxy: true });
    await assert.rejects(
      () => proxied.request("/v2/health"),
      (e) => {
        assert.equal(e.code, "INVALID_SERVICE_RESPONSE");
        assert.match(e.message, /HTTP 200/);
        assert.match(e.message, /text\/html/);
        assert.match(e.message, /host-proxy/);
        assert.match(e.message, /\/v2\/health/);
        assert.ok(!e.message.includes("private-body-secret"));
        return true;
      },
    );
  } finally {
    globalThis.fetch = oldFetch;
    setGlobalDispatcher(oldDispatcher);
    await mock.close();
  }
});

test("non-JSON diagnostics do not leak response bodies, tokens or URL query; writes are not replayed; redirects are rejected", async (t) => {
  let writes = 0;
  const url = await server(t, (req, res) => {
    if (req.url === "/redirect") {
      res.writeHead(302, { location: "/html" });
      res.end();
      return;
    }
    if (req.method === "POST") writes++;
    res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
    res.end("secret-response-value");
  });
  const client = new GalleryClient({ url, credential: "private-credential" });
  await assert.rejects(
    () =>
      client.request("/html?secret=query-value", {
        method: "POST",
        body: { secret: "body-value" },
      }),
    (e) => {
      assert.equal(e.status, 502);
      assert.equal(e.code, "INVALID_SERVICE_RESPONSE");
      assert.match(e.message, /text\/html/);
      assert.match(e.message, /direct/);
      for (const secret of [
        "private-credential",
        "query-value",
        "body-value",
        "secret-response-value",
      ])
        assert.ok(!e.message.includes(secret));
      return true;
    },
  );
  assert.equal(writes, 1);
  await assert.rejects(() => client.request("/redirect"));
  assert.throws(
    () =>
      new GalleryClient({
        url,
        useHostProxy: true,
        caCertificate: "private-ca",
      }),
    { code: "PROXY_CA_UNSUPPORTED" },
  );
  assert.throws(() => new GalleryClient({ url, useHostProxy: "true" }), {
    code: "INVALID_PROXY_MODE",
  });
});

test("storage connection defaults direct and preserves explicit proxy choice without changing identity or credentials", (t) => {
  const root = mkdtempSync(join(tmpdir(), "gallery-proxy-config-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manager = new StorageManager(root),
    url = "http://127.0.0.1:8088";
  assert.equal(manager.connection({ url }).useHostProxy, false);
  manager.change((config) => {
    config.service = {
      url,
      token: "fixture-token-123456789",
      userId: "original-user",
      useHostProxy: true,
    };
    config.activeLibraryId = "center";
  });
  assert.equal(manager.settings().service.useHostProxy, true);
  assert.equal(manager.settings().service.hasToken, true);
  assert.ok(!JSON.stringify(manager.settings()).includes("fixture-token"));
  const connection = manager.connection({ url });
  assert.equal(connection.useHostProxy, true);
  assert.equal(connection.token, "fixture-token-123456789");
  assert.equal(
    manager.connection({ url, useHostProxy: false }).useHostProxy,
    false,
  );
  assert.equal(manager.read().service.userId, "original-user");
  assert.throws(() => manager.connection({ url, useHostProxy: "false" }), {
    code: "INVALID_PROXY_MODE",
  });
});

test("fully bundled CommonJS SDK and ordinary module both connect directly despite a host-modified fetch/proxy", async (t) => {
  const { build } = await import("esbuild");
  const { spawn } = await import("node:child_process");
  const { pathToFileURL } = await import("node:url");
  const root = mkdtempSync(join(tmpdir(), "gallery-bundled-sdk-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bundled = join(root, "gallery-sdk.cjs");
  await build({
    entryPoints: [new URL("../src/client-api.mjs", import.meta.url).pathname],
    outfile: bundled,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node24",
    logLevel: "silent",
  });
  const url = await server(t, (_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ready: true, protocol: 3 }));
  });
  const undici = pathToFileURL(
    join(process.cwd(), "node_modules/undici/index.js"),
  ).href;
  const script = `import {createRequire} from 'node:module';
 import {MockAgent,setGlobalDispatcher} from ${JSON.stringify(undici)};
 const mock=new MockAgent();mock.disableNetConnect();setGlobalDispatcher(mock);
 globalThis.fetch=()=>{throw Error('packaged global fetch')};
 const {GalleryClient}=createRequire(import.meta.url)(${JSON.stringify(bundled)});
 const value=await new GalleryClient({url:${JSON.stringify(url)}}).request('/v2/health');
 if(value.protocol!==3)throw Error('Unexpected response');console.log('bundled-direct-ok');await mock.close();`;
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--input-type=module", "-e", script],
      {
        env: {
          ...process.env,
          HTTP_PROXY: "http://127.0.0.1:1",
          HTTPS_PROXY: "http://127.0.0.1:1",
        },
      },
    );
    let out = "",
      err = "";
    child.stdout.on("data", (v) => (out += v));
    child.stderr.on("data", (v) => (err += v));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, out, err }));
  });
  assert.equal(result.code, 0, result.err);
  assert.match(result.out, /bundled-direct-ok/);
  assert.equal(
    (await new GalleryClient({ url }).request("/v2/health")).ready,
    true,
  );
});
