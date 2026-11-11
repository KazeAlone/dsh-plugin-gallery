import { randomUUID } from 'node:crypto';
import { normalizeResource, digest } from './model.mjs';
import { stringify } from 'yaml';
import { syncSkillAttachments } from './client/skill-format.mjs';

const seed = 'gallery-skill-reference-v1';
// Only refresh exact copies of the two previously shipped templates.
// Revisions can also increase when Gallery updates a built-in, so they do not
// reliably distinguish a user edit from an earlier automatic update.
const previousDigests = new Set([
  'd6f702eb399cce245a1bec442e50f6d0fcc9117aa1a13abe7d466f84363b588b',
  '1b58bd2ed92c82b5ddfa9b6305e974657f58e0f521cc5489df7297a9c40d718b',
]);
export function referenceSkill() {
  const header = {
    name: 'gallery-skill-reference',
    description: '将用户提供的会议原文整理为结构化纪要，保留关键事实、负责人、截止时间及待确认项。',
    license: 'MIT',
    compatibility: 'DSH Skill 服务；可选脚本需要 Python 3，仅使用标准库。',
    metadata: { author: 'ZelongWANG', version: '1.1.0' },
    'user-invocable': true,
    'disable-model-invocation': false,
  };
  const body = `# 会议纪要整理与摘要

依据用户提供的会议原文整理纪要，提取结论、关键事实和待办，明确区分已确认内容与待确认信息。

## 适用场景
用户希望整理会议记录、会议转写或会后笔记，形成便于审阅和跟进的纪要。只在用户明确要求整理内容或调用此 Skill 时执行。

## 输入
用户提供的会议原文，以及可选的目标读者、篇幅与输出语言。缺少原文时先询问，不编造内容。默认使用原文语言。

## 执行步骤
1. 阅读原文，识别主题、事实、结论和待办事项。
2. 按 [摘要规则](references/summary-rules.md) 区分原文事实与未确认信息。
3. 使用 [输出模板](assets/summary-template.md) 组织结果；没有的信息填写“原文未提供”。
4. 需要演示脚本时，可用 Python 3 执行 scripts/inspect_note.py，传入用户指定的可读 UTF-8 文件。脚本仅输出行数和标题数，不写文件；通常无需执行。
5. 对照参考资料中的检查清单复核后输出，不声称已经执行未运行的脚本。

## 输出要求
交付主题、摘要、关键事实、待办事项及待确认问题。保留必要的人名、日期、数字，不扩写原文没有的结论。

## 输入输出示例
输入：周五前完成界面初稿，由小黄负责；评审时间待定。
输出：主题：界面初稿；待办：小黄在周五前完成初稿；待确认：评审时间。其他信息原文未提供。
`;
  const resource = {
    type: 'skill', name: '会议纪要整理与摘要 · Skill 示例', description: header.description,
    tags: ['参考模板', '会议纪要', '摘要'], metadata: { cover: 'writing', builtin: seed }, references: [],
    files: [
      { path: 'SKILL.md', encoding: 'utf8', content: `---\n${stringify(header)}---\n\n${body}` },
      { path: 'scripts/inspect_note.py', encoding: 'utf8', content: '"""Read a UTF-8 note and print statistics without changing files."""\nimport argparse\nimport json\nfrom pathlib import Path\n\nparser = argparse.ArgumentParser(description=__doc__)\nparser.add_argument("file", type=Path, help="User-selected UTF-8 text file")\nargs = parser.parse_args()\ntext = args.file.read_text(encoding="utf-8")\nlines = text.splitlines()\nprint(json.dumps({"lines": len(lines), "headings": sum(line.startswith("#") for line in lines)}, ensure_ascii=False))\n' },
      { path: 'references/summary-rules.md', encoding: 'utf8', content: '# 摘要规则\n\n- 事实只来自用户原文。\n- 推测与待确认信息单独标注。\n- 待办保留负责人和截止时间，缺失时注明。\n\n## 保存前检查\n\n- [ ] 没有虚构事实、日期或负责人。\n- [ ] 关键数字与原文一致。\n- [ ] 不确定性已标注。\n- [ ] 输出遵循素材模板。\n' },
      { path: 'assets/summary-template.md', encoding: 'utf8', content: '# 主题\n\n## 摘要\n\n## 关键事实\n\n## 待办事项\n\n| 事项 | 负责人 | 截止时间 |\n| --- | --- | --- |\n\n## 待确认问题\n' },
    ],
  };
  resource.files[0].content = `---\n${stringify(header)}---\n\n${syncSkillAttachments(body, resource.files.slice(1).sort((a, b) => a.path.localeCompare(b.path)))}\n`;
  return resource;
}
/** Seed once in the resource transaction; edits and deletions survive restart. */
export function installReferenceSkill(adapter) {
  const current = adapter.read();
  if (current.builtinSeeds?.includes(seed)) {
    const existing = current.resources.find(row => row.metadata?.builtin === seed);
    if (!existing) return;
    const fresh = normalizeResource(referenceSkill());
    const nextDigest = digest(JSON.stringify(fresh));
    const refresh = existing.digest !== nextDigest && previousDigests.has(existing.digest);
    if (!refresh && existing.creator?.username !== 'Gallery') return;
    return adapter.write(rows => {
      const row = rows.find(item => item.id === existing.id);
      if (refresh && row.digest === existing.digest && row.revision === existing.revision) {
        Object.assign(row, fresh, { digest: nextDigest, revision: row.revision + 1, updatedAt: new Date().toISOString() });
      }
      if (row.creator?.username === 'Gallery') row.creator = { username: 'ZelongWANG' };
      return row;
    });
  }
  return adapter.write((rows, data) => {
    const existing = rows.find(row => row.metadata?.builtin === seed);
    data.builtinSeeds = [...new Set([...(data.builtinSeeds || []), seed])];
    if (existing) return existing;
    const resource = normalizeResource(referenceSkill());
    const now = new Date().toISOString();
    const row = { ...resource, id: randomUUID(), creator: { username: 'ZelongWANG' }, digest: digest(JSON.stringify(resource)), revision: 1, createdAt: now, updatedAt: now };
    rows.push(row);
    return row;
  });
}
