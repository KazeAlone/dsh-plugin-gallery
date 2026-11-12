import { readdir, realpath, lstat, open } from "node:fs/promises";
import { constants } from "node:fs";
import {
  resolve,
  relative,
  isAbsolute,
  join,
  basename,
  dirname,
} from "node:path";
import {
  importResourceFiles,
  IMPORT_LIMIT,
} from "./client/resource-import.mjs";
import { normalizeResource, demand } from "./model.mjs";

const selectedType = (type) => {
  demand(
    ["skill", "agent"].includes(type),
    400,
    "INVALID_IMPORT",
    "仅支持 Skill 和 Agent",
  );
  return type;
};
const safePath = (value) =>
  typeof value === "string" &&
  value.length <= 1000 &&
  !isAbsolute(value) &&
  !/[\\\x00-\x1f]/.test(value) &&
  (!value || value.split("/").every((p) => p && p !== "." && p !== ".."));
export function importWorkspaces(ctx) {
  const registry = ctx.get("workspaceRegistry") ?? ctx.get("workspace");
  const workspaces =
    typeof registry?.list === "function" ? registry.list() : [];
  const rows = Array.isArray(workspaces)
    ? workspaces.filter((w) => typeof w.path === "string" && isAbsolute(w.path))
    : [];
  return rows.length
    ? [
        ...new Map(
          rows.map((w) => [
            w.path,
            { path: w.path, name: w.name || basename(w.path) || w.path },
          ]),
        ).values(),
      ]
    : [{ path: process.cwd(), name: "DSH 启动目录" }];
}
async function workspaceLocation(ctx, input) {
  const roots = importWorkspaces(ctx);
  const workspace = roots.find(
    (w) => w.path === (input.workspacePath || roots[0].path),
  );
  demand(
    workspace && safePath(input.path || ""),
    400,
    "INVALID_IMPORT_PATH",
    "请选择已登记工作区内的相对路径",
  );
  const root = await realpath(workspace.path);
  let target = root;
  for (const part of (input.path || "").split("/").filter(Boolean)) {
    target = join(target, part);
    demand(
      !(await lstat(target)).isSymbolicLink(),
      400,
      "IMPORT_SYMLINK",
      "不支持导入符号链接，请选择实际文件目录",
    );
  }
  const actual = await realpath(target),
    delta = relative(root, actual);
  demand(
    !isAbsolute(delta) && delta !== ".." && !delta.startsWith("../"),
    400,
    "INVALID_IMPORT_PATH",
    "导入路径必须位于所选工作区内",
  );
  return { root, target: actual };
}
export async function browseImportWorkspace(ctx, input = {}) {
  const workspaces = importWorkspaces(ctx);
  const { target } = await workspaceLocation(ctx, input);
  const stat = await lstat(target);
  demand(stat.isDirectory(), 400, "INVALID_IMPORT_PATH", "请选择文件夹");
  const entries = await readdir(target, { withFileTypes: true });
  demand(
    entries.length <= 2000,
    400,
    "IMPORT_TOO_MANY",
    "此目录条目过多，请输入更具体的子目录",
  );
  return {
    workspaces,
    workspacePath: input.workspacePath || workspaces[0].path,
    path: input.path || "",
    entries: entries
      .filter(
        (e) =>
          !e.isSymbolicLink() &&
          ![".git", "node_modules", ".dsh"].includes(e.name) &&
          (e.isDirectory() || /\.(md|json)$/i.test(e.name)),
      )
      .map((e) => ({ name: e.name, directory: e.isDirectory() }))
      .sort(
        (a, b) =>
          Number(b.directory) - Number(a.directory) ||
          a.name.localeCompare(b.name),
      ),
  };
}
function decodeFile(path, bytes) {
  try {
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (content.includes("\0")) throw Error();
    return { path, encoding: "utf8", content };
  } catch {
    return {
      path,
      encoding: "base64",
      content: Buffer.from(bytes).toString("base64"),
    };
  }
}
async function localFile(path, name, budget) {
  demand(budget.count++ < 100, 413, "IMPORT_TOO_MANY", "资源最多 100 个文件");
  const handle = await open(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW || 0),
  );
  try {
    const stat = await handle.stat();
    demand(
      stat.isFile() && stat.size <= IMPORT_LIMIT - budget.bytes,
      413,
      "IMPORT_TOO_LARGE",
      "资源文件总大小不能超过 5 MiB",
    );
    const chunks = [];
    let size = 0;
    for (;;) {
      const chunk = Buffer.alloc(
        Math.min(65536, IMPORT_LIMIT - budget.bytes - size + 1),
      );
      const { bytesRead } = await handle.read(chunk);
      if (!bytesRead) break;
      size += bytesRead;
      demand(
        size + budget.bytes <= IMPORT_LIMIT,
        413,
        "IMPORT_TOO_LARGE",
        "资源文件总大小不能超过 5 MiB",
      );
      chunks.push(chunk.subarray(0, bytesRead));
    }
    budget.bytes += size;
    return decodeFile(name, Buffer.concat(chunks));
  } finally {
    await handle.close();
  }
}
async function localImport(ctx, input) {
  const { target } = await workspaceLocation(ctx, input),
    type = selectedType(input.type),
    stat = await lstat(target);
  const root = stat.isDirectory() ? target : dirname(target);
  const entries = await readdir(root, { withFileTypes: true });
  let main = stat.isFile()
    ? basename(target)
    : entries.find(
        (e) => e.name === (type === "skill" ? "SKILL.md" : "AGENT.md"),
      )?.name;
  if (!main && type === "agent") {
    const docs = entries.filter((e) => e.isFile() && /\.md$/i.test(e.name));
    if (docs.length === 1) main = docs[0].name;
  }
  demand(
    main && /\.(md|json)$/i.test(main),
    400,
    "IMPORT_MAIN_MISSING",
    `未找到 ${type === "skill" ? "SKILL.md" : "AGENT.md 或唯一的 Markdown"}，请指定单个资源目录或文件`,
  );
  demand(
    !(await lstat(join(root, main))).isSymbolicLink(),
    400,
    "IMPORT_SYMLINK",
    "不支持导入符号链接",
  );
  const files = [],
    budget = { count: 0, bytes: 0, visited: 0 };
  files.push(await localFile(join(root, main), main, budget));
  const walk = async (folder, path, depth = 0) => {
    demand(
      depth <= 20 && budget.visited++ < 1000,
      413,
      "IMPORT_TOO_MANY",
      "资源目录层级或数量过多",
    );
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      demand(
        !entry.isSymbolicLink(),
        400,
        "IMPORT_SYMLINK",
        "资源附属目录含符号链接，请移除后再导入",
      );
      if (entry.isDirectory())
        await walk(
          join(folder, entry.name),
          `${path}/${entry.name}`,
          depth + 1,
        );
      else if (entry.isFile())
        files.push(
          await localFile(
            join(folder, entry.name),
            `${path}/${entry.name}`,
            budget,
          ),
        );
      else throw Error("不支持导入特殊文件");
    }
  };
  if (!/\.json$/i.test(main))
    for (const folder of type === "skill"
      ? ["references", "scripts", "assets"]
      : ["references", "assets"]) {
      const found = entries.find((e) => e.name === folder);
      if (!found) continue;
      demand(
        found.isDirectory() && !found.isSymbolicLink(),
        400,
        "IMPORT_SYMLINK",
        "附属目录必须是实际文件夹",
      );
      await walk(join(root, folder), folder);
    }
  if (
    type === "agent" &&
    entries.some((e) => e.name === "config.json") &&
    main !== "config.json" &&
    !/\.json$/i.test(main)
  ) {
    demand(
      entries.find((e) => e.name === "config.json").isFile(),
      400,
      "IMPORT_SYMLINK",
      "config.json 必须是实际文件",
    );
    files.push(
      await localFile(join(root, "config.json"), "config.json", budget),
    );
  }
  return importResourceFiles(type, files, basename(root));
}
export function parseGithubImportUrl(value) {
  demand(
    typeof value === "string" && value.length <= 2048,
    400,
    "INVALID_GITHUB_URL",
    "GitHub 地址过长",
  );
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw Error("GitHub 地址编码无效");
  }
  demand(
    !/(^|\/)\.{1,2}(\/|$)/.test(decoded),
    400,
    "INVALID_GITHUB_URL",
    "GitHub 地址不能包含父目录路径",
  );
  let url;
  try {
    url = new URL(
      value.startsWith("github:")
        ? "https://github.com/" + value.slice(7)
        : value,
    );
  } catch {
    throw Error("请输入公开 GitHub 仓库、文件夹或文件地址");
  }
  demand(
    url.protocol === "https:" &&
      ["github.com", "www.github.com", "raw.githubusercontent.com"].includes(
        url.hostname,
      ) &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.search &&
      !url.hash,
    400,
    "INVALID_GITHUB_URL",
    "仅支持标准公开 GitHub HTTPS 地址，请移除查询参数和锚点",
  );
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((p) => decodeURIComponent(p));
  const owner = parts[0],
    repo = parts[1]?.replace(/\.git$/, "");
  demand(
    owner &&
      repo &&
      /^[A-Za-z0-9_.-]+$/.test(owner) &&
      /^[A-Za-z0-9_.-]+$/.test(repo) &&
      ![".", ".."].includes(owner) &&
      ![".", ".."].includes(repo) &&
      parts.length <= 24 &&
      parts.every((p) => !/[\\/\x00-\x1f]/.test(p) && p !== "." && p !== ".."),
    400,
    "INVALID_GITHUB_URL",
    "GitHub 地址格式无效",
  );
  const raw = url.hostname === "raw.githubusercontent.com";
  demand(
    parts.length === 2 ||
      (raw && parts.length >= 4) ||
      (["tree", "blob"].includes(parts[2]) && parts.length >= 4),
    400,
    "INVALID_GITHUB_URL",
    "请选择仓库、tree 文件夹或 blob 文件链接",
  );
  return { owner, repo, tail: raw ? parts.slice(2) : parts.slice(3) };
}
export async function importGithubResource(
  input,
  { fetch: request = globalThis.fetch } = {},
) {
  const type = selectedType(input.type),
    { owner, repo, tail } = parseGithubImportUrl(String(input.url || ""));
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const signal = AbortSignal.timeout(25000);
  let requests = 0,
    total = 0;
  const get = async (path, notFound = false) => {
    demand(
      ++requests <= 220,
      413,
      "IMPORT_TOO_MANY",
      "GitHub 目录过大，请选择更具体的资源目录",
    );
    let response;
    try {
      response = await request(base + path, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "DSH-Gallery",
        },
        redirect: "error",
        signal,
      });
    } catch {
      throw Error(
        signal.aborted
          ? "GitHub 读取超时，请选择更具体的目录后重试"
          : "GitHub 连接失败，请检查 DSH 主机的网络连接",
      );
    }
    if (response.status === 404 && notFound) {
      await response.body?.cancel();
      return null;
    }
    demand(
      response.ok,
      response.status,
      "GITHUB_IMPORT_FAILED",
      response.status === 403 || response.status === 429
        ? "GitHub 请求受限，请稍后重试"
        : response.status === 404
          ? "仓库或文件不存在，目前仅支持公开 GitHub 仓库"
          : "无法读取 GitHub，请检查公开地址及网络连接",
    );
    const reader = response.body.getReader(),
      chunks = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        demand(
          size <= 8 * 1024 * 1024,
          413,
          "IMPORT_TOO_LARGE",
          "GitHub 响应过大，请选择单个资源目录",
        );
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  };
  const contents = (path, ref, missing = false) =>
    get(
      `/contents${path ? "/" + path.split("/").map(encodeURIComponent).join("/") : ""}?ref=${encodeURIComponent(ref)}`,
      missing,
    );
  let ref,
    path = "",
    data;
  if (!tail.length) {
    const info = await get("");
    ref = info.default_branch;
    data = await contents("", ref);
  } else
    for (let i = 1; i <= tail.length; i++) {
      ref = tail.slice(0, i).join("/");
      path = tail.slice(i).join("/");
      data = await contents(path, ref, true);
      if (data) break;
    }
  demand(
    data,
    404,
    "GITHUB_IMPORT_FAILED",
    "无法定位分支或路径，请使用具体资源文件夹或 Markdown 链接",
  );
  let entries = Array.isArray(data) ? data : null,
    main = entries?.find(
      (e) => e.name === (type === "skill" ? "SKILL.md" : "AGENT.md"),
    );
  if (entries && !main && type === "agent") {
    const docs = entries.filter(
      (e) => e.type === "file" && /\.md$/i.test(e.name),
    );
    if (docs.length === 1) main = docs[0];
  }
  if (!entries) {
    main = data;
    path = main.path.includes("/")
      ? main.path.slice(0, main.path.lastIndexOf("/"))
      : "";
  }
  demand(
    main && main.type === "file" && /\.(md|json)$/i.test(main.name),
    400,
    "IMPORT_MAIN_MISSING",
    `目录内未找到 ${type === "skill" ? "SKILL.md" : "AGENT.md 或唯一 Markdown"}。多资源仓库请使用具体文件夹或文件链接`,
  );
  const files = [];
  const read = async (entry, name) => {
    demand(
      files.length < 100 &&
        entry.size <= IMPORT_LIMIT - total &&
        /^[a-f0-9]{40,64}$/i.test(entry.sha),
      413,
      "IMPORT_TOO_LARGE",
      "文件数量、大小或 GitHub 文件信息无效",
    );
    const blob = await get(`/git/blobs/${entry.sha}`);
    demand(
      blob.encoding === "base64" && typeof blob.content === "string",
      400,
      "INVALID_IMPORT",
      "GitHub 文件内容无法读取",
    );
    const bytes = Buffer.from(blob.content.replace(/\s/g, ""), "base64");
    total += bytes.length;
    demand(
      total <= IMPORT_LIMIT,
      413,
      "IMPORT_TOO_LARGE",
      "资源总大小不能超过 5 MiB",
    );
    files.push(decodeFile(name, bytes));
  };
  await read(main, main.name);
  if (!/\.json$/i.test(main.name)) {
    entries ||= await contents(path, ref);
    const walk = async (list, prefix, depth = 0) => {
      demand(
        Array.isArray(list) && depth <= 20,
        400,
        "INVALID_IMPORT",
        "GitHub 附属目录无效或层级过深",
      );
      for (const entry of list) {
        if (entry.name.startsWith(".")) continue;
        if (entry.type === "dir")
          await walk(
            await contents(entry.path, ref),
            `${prefix}/${entry.name}`,
            depth + 1,
          );
        else if (entry.type === "file")
          await read(entry, `${prefix}/${entry.name}`);
        else throw Error("不支持导入 GitHub 符号链接或子模块");
      }
    };
    for (const folder of type === "skill"
      ? ["references", "scripts", "assets"]
      : ["references", "assets"]) {
      const entry = entries.find((e) => e.name === folder);
      if (entry) {
        demand(
          entry.type === "dir",
          400,
          "INVALID_IMPORT",
          "附属路径必须是目录",
        );
        await walk(await contents(entry.path, ref), folder);
      }
    }
    if (type === "agent") {
      const config = entries.find((e) => e.name === "config.json");
      if (config) await read(config, "config.json");
    }
  }
  return importResourceFiles(type, files, repo);
}
export async function importResource(ctx, input) {
  const result =
    input.source === "workspace"
      ? await localImport(ctx, input)
      : input.source === "github"
        ? await importGithubResource(input)
        : null;
  demand(result, 400, "INVALID_IMPORT", "请选择工作区或 GitHub 来源");
  return { ...result, resource: normalizeResource(result.resource) };
}
