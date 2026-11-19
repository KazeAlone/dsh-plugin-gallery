import test from "node:test";
import assert from "node:assert/strict";
import { createGalleryText, normalizeLanguage } from "../src/client/locale.mjs";
import { english } from "../src/client/messages-en.mjs";
import { createGalleryTrigger } from "../src/client/gallery-trigger.mjs";
test("Gallery locale follows host language codes with independent translators", () => {
  assert.equal(normalizeLanguage("en-US"), "en");
  assert.equal(normalizeLanguage("zh-CN"), "zh");
  const en = createGalleryText("en"),
    zh = createGalleryText("zh");
  assert.equal(zh("Workflow"), "Workflow");
  assert.equal(zh("Gallery"), "Gallery");
  assert.equal(en("名称"), "Name");
  assert.equal(zh("名称"), "名称");
  assert.equal(en("创建 {0}", "名称"), "Create 名称");
  assert.equal(
    en("资源名称 必须为 1–160 字符"),
    "Resource name must contain 1–160 characters",
  );
  assert.equal(
    en("unrecognized custom content"),
    "unrecognized custom content",
  );
  assert.equal(en("Skill 已保存。"), "Skill saved.");
  assert.equal(zh("Skill saved."), "Skill 已保存。");
  assert.equal(
    en("删除「资源名称」？资源和累计调用记录将被删除，无法恢复。"),
    "Delete “资源名称”? The resource and its usage records will be permanently removed.",
  );
  assert.equal(
    zh("Registered with TeamFlow: 我的流程 v3"),
    "已注册到 TeamFlow：我的流程 v3",
  );
});
test("every English interface message is translated and preserves positional placeholders", () => {
  for (const [source, value] of Object.entries(english)) {
    assert.ok(value && typeof value === "string", source);
    assert.equal(/\p{Script=Han}/u.test(value), false, source);
    assert.deepEqual(
      [...source.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort(),
      [...value.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort(),
      source,
    );
  }
});
test("slash suggestions read the current host language and preserve resource text", async () => {
  let language = "zh";
  const trigger = createGalleryTrigger(
    {
      uiSkillCatalog: async () => [
        {
          name: "gskill-" + "a".repeat(32),
          label: "名称",
          description: "描述",
        },
      ],
    },
    null,
    () => createGalleryText(language),
  );
  assert.equal(
    (
      await trigger.candidates(null, {
        query: "g",
        signal: new AbortController().signal,
      })
    )[0].description,
    "选择 Gallery Skill",
  );
  language = "en";
  assert.equal(
    (
      await trigger.candidates(null, {
        query: "g",
        signal: new AbortController().signal,
      })
    )[0].description,
    "Choose a Gallery Skill",
  );
  const rows = await trigger.candidates(null, {
    query: "gallery",
    signal: new AbortController().signal,
  });
  assert.equal(rows[0].name, "名称");
  assert.equal(rows[0].description, "描述");
});
