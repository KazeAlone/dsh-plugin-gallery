import { createHash } from "node:crypto";

export class GalleryError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function demand(ok, status, code, message) {
  if (!ok) throw new GalleryError(status, code, message);
}
export const TYPES = ["skill", "agent", "mcp", "workflow"];
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export const tokenHash = (token) => digest(token);
export function text(value, name, max = 200) {
  demand(
    typeof value === "string" && value.trim().length > 0 && value.length <= max,
    400,
    "INVALID_INPUT",
    `${name} 必须为 1–${max} 字符`,
  );
  return value.trim();
}
export function revision(value) {
  demand(
    Number.isSafeInteger(value) && value > 0,
    400,
    "INVALID_REVISION",
    "需要有效的草稿 revision / 版本号",
  );
  return value;
}
export function normalizeResource(input) {
  demand(
    input && typeof input === "object" && !Array.isArray(input),
    400,
    "INVALID_INPUT",
    "资源必须是对象",
  );
  demand(
    TYPES.includes(input.type),
    400,
    "INVALID_TYPE",
    "资源类型必须是 skill、agent、mcp 或 workflow",
  );
  const name = text(input.name, "资源名称", 160);
  const description = input.description ?? "";
  demand(
    typeof description === "string" && description.length <= 10000,
    400,
    "INVALID_INPUT",
    "描述不能超过 10000 字符",
  );
  demand(
    Array.isArray(input.tags ?? []) && (input.tags ?? []).length <= 20,
    400,
    "INVALID_INPUT",
    "最多 20 个标签",
  );
  const tags = [
    ...new Set((input.tags ?? []).map((t) => text(t, "标签", 40))),
  ].sort();
  const files = input.files ?? [];
  demand(
    Array.isArray(files) && files.length <= 100,
    400,
    "INVALID_FILES",
    "最多上传 100 个文件",
  );
  let size = 0;
  const paths = new Set();
  const normalizedFiles = files
    .map((f) => {
      const path = text(f.path, "文件路径", 500);
      demand(
        !path.startsWith("/") &&
          !path.includes("\\") &&
          !path.includes("\0") &&
          !/^[a-z]:/i.test(path) &&
          path.split("/").every((p) => p && p !== "." && p !== ".."),
        400,
        "INVALID_PATH",
        "文件路径必须为安全的相对路径",
      );
      demand(!paths.has(path), 400, "DUPLICATE_PATH", `文件路径重复：${path}`);
      paths.add(path);
      const encoding = f.encoding ?? "utf8";
      demand(
        ["utf8", "base64"].includes(encoding) && typeof f.content === "string",
        400,
        "INVALID_FILES",
        "文件需要 utf8 或 base64 内容",
      );
      if (encoding === "base64")
        demand(
          /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
            f.content,
          ),
          400,
          "INVALID_FILES",
          "无效 base64 文件",
        );
      const bytes = Buffer.byteLength(
        f.content,
        encoding === "base64" ? "base64" : "utf8",
      );
      size += bytes;
      return { path, encoding, content: f.content, bytes };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
  demand(
    size <= 5 * 1024 * 1024,
    413,
    "TOO_LARGE",
    "资源文件总量不能超过 5 MiB",
  );
  const metadata = input.metadata ?? {};
  demand(
    metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata) &&
      JSON.stringify(metadata).length <= 50000,
    400,
    "INVALID_METADATA",
    "metadata 必须为不超过 50 KB 的 JSON 对象",
  );
  const references = input.references ?? [];
  demand(
    Array.isArray(references) && references.length <= 100,
    400,
    "INVALID_REFERENCES",
    "最多 100 个资源引用",
  );
  const refs = references.map((r) => ({
    id: text(r.id, "引用 ID", 100),
    version: revision(r.version),
  }));
  demand(
    new Set(refs.map((r) => `${r.id}@${r.version}`)).size === refs.length,
    400,
    "INVALID_REFERENCES",
    "资源引用重复",
  );
  return {
    type: input.type,
    name,
    description,
    tags,
    files: normalizedFiles,
    metadata,
    references: refs,
  };
}
