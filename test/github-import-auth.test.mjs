import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  statSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { GithubImportAuth, githubToken } from "../src/github-import-auth.mjs";
import {
  githubImportConnection,
  importResource,
  importGithubResource,
  parseGithubImportUrl,
} from "../src/resource-import.mjs";

test("GitHub service detection supports enterprise hosts, ports and custom API roots", () => {
  assert.equal(
    githubImportConnection({ url: "https://github.xxx.net/xxx/AX.git" })
      .apiBaseUrl,
    "https://github.xxx.net/api/v3",
  );
  assert.equal(
    githubImportConnection({ url: "https://github.com/owner/repo" }).apiBaseUrl,
    "https://api.github.com",
  );
  assert.equal(
    githubImportConnection({
      url: "http://git.internal:8080/acme/repo",
      apiBaseUrl: "https://api.internal/prefix/api/v3/",
    }).apiBaseUrl,
    "https://api.internal/prefix/api/v3",
  );
  assert.equal(
    parseGithubImportUrl("https://github.xxx.net/xxx/AX.git").repo,
    "AX",
  );
  for (const apiBaseUrl of [
    "file:///etc",
    "https://user:secret@internal/api",
    "https://internal/api?token=secret",
  ])
    assert.throws(() =>
      githubImportConnection({ url: "https://github.xxx.net/a/b", apiBaseUrl }),
    );
  assert.equal(githubToken(" token private-pat "), "private-pat");
  assert.throws(() => githubToken("secret\r\nX-Evil: 1"));
});
test("stored import tokens are write-only and scoped to API roots without weakening file permissions", () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-github-auth-"));
  try {
    const store = new GithubImportAuth(join(root, "github.credentials.json"));
    const api = "https://git.internal/api/v3";
    store.set(api, "test-private-pat");
    assert.equal(statSync(store.path).mode & 0o777, 0o600);
    assert.equal(store.get(api), "test-private-pat");
    assert.equal(store.get("https://other.internal/api/v3"), "");
    assert.equal(store.get("https://git.internal/different-api"), "");
    assert.deepEqual(store.status(api), { apiBaseUrl: api, hasToken: true });
    assert.doesNotMatch(JSON.stringify(store.status(api)), /test-private-pat/);
    assert.equal(store.set(api, "").hasToken, false);
    writeFileSync(store.path, '{"broken":"sensitive-token');
    assert.throws(
      () => store.get(api),
      (error) => !error.message.includes("sensitive-token"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("private enterprise imports authenticate, reuse tokens, support one-time credentials and block redirects", async () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-private-import-"));
  const authStore = new GithubImportAuth(join(root, "github.credentials.json"));
  const seen = [];
  let forwarded = 0;
  const body =
    "---\nname: private-skill\ndescription: Private skill example\n---\n\n# 企业 Skill\n\n核对资料并交付摘要。";
  const sha = "a".repeat(40),
    main = {
      name: "SKILL.md",
      path: "SKILL.md",
      type: "file",
      sha,
      size: Buffer.byteLength(body),
    };
  const spy = createServer((req, res) => {
    forwarded++;
    res.end("{}");
  });
  await new Promise((r) => spy.listen(0, "127.0.0.1", r));
  const server = createServer((req, res) => {
    seen.push({ url: req.url, auth: req.headers.authorization });
    if (req.headers.authorization !== "Bearer private-pat") {
      res.writeHead(401);
      res.end("Do not echo private-pat");
      return;
    }
    if (req.url.endsWith("/repos/acme/redirect")) {
      res.writeHead(302, {
        Location: `http://127.0.0.1:${spy.address().port}/steal`,
      });
      res.end();
      return;
    }
    let result;
    if (req.url.endsWith("/repos/acme/private"))
      result = { default_branch: "main" };
    else if (req.url.includes("/contents?ref=main")) result = [main];
    else if (req.url.endsWith("/git/blobs/" + sha))
      result = {
        encoding: "base64",
        content: Buffer.from(body).toString("base64"),
      };
    else {
      res.writeHead(404);
      res.end("{}");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`,
      url = origin + "/acme/private.git";
    const input = {
      source: "github",
      type: "skill",
      url,
      token: "private-pat",
      rememberToken: true,
    };
    const result = await importResource({}, input, { authStore });
    assert.equal(result.resource.name, "企业 Skill");
    assert.equal(authStore.status(origin + "/api/v3").hasToken, true);
    assert.doesNotMatch(JSON.stringify(result), /private-pat|Authorization/);
    await importResource({}, { ...input, token: "" }, { authStore });
    assert.ok(seen.every((r) => r.auth === "Bearer private-pat"));
    const custom = {
      ...input,
      apiBaseUrl: origin + "/custom/api",
      rememberToken: false,
    };
    await importResource({}, custom, { authStore });
    assert.equal(authStore.status(custom.apiBaseUrl).hasToken, false);
    await assert.rejects(
      () => importResource({}, { ...custom, token: "" }, { authStore }),
      /认证失败/,
    );
    assert.ok(seen.some((r) => r.url.startsWith("/custom/api/repos/")));
    await assert.rejects(
      () => importGithubResource({ ...input, url: origin + "/acme/redirect" }),
      /连接失败/,
    );
    assert.equal(forwarded, 0);
    authStore.set(origin + "/api/v3", "");
    await assert.rejects(
      () => importResource({}, { ...input, token: "" }, { authStore }),
      /认证失败/,
    );
    assert.doesNotMatch(readFileSync(authStore.path, "utf8"), /private-pat/);
  } finally {
    server.closeAllConnections();
    spy.closeAllConnections();
    await Promise.all([
      new Promise((r) => server.close(r)),
      new Promise((r) => spy.close(r)),
    ]);
    rmSync(root, { recursive: true, force: true });
  }
});
