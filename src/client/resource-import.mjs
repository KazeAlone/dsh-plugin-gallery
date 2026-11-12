import { parseDocument } from "yaml";
import { skillDocument } from "./skill-format.mjs";
import { agentDocument } from "./agent-format.mjs";
import { createResourceIdentifier } from "./resource-id.mjs";

export const IMPORT_LIMIT = 5 * 1024 * 1024;
const validPath = (path) =>
  typeof path === "string" &&
  !/^[\\/]|[\\\x00-\x1f]/.test(path) &&
  !/^[a-z]:/i.test(path) &&
  path.split("/").every((p) => p && p !== "." && p !== "..");
export function importResourceFiles(type, input, label = "") {
  if (!["skill", "agent"].includes(type))
    throw Error("仅支持导入 Skill 和 Agent");
  if (!Array.isArray(input) || !input.length || input.length > 100)
    throw Error("请选择一个资源，最多 100 个文件");
  const seen = new Set();
  let total = 0;
  for (const f of input) {
    if (
      !validPath(f.path) ||
      seen.has(f.path) ||
      !["utf8", "base64"].includes(f.encoding) ||
      typeof f.content !== "string"
    )
      throw Error("文件路径、编码无效或存在重复文件");
    seen.add(f.path);
    if (
      f.encoding === "base64" &&
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        f.content,
      )
    )
      throw Error("附件编码无效");
    total +=
      f.encoding === "base64"
        ? (f.content.length * 3) / 4
        : new TextEncoder().encode(f.content).length;
  }
  if (total > IMPORT_LIMIT) throw Error("资源文件总大小不能超过 5 MiB");
  if (input.length === 1 && /\.json$/i.test(input[0].path)) {
    let bundle;
    try {
      bundle = JSON.parse(input[0].content);
    } catch {
      throw Error("资源包 JSON 无法解析");
    }
    if (
      bundle.format !== "dsh-gallery-resource" ||
      ![1, 2].includes(bundle.schemaVersion) ||
      bundle.resource?.type !== type
    )
      throw Error("请选择同类型的 Gallery 导出资源包");
    const result = importResourceFiles(
      type,
      bundle.resource.files,
      bundle.resource.name || label,
    );
    const source = bundle.resource;
    return {
      ...result,
      resource: {
        ...result.resource,
        name:
          typeof source.name === "string" ? source.name : result.resource.name,
        description:
          typeof source.description === "string"
            ? source.description
            : result.resource.description,
        tags: Array.isArray(source.tags) ? source.tags : result.resource.tags,
        metadata: {
          ...result.resource.metadata,
          ...(source.metadata?.cover ? { cover: source.metadata.cover } : {}),
        },
      },
    };
  }
  const canonical = type === "skill" ? "SKILL.md" : "AGENT.md";
  let candidates = input.filter((f) => f.path.split("/").at(-1) === canonical);
  if (!candidates.length && input.length === 1 && /\.md$/i.test(input[0].path))
    candidates = [input[0]];
  if (!candidates.length && type === "agent")
    candidates = input.filter(
      (f) =>
        /\.md$/i.test(f.path) &&
        !/(^|\/)(references|assets|scripts)\//.test(f.path),
    );
  if (!candidates.length)
    throw Error(`未找到 ${canonical}，请单独选择资源目录或 Markdown 文件`);
  const depth = Math.min(...candidates.map((f) => f.path.split("/").length));
  candidates = candidates.filter((f) => f.path.split("/").length === depth);
  if (candidates.length !== 1)
    throw Error("发现多个资源，请选择其中一个资源目录或 Markdown 文件");
  const main = candidates[0];
  if (main.encoding !== "utf8" || main.content.includes("\0"))
    throw Error("主 Markdown 文件必须是 UTF-8 文本");
  const parent = main.path.includes("/")
    ? main.path.slice(0, main.path.lastIndexOf("/") + 1)
    : "";
  const warnings = [],
    attachments = [];
  let config = {};
  for (const f of input) {
    if (f === main) continue;
    const path = f.path.startsWith(parent) ? f.path.slice(parent.length) : "";
    if (type === "agent" && path === "config.json") {
      try {
        config = JSON.parse(f.content);
        if (!config || typeof config !== "object" || Array.isArray(config))
          throw Error();
      } catch {
        throw Error("config.json 必须是有效的 JSON 对象");
      }
      if ("model" in config) {
        delete config.model;
        warnings.push("模型配置已忽略，Agent 沿用宿主模型");
      }
      continue;
    }
    if (
      (type === "skill"
        ? /^(references|scripts|assets)\//
        : /^(references|assets)\//
      ).test(path)
    )
      attachments.push({ ...f, path });
    else warnings.push(`未导入：${f.path}`);
  }
  let body = main.content.replace(/^\uFEFF/, ""),
    frontmatter = {};
  if (/^---\r?\n/.test(body)) {
    const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) throw Error("Markdown 的 YAML 文件头未正确结束");
    const doc = parseDocument(match[1]);
    if (doc.errors.length) throw Error("Markdown 的 YAML 文件头无法解析");
    frontmatter = doc.toJS();
    if (
      !frontmatter ||
      typeof frontmatter !== "object" ||
      Array.isArray(frontmatter)
    )
      throw Error("YAML 文件头必须是对象");
    body = body.slice(match[0].length).replace(/^\r?\n/, "");
  }
  if (!body.trim()) throw Error("Markdown 正文不能为空");
  const candidate =
    frontmatter.name || main.path.split("/").at(-1).replace(/\.md$/i, "");
  const slug =
    typeof candidate === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) &&
    candidate.length <= 64
      ? candidate
      : createResourceIdentifier(type);
  if (frontmatter.name && frontmatter.name !== slug)
    warnings.push("原调用标识不符合格式，已生成新标识，可在高级设置修改");
  const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const name = (title || label || frontmatter.name || slug).slice(0, 160);
  const description =
    typeof frontmatter.description === "string"
      ? frontmatter.description.slice(0, 1024)
      : "";
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
        .filter((t) => typeof t === "string" && t.length <= 40)
        .slice(0, 20)
    : [];
  let resource;
  if (type === "skill")
    resource = {
      type,
      name,
      description,
      tags,
      metadata: {},
      references: [],
      files: [
        {
          path: canonical,
          encoding: "utf8",
          content: skillDocument(slug, description, body, frontmatter),
        },
        ...attachments,
      ],
    };
  else {
    const {
      name: _name,
      description: _description,
      model,
      ...extra
    } = frontmatter;
    if (model !== undefined)
      warnings.push("模型配置已忽略，Agent 沿用宿主模型");
    const firstHeading = body.match(/^# ([^\r\n]+)\r?\n(?:\r?\n)?/);
    const instructions =
      firstHeading?.[1] === slug ? body.slice(firstHeading[0].length) : body;
    const agent = {
      slug,
      description,
      goal: "",
      boundaries: "",
      instructions,
      model: "",
      config,
    };
    resource = {
      type,
      name,
      description,
      tags,
      metadata: { agent },
      references: [],
      files: [
        {
          path: canonical,
          encoding: "utf8",
          content: agentDocument(agent, extra),
        },
        ...(Object.keys(config).length
          ? [
              {
                path: "config.json",
                encoding: "utf8",
                content: JSON.stringify(config, null, 2) + "\n",
              },
            ]
          : []),
        ...attachments,
      ],
    };
  }
  if (!description) warnings.unshift("未找到描述，请在基本信息中补充");
  return { resource, warnings };
}

export async function readBrowserResourceFiles(list) {
  const files = Array.from(list || []);
  if (!files.length || files.length > 100)
    throw Error("最多选择 100 个文件，请单独选择资源目录");
  if (files.reduce((s, f) => s + f.size, 0) > IMPORT_LIMIT)
    throw Error("资源文件总大小不能超过 5 MiB");
  return Promise.all(
    files.map(async (f) => {
      const bytes = new Uint8Array(await f.arrayBuffer());
      let content,
        encoding = "utf8";
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (content.includes("\0")) throw Error();
      } catch {
        encoding = "base64";
        let raw = "";
        for (const b of bytes) raw += String.fromCharCode(b);
        content = btoa(raw);
      }
      return { path: f.webkitRelativePath || f.name, encoding, content };
    }),
  );
}
