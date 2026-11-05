export const SKILL_TEMPLATE = `# 执行指引\n\n## 目标\n说明这个 Skill 要完成的任务。\n\n## 步骤\n1. 阅读用户提供的信息。\n2. 按任务要求执行。\n\n## 输出\n说明最终结果的格式与要求。\n`;
export function skillDocument(name, description, body) {
  return `---\nname: ${JSON.stringify(name.trim())}\ndescription: ${JSON.stringify(description.trim())}\n---\n\n${body.trim()}\n`;
}
export function skillIssues(name, description, body, files) {
  const issues = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64)
    issues.push(
      "名称须为 1–64 个小写字母、数字或连字符，不能以连字符开头或结尾。",
    );
  if (!description.trim() || description.length > 1024)
    issues.push("请填写描述，最多 1024 字。");
  if (!body.trim() || body === SKILL_TEMPLATE)
    issues.push("请编写你的执行指引，替换默认模板内容。");
  const paths = new Set(["SKILL.md"]);
  let bytes = new TextEncoder().encode(
    skillDocument(name, description, body),
  ).length;
  for (const f of files) {
    if (
      !/^(scripts|references|assets)\//.test(f.path) ||
      f.path.length > 500 ||
      /[\\\x00-\x1f]/.test(f.path) ||
      f.path.split("/").some((p) => !p || p === "." || p === "..")
    )
      issues.push(`文件路径无效：${f.path}`);
    if (paths.has(f.path)) issues.push(`文件路径重复：${f.path}`);
    paths.add(f.path);
    bytes +=
      f.encoding === "base64"
        ? Math.floor((f.content.length * 3) / 4)
        : new TextEncoder().encode(f.content).length;
  }
  if (files.length > 99) issues.push("包含 SKILL.md 在内最多 100 个文件。");
  if (bytes > 5 * 1024 * 1024) issues.push("文件总大小不能超过 5 MiB。");
  for (const match of body.matchAll(
    /\]\((?:\.\/)?((?:scripts|references|assets)\/[^)]+)\)/g,
  )) {
    if (!paths.has(match[1])) issues.push(`引用的文件不存在：${match[1]}`);
  }
  return [...new Set(issues)];
}
