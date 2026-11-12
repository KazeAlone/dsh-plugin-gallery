import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { importResourceFiles } from "../src/client/resource-import.mjs";
import { readSkill, skillIssues } from "../src/client/skill-format.mjs";
import { readAgent, agentIssues } from "../src/client/agent-format.mjs";
import {
  importResource,
  browseServerDirectory,
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

test("server directory import accepts absolute paths outside workspaces and never executes resource scripts", async () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-server-browse-")),
    outside = mkdtempSync(join(tmpdir(), "gallery-server-resource-"));
  try {
    mkdirSync(join(outside, "references"));
    mkdirSync(join(outside, "scripts"));
    writeFileSync(join(outside, "SKILL.md"), skill);
    writeFileSync(join(outside, "references/check.md"), "Checklist");
    writeFileSync(
      join(outside, "scripts/script.js"),
      `require('fs').writeFileSync('${join(root, "executed")}','bad')`,
    );
    mkdirSync(join(root, ".hidden"));
    writeFileSync(join(root, "ignore.txt"), "ignore");
    const browse = await browseServerDirectory({ path: root });
    assert.equal(browse.path, root);
    assert.ok(browse.entries.some((e) => e.name === ".hidden"));
    assert.ok(!browse.entries.some((e) => e.name === "ignore.txt"));
    const parent = await browseServerDirectory({ path: browse.parentPath });
    assert.ok(parent.entries.some((e) => e.path === outside));
    const result = await importResource({
      source: "server",
      type: "skill",
      path: outside,
    });
    assert.equal(result.resource.files.length, 3);
    assert.equal(existsSync(join(root, "executed")), false);
    const byFile = await importResource({
      source: "server",
      type: "skill",
      path: join(outside, "SKILL.md"),
    });
    assert.deepEqual(byFile.resource.files, result.resource.files);
    const top = await browseServerDirectory({ shortcut: "root" });
    assert.equal(top.path, top.rootPath);
    assert.equal(top.parentPath, top.path);
    const start = await browseServerDirectory({ shortcut: "start" });
    assert.equal(start.path, process.cwd());
    await assert.rejects(
      () => browseServerDirectory({ path: "relative/path" }),
      /绝对路径/,
    );
    await assert.rejects(
      () => browseServerDirectory({ path: root + "/missing" }),
      /不存在/,
    );
    await assert.rejects(
      () =>
        importResource({
          source: "github",
          type: "skill",
          url: "https://github.com/test/repo",
        }),
      /远程仓库导入已移除/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
test("server browsing follows explicit directory links while attachment symlinks and oversized imports remain rejected", async () => {
  const root = mkdtempSync(join(tmpdir(), "gallery-server-links-")),
    target = mkdtempSync(join(tmpdir(), "gallery-server-target-"));
  try {
    writeFileSync(join(target, "SKILL.md"), skill);
    symlinkSync(target, join(root, "resource"));
    const list = await browseServerDirectory({ path: root });
    assert.equal(list.entries[0].symlink, true);
    assert.equal(list.entries[0].directory, true);
    const linked = await browseServerDirectory({
      path: join(root, "resource"),
    });
    assert.equal(linked.path, target);
    assert.equal(
      (
        await importResource({
          source: "server",
          type: "skill",
          path: join(root, "resource"),
        })
      ).resource.name,
      "资料核对",
    );
    mkdirSync(join(target, "references"));
    symlinkSync(
      join(root, "resource/SKILL.md"),
      join(target, "references/link.md"),
    );
    await assert.rejects(
      () => importResource({ source: "server", type: "skill", path: target }),
      /符号链接/,
    );
    rmSync(join(target, "references/link.md"));
    writeFileSync(
      join(target, "references/huge.md"),
      "x".repeat(5 * 1024 * 1024 + 1),
    );
    await assert.rejects(
      () => importResource({ source: "server", type: "skill", path: target }),
      /5 MiB/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
  }
});
test(
  "unreadable server directories report OS-account permissions without attempting escalation",
  { skip: typeof process.getuid !== "function" || process.getuid() === 0 },
  async () => {
    const root = mkdtempSync(join(tmpdir(), "gallery-server-permission-"));
    const locked = join(root, "locked");
    mkdirSync(locked);
    try {
      chmodSync(locked, 0o000);
      await assert.rejects(
        () => browseServerDirectory({ path: locked }),
        /系统账号无权读取/,
      );
    } finally {
      chmodSync(locked, 0o700);
      rmSync(root, { recursive: true, force: true });
    }
  },
);
