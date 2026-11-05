import test from "node:test";
import assert from "node:assert/strict";
import {
  skillDocument,
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
  assert.ok(content.includes("description: " + JSON.stringify(description)));
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
