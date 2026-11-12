import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  readdirSync,
  symlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import {
  importGitResource,
  parseGitImportAddress,
} from "../src/git-resource-import.mjs";
import { importResource } from "../src/resource-import.mjs";
import { readSkill } from "../src/client/skill-format.mjs";

test("Git addresses accept cached HTTPS and SSH while rejecting local paths and executable transports", () => {
  assert.deepEqual(parseGitImportAddress("git@git.internal:team/repo.git"), {
    remote: "git@git.internal:team/repo.git",
    tail: [],
  });
  assert.equal(
    parseGitImportAddress("ssh://git@git.internal:2222/team/repo.git").remote,
    "ssh://git@git.internal:2222/team/repo.git",
  );
  assert.deepEqual(
    parseGitImportAddress(
      "https://git.internal/team/repo/tree/feature/import/skills/demo",
    ).tail,
    ["feature", "import", "skills", "demo"],
  );
  for (const address of [
    "file:///etc",
    "/tmp/repo",
    "ext::touch marker",
    "https://u:p@git.internal/team/repo",
    "ssh://-evil@host/repo",
    "https://host/team/repo/../private",
    "git@-evil:team/repo.git",
  ])
    assert.throws(() => parseGitImportAddress(address));
});

test("host Git reuses cached credentials, reads resource refs and attachments without checkout or execution", async () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-git-test-")),
    work = join(root, "work"),
    remotes = join(root, "remotes");
  mkdirSync(work);
  mkdirSync(join(remotes, "acme"), { recursive: true });
  const previous = {
    GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL,
    GIT_CONFIG_NOSYSTEM: process.env.GIT_CONFIG_NOSYSTEM,
  };
  process.env.GIT_CONFIG_GLOBAL = join(root, "gitconfig");
  process.env.GIT_CONFIG_NOSYSTEM = "1";
  writeFileSync(process.env.GIT_CONFIG_GLOBAL, "");
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: work,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
  let requests = 0,
    authorized = 0;
  const server = createServer(async (req, res) => {
    requests++;
    if (
      req.headers.authorization !==
      "Basic " + Buffer.from("cached-user:cached-pass").toString("base64")
    ) {
      res.writeHead(401, { "WWW-Authenticate": 'Basic realm="test"' });
      res.end();
      return;
    }
    authorized++;
    const url = new URL(req.url, "http://localhost");
    let body = Buffer.alloc(0);
    for await (const chunk of req) body = Buffer.concat([body, chunk]);
    const child = spawn("git", ["http-backend"], {
      env: {
        ...process.env,
        GIT_PROJECT_ROOT: remotes,
        GIT_HTTP_EXPORT_ALL: "1",
        PATH_INFO: url.pathname,
        QUERY_STRING: url.search.slice(1),
        REQUEST_METHOD: req.method,
        CONTENT_TYPE: req.headers["content-type"] || "",
        CONTENT_LENGTH: String(body.length),
        REMOTE_USER: "cached-user",
        AUTH_TYPE: "Basic",
        HTTP_GIT_PROTOCOL: req.headers["git-protocol"] || "",
      },
      stdio: ["pipe", "pipe", "ignore"],
    });
    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.on("close", () => {
      const output = Buffer.concat(chunks),
        split = output.indexOf("\r\n\r\n");
      if (split < 0) {
        res.writeHead(500);
        res.end();
        return;
      }
      const headers = output.subarray(0, split).toString().split("\r\n");
      let status = 200;
      for (const line of headers) {
        const index = line.indexOf(":");
        if (index < 0) continue;
        const key = line.slice(0, index),
          value = line.slice(index + 1).trim();
        if (key.toLowerCase() === "status") status = Number(value.slice(0, 3));
        else res.setHeader(key, value);
      }
      res.writeHead(status);
      res.end(output.subarray(split + 4));
    });
    child.stdin.end(body);
  });
  try {
    git("init", "--quiet", "--initial-branch=main");
    git("config", "user.name", "Test");
    git("config", "user.email", "test@example.invalid");
    mkdirSync(join(work, "skills/demo/references"), { recursive: true });
    mkdirSync(join(work, "skills/demo/scripts"));
    writeFileSync(
      join(work, "skills/demo/SKILL.md"),
      "---\nname: cached-skill\ndescription: Cached Git import\n---\n\n# Cached Skill\n\nCheck the source.",
    );
    writeFileSync(join(work, "skills/demo/references/check.md"), "Checklist");
    writeFileSync(
      join(work, "skills/demo/scripts/never-run.js"),
      `require('fs').writeFileSync('${join(root, "executed")}','bad')`,
    );
    mkdirSync(join(work, "agents"));
    writeFileSync(
      join(work, "agents/review.md"),
      "---\nname: reviewer\ndescription: Review content\n---\n\n# Cached Agent\n\nReturn findings.",
    );
    mkdirSync(join(work, "linked-skill"));
    symlinkSync("../skills/demo/SKILL.md", join(work, "linked-skill/SKILL.md"));
    mkdirSync(join(work, "oversize"));
    writeFileSync(
      join(work, "oversize/SKILL.md"),
      "x".repeat(5 * 1024 * 1024 + 1),
    );
    git("add", ".");
    git("commit", "--quiet", "-m", "fixture");
    git("branch", "feature/import");
    git("tag", "v1");
    git(
      "clone",
      "--quiet",
      "--bare",
      work,
      join(remotes, "acme", "fixture.git"),
    );
    git(
      "--git-dir",
      join(remotes, "acme", "fixture.git"),
      "config",
      "uploadpack.allowFilter",
      "true",
    );
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const cache = join(root, "credentials");
    writeFileSync(
      cache,
      `http://cached-user:cached-pass@127.0.0.1:${server.address().port}\n`,
      { mode: 0o600 },
    );
    git("config", "--global", "credential.helper", `store --file=${cache}`);
    const before = readdirSync(tmpdir())
      .filter((name) => name.startsWith("gallery-git-import-"))
      .sort();
    const result = await importResource(
      {},
      {
        source: "github",
        method: "git",
        type: "skill",
        url: origin + "/acme/fixture.git",
        gitPath: "skills/demo",
      },
    );
    assert.equal(result.resource.name, "Cached Skill");
    assert.equal(result.resource.files.length, 3);
    assert.equal(readSkill(result.resource).name, "cached-skill");
    assert.ok(requests > 0 && authorized > 0);
    assert.doesNotMatch(JSON.stringify(result), /cached-pass/);
    assert.equal(readdirSync(root).includes("executed"), false);
    for (const url of [
      origin + "/acme/fixture/tree/feature/import/skills/demo",
      origin + "/acme/fixture/blob/main/skills/demo/SKILL.md",
    ]) {
      // Web links omit .git, while this CGI test service needs it; use the clone URL suffix here.
      const link = url.replace("/fixture/", "/fixture.git/");
      const imported = await importGitResource({ type: "skill", url: link });
      assert.equal(imported.resource.files.length, 3);
    }
    const agent = await importGitResource({
      type: "agent",
      url: origin + "/acme/fixture.git",
      gitRef: "v1",
      gitPath: "agents/review.md",
    });
    assert.match(agent.resource.metadata.agent.instructions, /Return findings/);
    await assert.rejects(
      () =>
        importGitResource({
          type: "skill",
          url: origin + "/acme/fixture.git",
          gitPath: "../private",
        }),
      /相对路径/,
    );
    await assert.rejects(
      () =>
        importGitResource({
          type: "skill",
          url: origin + "/acme/fixture.git",
          gitRef: "--upload-pack=bad",
        }),
      /格式/,
    );
    await assert.rejects(
      () =>
        importGitResource({
          type: "skill",
          url: origin + "/acme/fixture.git",
          gitPath: "linked-skill",
        }),
      /未找到|符号链接/,
    );
    await assert.rejects(
      () =>
        importGitResource({
          type: "skill",
          url: origin + "/acme/fixture.git",
          gitPath: "oversize",
        }),
      /5 MiB/,
    );
    await assert.rejects(
      () =>
        importGitResource({
          type: "skill",
          url: origin + "/acme/fixture.git",
          gitRef: "missing-ref",
        }),
      (error) => !error.message.includes("cached-pass"),
    );
    assert.deepEqual(
      readdirSync(tmpdir())
        .filter((name) => name.startsWith("gallery-git-import-"))
        .sort(),
      before,
    );
    assert.equal(readFileSync(cache, "utf8").includes("cached-pass"), true);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(root, { recursive: true, force: true });
  }
});
