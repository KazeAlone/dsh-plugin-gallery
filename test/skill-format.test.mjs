import test from "node:test";
import assert from "node:assert/strict";
import {
  skillDocument,
  readSkill,
  skillIssues,
  SKILL_TEMPLATE,
} from "../src/client/skill-format.mjs";
import { normalizeResource } from "../src/model.mjs";
test("Skill document safely quotes YAML values and forms a valid Gallery bundle", () => {
  const description = '检查: "代码"\n并给出建议';
  const content = skillDocument(
    "code-review",
    description,
    "# 步骤\n审查代码。",
  );
  assert.equal(
    readSkill({ files: [{ path: "SKILL.md", encoding: "utf8", content }] })
      .description,
    description,
  );
  const resource = normalizeResource({
    type: "skill",
    name: "code-review",
    description,
    files: [{ path: "SKILL.md", encoding: "utf8", content }],
  });
  assert.equal(resource.files[0].content, content);
  assert.deepEqual(
    skillIssues("code-review", description, "# 步骤\n审查代码。", []),
    [],
  );
});
test("Skill validation rejects templates, invalid names, traversal and duplicate attachments", () => {
  assert.ok(skillIssues("Bad Name", "", SKILL_TEMPLATE, []).length >= 3);
  const file = { path: "scripts/../bad.py", encoding: "utf8", content: "" };
  assert.ok(
    skillIssues("review", "Review", "Do review", [file]).some((x) =>
      x.includes("路径无效"),
    ),
  );
  const good = { ...file, path: "scripts/check.py" };
  assert.ok(
    skillIssues("review", "Review", "Do review", [good, good]).some((x) =>
      x.includes("重复"),
    ),
  );
});
test("Skill validation resolves attachment links and enforces package limits", () => {
  const body = "[检查表](references/check.md)";
  assert.ok(
    skillIssues("review", "Review", body, []).some((x) => x.includes("不存在")),
  );
  assert.deepEqual(
    skillIssues("review", "Review", body, [
      { path: "references/check.md", encoding: "utf8", content: "检查" },
    ]),
    [],
  );
  assert.ok(
    skillIssues("review", "Review", "Review", [
      {
        path: "assets/large.txt",
        encoding: "utf8",
        content: "a".repeat(5 * 1024 * 1024),
      },
    ]).some((x) => x.includes("5 MiB")),
  );
});
test("editing round trips frontmatter extensions, body and attachments", () => {
  const content =
    "---\nname: review\ndescription: |\n  Review code\nlicense: MIT\ncompatibility: shell\n---\n\n# Review\n\nRun checks.\n";
  const attachment = {
    path: "assets/logo.png",
    encoding: "base64",
    content: "aGVsbG8=",
  };
  const original = {
    name: "stale",
    description: "stale",
    files: [{ path: "SKILL.md", encoding: "utf8", content }, attachment],
  };
  const draft = readSkill(original);
  assert.equal(draft.name, "review");
  assert.equal(draft.body, "# Review\n\nRun checks.\n");
  assert.deepEqual(draft.files, [attachment]);
  const saved = skillDocument(
    draft.name,
    "Updated",
    draft.body,
    draft.frontmatter,
  );
  const reopened = readSkill({
    ...original,
    files: [{ path: "SKILL.md", encoding: "utf8", content: saved }, attachment],
  });
  assert.equal(reopened.frontmatter.license, "MIT");
  assert.equal(reopened.description, "Updated");
  assert.equal(reopened.body, draft.body);
});
test("legacy escaped headers are recovered and malformed YAML is not silently overwritten", () => {
  const legacy = String.raw`---\nname: "review"\ndescription: "Review"\n---\n\n# Review\n`;
  const draft = readSkill({
    files: [{ path: "SKILL.md", encoding: "utf8", content: legacy }],
  });
  assert.equal(draft.name, "review");
  assert.equal(draft.body, "# Review");
  assert.ok(
    readSkill({
      files: [
        {
          path: "SKILL.md",
          encoding: "utf8",
          content: "---\nname: [\n---\nBody",
        },
      ],
    }).error,
  );
});
