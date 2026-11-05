import { parseDocument, stringify } from "yaml";
export const AGENT_TEMPLATE = "## 任务目标\n\n## 处理边界\n\n## 工作方式与回报时机\n\n## 输出要求\n";
export function agentDocument(
  { slug, description, goal, boundaries, instructions },
  extra = {},
) {
  const frontmatter = {
    ...extra,
    name: slug.trim(),
    description: description.trim(),
  };
  return `---\n${stringify(frontmatter)}---\n\n# ${slug.trim()}\n\n${goal.trim()}\n\n${boundaries.trim() ? `## 处理边界\n${boundaries.trim()}\n\n` : ""}${instructions.trim()}\n`;
}
export function readAgent(resource) {
  const file = resource?.files?.find((f) => f.path === "AGENT.md");
  const base = {
    slug: resource?.metadata?.agent?.slug || "",
    description: resource?.description || "",
    goal: resource?.metadata?.agent?.goal || "",
    boundaries: resource?.metadata?.agent?.boundaries || "",
    instructions: resource?.metadata?.agent?.instructions || AGENT_TEMPLATE,
    extra: {},
    error: "",
  };
  if (!file) return base;
  if (file.encoding !== "utf8")
    return { ...base, error: "AGENT.md 必须是 UTF-8 文本。" };
  const match = file.content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return base;
  try {
    const doc = parseDocument(match[1]);
    if (doc.errors.length) throw doc.errors[0];
    const data = doc.toJS();
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw Error("文件头必须是 YAML 对象");
    const { name, description, ...extra } = data;
    return {
      ...base,
      slug: base.slug || name || "",
      description: base.description || description || "",
      extra,
    };
  } catch (e) {
    return { ...base, error: `AGENT.md 文件头无法解析：${e.message}` };
  }
}
export function agentIssues({
  slug,
  name,
  description,
  goal,
  instructions,
  files,
  config,
  tags,
  error,
}) {
  const issues = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 64)
    issues.push("英文标识须为 1–64 个小写字母、数字或连字符。");
  if (!name.trim() || name.length > 160)
    issues.push("请输入显示名称（最多 160 字）。");
  if (!description.trim() || description.length > 1024)
    issues.push("请输入简介（最多 1024 字）。");
  if (!instructions.trim() || instructions === AGENT_TEMPLATE)
    issues.push("请填写自己的行为指引。");
  if (tags.length > 20 || tags.some((t) => t.length > 40))
    issues.push("最多 20 个标签，每个最多 40 字。");
  if (files.length > 98) issues.push("附属文件最多 98 个。");
  const seen = new Set(["AGENT.md", "config.json"]);
  let bytes = 0;
  for (const file of files) {
    if (
      !/^(references|assets)\//.test(file.path) ||
      file.path.split("/").some((x) => !x || x === "." || x === "..") ||
      /[\\\x00-\x1f]/.test(file.path)
    )
      issues.push(`文件路径无效：${file.path}`);
    if (seen.has(file.path)) issues.push(`路径重复：${file.path}`);
    seen.add(file.path);
    bytes +=
      file.encoding === "base64"
        ? Math.ceil((file.content.length * 3) / 4)
        : new TextEncoder().encode(file.content).length;
  }
  if (
    bytes +
      new TextEncoder().encode(JSON.stringify(config) + goal + instructions)
        .length >
    5 * 1024 * 1024
  )
    issues.push("文件总大小不能超过 5 MiB。");
  if (error) issues.push(error);
  return [...new Set(issues)];
}
