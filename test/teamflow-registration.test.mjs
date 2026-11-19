import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Readable } from "node:stream";
import { Context } from "@deepseek-ai/cordis";
import { teamflowTemplateTarget } from "../src/teamflow-target.mjs";
import { verifyTeamflowRegistration } from "../src/client/teamflow-registration.mjs";
import { publishToTeamflow } from "../src/teamflow-publish.mjs";
import GalleryService from "../src/host.mjs";
import { StorageManager } from "../src/storage-manager.mjs";

const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/workflow-gated.json", import.meta.url),
    "utf8",
  ),
);
const resource = () => ({
  id: "gallery-example",
  type: "workflow",
  name: fixture.name,
  files: [
    {
      path: "workflow.json",
      encoding: "utf8",
      content: JSON.stringify(fixture),
    },
  ],
});
function registry(values) {
  return { registry: { values: () => values } };
}
const runtime = (directory, state = 2) => ({
  name: "teamflow",
  fibers: [
    {
      state,
      config: directory === undefined ? {} : { templateDirectory: directory },
    },
  ],
});

test("registration resolves the active TeamFlow config rather than an unrelated fallback; ambiguous/inactive plugins refuse", () => {
  const fallback = join(homedir(), ".dsh-teamflow", "templates");
  assert.deepEqual(teamflowTemplateTarget({}, {}), {
    directory: fallback,
    source: "default",
  });
  assert.deepEqual(
    teamflowTemplateTarget(
      {},
      { DSH_TEAMFLOW_TEMPLATE_DIR: "relative/library" },
    ),
    { directory: resolve("relative/library"), source: "environment" },
  );
  assert.deepEqual(
    teamflowTemplateTarget(registry([runtime("configured")]), {
      DSH_TEAMFLOW_TEMPLATE_DIR: "wrong",
    }),
    { directory: resolve("configured"), source: "teamflow" },
  );
  assert.equal(
    teamflowTemplateTarget(registry([runtime(undefined)]), {
      DSH_TEAMFLOW_TEMPLATE_DIR: "wrong",
    }).directory,
    fallback,
  );
  assert.equal(
    teamflowTemplateTarget(registry([runtime("same"), runtime("same")]), {})
      .directory,
    resolve("same"),
  );
  assert.throws(
    () => teamflowTemplateTarget(registry([runtime("a"), runtime("b")]), {}),
    { code: "AMBIGUOUS_TEAMFLOW_DIRECTORY" },
  );
  assert.throws(() => teamflowTemplateTarget(registry([runtime("a", 3)]), {}), {
    code: "TEAMFLOW_INACTIVE",
  });
  assert.throws(() => teamflowTemplateTarget(registry([runtime(123)]), {}), {
    code: "INVALID_TEAMFLOW_DIRECTORY",
  });
});

test("verification confirms exact template/version and reports API, network, rejected record and directory failures honestly", async () => {
  const saved = {
    id: "abc",
    version: 2,
    name: "Example",
    directory: "/actual/templates",
  };
  let payload;
  const ok = await verifyTeamflowRegistration(saved, async (url, options) => {
    payload = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ templates: [{ id: "abc", version: 3 }] }),
    };
  });
  assert.equal(ok.verified, true);
  assert.equal(payload.url, "/plugins/dsh-agent-teams/workflow");
  assert.deepEqual(JSON.parse(payload.options.body), {
    action: "template_list",
  });
  assert.equal(payload.options.credentials, "same-origin");
  for (const [body, message] of [
    [{ templates: [{ id: "abc", version: 1 }] }, /未找到/],
    [{ templates: [{ id: "other", version: 2 }] }, /未找到/],
    [
      { templates: [], warnings: ["无法读取模板 abc.json，原文件已保留。"] },
      /拒绝读取/,
    ],
  ]) {
    await assert.rejects(
      () =>
        verifyTeamflowRegistration(saved, async () => ({
          ok: true,
          status: 200,
          json: async () => body,
        })),
      message,
    );
  }
  await assert.rejects(
    () =>
      verifyTeamflowRegistration(saved, async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      })),
    /接口不可用.*Unauthorized/,
  );
  await assert.rejects(
    () =>
      verifyTeamflowRegistration(saved, async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw Error("HTML");
        },
      })),
    /文件已写入.*无法确认/,
  );
  await assert.rejects(
    () =>
      verifyTeamflowRegistration(saved, async () => {
        throw Error("timeout");
      }),
    /文件已写入.*不要连续重复注册/,
  );
});

test("damaged old history stays untouched and registration creates a new valid record instead of another invisible version", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "gallery-register-history-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await publishToTeamflow(resource(), root);
  const path = join(root, `${first.id}.json`),
    bad = JSON.parse(await readFile(path, "utf8"));
  bad.versions[0].version = 9;
  await writeFile(path, JSON.stringify(bad));
  const before = await readFile(path, "utf8");
  const replacement = await publishToTeamflow(resource(), root);
  assert.notEqual(replacement.id, first.id);
  assert.equal(replacement.version, 1);
  assert.equal(replacement.directory, root);
  assert.equal(await readFile(path, "utf8"), before);
  const repeat = await publishToTeamflow(resource(), root);
  assert.equal(repeat.id, replacement.id);
  assert.equal(repeat.version, 2);
});

test(
  "live Cordis config -> owner registration -> native TeamFlow configured library -> authenticated verification",
  { skip: !process.env.TEAMFLOW_SOURCE },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), "gallery-register-real-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const directory = join(root, "custom-teamflow-library"),
      ctx = new Context();
    const fork = ctx.plugin(
      { name: "teamflow", apply() {} },
      { templateDirectory: directory },
    );
    await fork.inertia;
    t.after(() => fork.dispose());
    assert.equal(teamflowTemplateTarget(ctx).directory, directory);
    const service = Object.create(GalleryService.prototype);
    service.store = new StorageManager(join(root, "gallery"));
    service.ctx = {
      registry: ctx.registry,
      invocation: { peer: { principal: { kind: "owner" } } },
    };
    const saved = service.store.createResource(resource());
    const registered = await service.uiPublishWorkflow(saved.id);
    assert.equal(registered.directory, directory);
    assert.equal(registered.directorySource, "teamflow");
    const native = await import(
      pathToFileURL(
        join(process.env.TEAMFLOW_SOURCE, "lib/workflow-runtime.js"),
      ).href
    );
    const { authenticatedWebRoutes } = await import(
      pathToFileURL(join(process.env.TEAMFLOW_SOURCE, "lib/web-routes.js")).href
    );
    let route;
    const host = {
      get: () => undefined,
      effect: (fn) => fn(),
      agents: { get: () => undefined },
    };
    native.installWorkflowWorkbench(
      host,
      { stateDir: ".agent-teams", templateDirectory: directory, maxMembers: 8 },
      {},
      authenticatedWebRoutes(
        {
          register(value) {
            route = value;
            return () => {};
          },
        },
        () => ({ requestRejection: () => undefined }),
      ),
    );
    const fetcher = async (url, options) => {
      const req = Readable.from([options.body]);
      req.method = "POST";
      req.headers = { "content-type": "application/json" };
      let status, result;
      await route.handler(req, {
        writeHead: (value) => (status = value),
        end: (value) => (result = JSON.parse(value)),
      });
      return { ok: status === 200, status, json: async () => result };
    };
    assert.equal(
      (await verifyTeamflowRegistration(registered, fetcher)).verified,
      true,
    );
    // Same host, different read directory reproduces the previously misleading success.
    native.installWorkflowWorkbench(
      host,
      {
        stateDir: ".agent-teams",
        templateDirectory: join(root, "wrong-library"),
        maxMembers: 8,
      },
      {},
      authenticatedWebRoutes(
        {
          register(value) {
            route = value;
            return () => {};
          },
        },
        () => ({ requestRejection: () => undefined }),
      ),
    );
    await assert.rejects(
      () => verifyTeamflowRegistration(registered, fetcher),
      /未找到/,
    );
  },
);
