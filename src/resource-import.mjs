import { readdir, realpath, lstat, stat, open } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute, join, basename, dirname, parse } from "node:path";
import { homedir } from "node:os";
import {
  importResourceFiles,
  IMPORT_LIMIT,
} from "./client/resource-import.mjs";
import { normalizeResource, demand } from "./model.mjs";

function selectedType(type) {
  demand(
    ["skill", "agent"].includes(type),
    400,
    "INVALID_IMPORT",
    "仅支持 Skill 和 Agent",
  );
  return type;
}
async function withFsErrors(fn) {
  try {
    return await fn();
  } catch (error) {
    if (["EACCES", "EPERM"].includes(error.code))
      throw Error("运行 DSH 的系统账号无权读取此服务器路径");
    if (error.code === "ENOENT")
      throw Error("服务器路径不存在，请检查绝对路径");
    if (error.code === "ENOTDIR")
      throw Error("路径中的某一级不是文件夹，请检查服务器路径");
    if (error.code === "ELOOP")
      throw Error("路径包含循环符号链接，请选择实际目录");
    throw error;
  }
}
async function serverLocation(input = {}) {
  demand(
    !input.shortcut || ["root", "home", "start"].includes(input.shortcut),
    400,
    "INVALID_IMPORT_PATH",
    "目录快捷入口无效",
  );
  const path =
    input.shortcut === "root"
      ? parse(process.cwd()).root
      : input.shortcut === "home"
        ? homedir()
        : input.shortcut === "start"
          ? process.cwd()
          : (input.path ?? process.cwd());
  demand(
    typeof path === "string" &&
      path.length <= 4096 &&
      isAbsolute(path) &&
      !/[\x00-\x1f]/.test(path),
    400,
    "INVALID_IMPORT_PATH",
    "请输入服务器上的绝对路径",
  );
  return { target: await realpath(path) };
}
/** Owner-only UI browsing; the host OS account determines filesystem access. */
export async function browseServerDirectory(input = {}) {
  return withFsErrors(async () => {
    const { target } = await serverLocation(input);
    demand(
      (await stat(target)).isDirectory(),
      400,
      "INVALID_IMPORT_PATH",
      "请选择服务器文件夹",
    );
    const entries = await readdir(target, { withFileTypes: true });
    demand(
      entries.length <= 2000,
      400,
      "IMPORT_TOO_MANY",
      "目录条目过多，请输入更具体的绝对路径",
    );
    const rows = await Promise.all(
      entries.map(async (entry) => {
        const path = join(target, entry.name);
        let directory = entry.isDirectory(),
          file = entry.isFile();
        if (entry.isSymbolicLink()) {
          try {
            const info = await stat(path);
            directory = info.isDirectory();
            file = info.isFile();
          } catch {
            return null;
          }
        }
        if (!directory && !(file && /\.(md|json)$/i.test(entry.name)))
          return null;
        return {
          name: entry.name,
          path,
          directory,
          symlink: entry.isSymbolicLink(),
        };
      }),
    );
    return {
      path: target,
      parentPath: dirname(target),
      rootPath: parse(target).root,
      homePath: homedir(),
      startPath: process.cwd(),
      entries: rows
        .filter(Boolean)
        .sort(
          (a, b) =>
            Number(b.directory) - Number(a.directory) ||
            a.name.localeCompare(b.name),
        ),
    };
  });
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
async function localImport(input) {
  const { target } = await serverLocation(input),
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
export async function importResource(input) {
  demand(
    input?.source === "server",
    400,
    "INVALID_IMPORT",
    "请选择服务器目录；远程仓库导入已移除",
  );
  return withFsErrors(async () => {
    const result = await localImport(input);
    return { ...result, resource: normalizeResource(result.resource) };
  });
}
