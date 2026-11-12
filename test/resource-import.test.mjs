import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { importResourceFiles } from "../src/client/resource-import.mjs";
import { readSkill, skillIssues } from "../src/client/skill-format.mjs";
import { readAgent, agentIssues } from "../src/client/agent-format.mjs";
import {
  importResource,
  browseImportWorkspace,
  importGithubResource,
  parseGithubImportUrl,
} from "../src/resource-import.mjs";
const file = (path, content) => ({ path, content, encoding: "utf8" });
const skill =
  "---\nname: paper-review\ndescription: 检查资料\nlicense: MIT\n---\n\n# 资料核对\n\n阅读原文并交付摘要。\n";
const agent =
  "---\nname: reviewer\ndescription: 逐条审阅资料\nmodel: obsolete-model\npermission:\n  edit: deny\n---\n\n# 审阅员\n\n核对事实并返回来源和待确认项。\n";
test("Skill folder import retains frontmatter, nested attachments and binary files", () => {
  const { resource, warnings } = importResourceFiles("skill", [
    file("demo/SKILL.md", skill),
    file("demo/references/nested/check.md", "Check"),
    file("demo/scripts/check.py", "print(1)"),
    { path: "demo/assets/icon.bin", encoding: "base64", content: "AP8=" },
    file("demo/README.md", "ignored"),
  ]);
  const p = readSkill(resource);
  assert.equal(resource.name, "资料核对");
  assert.equal(p.name, "paper-review");
  assert.equal(p.frontmatter.license, "MIT");
  assert.equal(p.files.length, 3);
  assert.deepEqual(skillIssues(p.name, p.description, p.body, p.files), []);
  assert.match(warnings.join(" "), /README/);
  assert.equal(p.files[2].content, "AP8=");
});
test("Agent Markdown import preserves instructions, extras and attachments while ignoring model selection", () => {
  const { resource, warnings } = importResourceFiles("agent", [
    file("reviewer.md", agent),
    file("references/check.md", "Checklist"),
    file("assets/template.md", "Template"),
    file("config.json", '{"model":"obsolete","temperature":0.2}'),
    file("scripts/check.py", "ignored"),
  ]);
  const p = readAgent(resource);
  assert.match(p.instructions, /核对事实/);
  assert.equal(p.slug, "reviewer");
  assert.equal(p.extra.permission.edit, "deny");
  assert.equal(p.extra.model, undefined);
  assert.deepEqual(resource.metadata.agent.config, { temperature: 0.2 });
  assert.equal(resource.files.length, 4);
  assert.match(warnings.join(" "), /模型配置/);
  assert.match(warnings.join(" "), /scripts/);
  assert.deepEqual(
    agentIssues({
      slug: p.slug,
      name: resource.name,
      description: p.description,
      instructions: p.instructions,
      files: resource.files.filter(
        (f) => !["AGENT.md", "config.json"].includes(f.path),
      ),
      config: resource.metadata.agent.config,
      tags: [],
    }),
    [],
  );
});
test("imports handle bare Markdown and Gallery exports and reject ambiguous or malformed input", () => {
  const bare = importResourceFiles("agent", [
    file("research.md", "# 研究助手\n\n查证事实"),
  ]);
  assert.equal(bare.resource.name, "研究助手");
  assert.match(bare.warnings.join(" "), /描述/);
  const exported = importResourceFiles("skill", [
    file("SKILL.md", skill),
  ]).resource;
  const result = importResourceFiles("skill", [
    file(
      "bundle.json",
      JSON.stringify({
        format: "dsh-gallery-resource",
        schemaVersion: 2,
        resource: { ...exported, name: "导出名称", tags: ["研究"] },
      }),
    ),
  ]);
  assert.equal(result.resource.name, "导出名称");
  assert.deepEqual(result.resource.tags, ["研究"]);
  assert.throws(
    () =>
      importResourceFiles("skill", [
        file("a/SKILL.md", skill),
        file("b/SKILL.md", skill),
      ]),
    /多个资源/,
  );
  assert.throws(
    () =>
      importResourceFiles("skill", [
        file("SKILL.md", "---\nname: [\n---\nbody"),
      ]),
    /YAML/,
  );
  assert.throws(
    () => importResourceFiles("agent", [file("../reviewer.md", agent)]),
    /路径/,
  );
  assert.throws(
    () =>
      importResourceFiles("skill", [
        file("SKILL.md", "x".repeat(5 * 1024 * 1024 + 1)),
      ]),
    /5 MiB/,
  );
});
test("workspace import reads only registered roots and never executes scripts or follows symlinks", async () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-import-"));
  const outside = mkdtempSync(join(tmpdir(), "gallery-import-outside-"));
  const ctx = {
    get: (name) =>
      name === "workspaceRegistry"
        ? { list: () => [{ name: "测试工作区", path: root }] }
        : undefined,
  };
  try {
    mkdirSync(join(root, "skills/review/references"), { recursive: true });
    mkdirSync(join(root, "skills/review/scripts"));
    writeFileSync(join(root, "skills/review/SKILL.md"), skill);
    writeFileSync(join(root, "skills/review/references/check.md"), "Checklist");
    writeFileSync(
      join(root, "skills/review/scripts/script.js"),
      `require('fs').writeFileSync('${join(root, "executed")}','bad')`,
    );
    const browse = await browseImportWorkspace(ctx, { path: "skills" });
    assert.equal(browse.entries[0].name, "review");
    const result = await importResource(ctx, {
      source: "workspace",
      type: "skill",
      workspacePath: root,
      path: "skills/review",
    });
    assert.equal(result.resource.files.length, 3);
    assert.equal(existsSync(join(root, "executed")), false);
    const byFile = await importResource(ctx, {
      source: "workspace",
      type: "skill",
      workspacePath: root,
      path: "skills/review/SKILL.md",
    });
    assert.deepEqual(byFile.resource.files, result.resource.files);
    await assert.rejects(() =>
      importResource(ctx, {
        source: "workspace",
        type: "skill",
        workspacePath: outside,
        path: "",
      }),
    );
    await assert.rejects(() => browseImportWorkspace(ctx, { path: "../" }));
    symlinkSync(outside, join(root, "escape"));
    await assert.rejects(() => browseImportWorkspace(ctx, { path: "escape" }));
    writeFileSync(join(outside, "private.md"), "private");
    symlinkSync(
      join(outside, "private.md"),
      join(root, "skills/review/references/private.md"),
    );
    await assert.rejects(
      () =>
        importResource(ctx, {
          source: "workspace",
          type: "skill",
          path: "skills/review",
        }),
      /符号链接/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
function githubMock(ref = "main") {
  const objects = new Map(),
    dir = new Map(),
    calls = [];
  const entry = (path, content) => {
    const sha = createHash("sha1").update(content).digest("hex");
    objects.set(sha, content);
    return {
      type: "file",
      name: path.split("/").at(-1),
      path,
      sha,
      size: Buffer.byteLength(content),
    };
  };
  const main = entry("skills/demo/SKILL.md", skill),
    check = entry("skills/demo/references/check.md", "Checklist");
  dir.set("skills/demo", [
    main,
    { type: "dir", name: "references", path: "skills/demo/references" },
  ]);
  dir.set("skills/demo/SKILL.md", main);
  dir.set("skills/demo/references", [check]);
  return {
    calls,
    fetch: async (url, options) => {
      calls.push({ url, options });
      const u = new URL(url);
      assert.equal(u.origin, "https://api.github.com");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.Authorization, undefined);
      let value,
        status = 200;
      if (u.pathname === "/repos/test/repo") value = { default_branch: ref };
      else if (u.pathname.includes("/git/blobs/"))
        value = {
          encoding: "base64",
          content: Buffer.from(
            objects.get(u.pathname.split("/").at(-1)) || "",
          ).toString("base64"),
        };
      else if (u.searchParams.get("ref") === ref) {
        const path = decodeURIComponent(
          u.pathname.split("/contents/")[1] || "",
        );
        value = dir.get(path);
        if (!value) status = 404;
      } else status = 404;
      return new Response(JSON.stringify(value || { message: "not found" }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
}
test("GitHub imports a public directory and file with attachments, including slash branch names", async () => {
  for (const ref of ["main", "feature/import"])
    for (const mode of ["tree", "blob"]) {
      const mock = githubMock(ref);
      const url = `https://github.com/test/repo/${mode}/${ref}/skills/demo${mode === "blob" ? "/SKILL.md" : ""}`;
      const { resource } = await importGithubResource(
        { type: "skill", url },
        mock,
      );
      assert.equal(resource.files.length, 2);
      assert.equal(resource.name, "资料核对");
      assert.match(resource.files[1].path, /references\/check.md/);
    }
  for (const url of [
    "http://github.com/test/repo",
    "https://127.0.0.1/test/repo",
    "https://github.com.evil.test/test/repo",
    "https://u:p@github.com/test/repo",
    "https://github.com/test/repo/tree/main/%2e%2e/private",
  ])
    assert.throws(() => parseGithubImportUrl(url));
  const mock = githubMock();
  await assert.rejects(
    () =>
      importGithubResource(
        {
          type: "skill",
          url: "https://github.com/test/repo/tree/main/missing",
        },
        mock,
      ),
    /无法定位/,
  );
});
