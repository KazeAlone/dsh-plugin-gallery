import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readdir, lstat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { demand } from "./model.mjs";
import {
  IMPORT_LIMIT,
  importResourceFiles,
} from "./client/resource-import.mjs";

export function parseGitImportAddress(value) {
  demand(
    typeof value === "string" &&
      value.length > 0 &&
      value.length <= 2048 &&
      !/[\x00-\x20\x7f]/.test(value),
    400,
    "INVALID_GIT_URL",
    "请输入有效 Git 仓库地址，不包含空格或控制字符",
  );
  if (value.startsWith("github:"))
    value = "https://github.com/" + value.slice(7);
  const scp = value.match(
    /^([A-Za-z0-9_][A-Za-z0-9_.-]*)@([A-Za-z0-9_][A-Za-z0-9_.-]*):([A-Za-z0-9_~][A-Za-z0-9._~/-]*)$/,
  );
  if (scp) {
    demand(
      scp[3].split("/").every((p) => p && p !== "." && p !== ".."),
      400,
      "INVALID_GIT_URL",
      "Git 地址路径无效",
    );
    return { remote: value, tail: [] };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Error("请输入 HTTPS、SSH 或 git@host:owner/repo.git 仓库地址");
  }
  demand(
    ["http:", "https:", "ssh:", "git:"].includes(url.protocol) &&
      !url.password &&
      !url.search &&
      !url.hash &&
      !url.hostname.startsWith("-") &&
      (url.protocol === "ssh:"
        ? !url.username || /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(url.username)
        : !url.username),
    400,
    "INVALID_GIT_URL",
    "仅支持 HTTP/HTTPS、SSH、git 仓库地址；请勿在链接中填写密码或令牌",
  );
  const rawPath = value.slice(value.indexOf("://") + 3).replace(/^[^/]+/, "");
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    throw Error("Git 地址编码无效");
  }
  demand(
    !/[\\\x00-\x1f]/.test(decoded) && !/(^|\/)\.{1,2}(\/|$)/.test(decoded),
    400,
    "INVALID_GIT_URL",
    "Git 地址不能包含父目录路径",
  );
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((p) => decodeURIComponent(p));
  demand(
    parts.length >= 1 &&
      parts.every((p) => !/[\\/\x00-\x1f]/.test(p) && p !== "." && p !== ".."),
    400,
    "INVALID_GIT_URL",
    "Git 仓库路径无效",
  );
  if (url.hostname === "raw.githubusercontent.com") {
    demand(parts.length >= 4, 400, "INVALID_GIT_URL", "原始文件链接格式无效");
    return {
      remote: `https://github.com/${parts[0]}/${parts[1]}.git`,
      tail: parts.slice(2),
    };
  }
  const marker = ["https:", "http:"].includes(url.protocol)
    ? parts.findIndex((p, i) => i >= 2 && ["tree", "blob", "raw"].includes(p))
    : -1;
  if (marker >= 0) {
    demand(
      parts.length > marker + 1,
      400,
      "INVALID_GIT_URL",
      "文件或目录链接缺少分支，请使用完整链接",
    );
    const repository = parts.slice(
      0,
      parts[marker - 1] === "-" ? marker - 1 : marker,
    );
    return {
      remote: `${url.origin}/${repository.map(encodeURIComponent).join("/")}${repository.at(-1).endsWith(".git") ? "" : ".git"}`,
      tail: parts.slice(marker + 1),
    };
  }
  return { remote: url.href.replace(/\/$/, ""), tail: [] };
}
const safeRef = (ref) =>
  typeof ref === "string" &&
  ref.length <= 256 &&
  !ref.startsWith("-") &&
  !/[\x00-\x20\x7f~^:?*\[\\]/.test(ref) &&
  !ref.includes("..") &&
  !ref.includes("@{");
function safeResourcePath(value) {
  demand(
    typeof value === "string" &&
      value.length <= 1000 &&
      !/^[\\/]|^[a-z]:|[\\\x00-\x1f:]/i.test(value) &&
      (!value || value.split("/").every((p) => p && p !== "." && p !== "..")),
    400,
    "INVALID_GIT_PATH",
    "资源路径须为仓库内的相对路径",
  );
  return value;
}
function gitFailure(stderr) {
  if (
    /authentication|could not read username|permission denied|publickey|credential/i.test(
      stderr,
    )
  )
    return Error(
      "DSH 主机 Git 认证失败，请确认运行 DSH 的系统账号能够免交互读取此仓库",
    );
  if (/host key verification|host key has changed/i.test(stderr))
    return Error("SSH 主机验证失败，请先在运行 DSH 的账号下完成主机信任配置");
  if (/certificate|SSL|TLS/i.test(stderr))
    return Error("Git 证书验证失败，请配置 DSH 主机的企业 CA 信任后重试");
  return Error(
    "Git 无法读取仓库，请检查地址、分支、网络和运行 DSH 账号的 Git 配置",
  );
}
async function directorySize(path) {
  let bytes = 0;
  for (const entry of await readdir(path, { withFileTypes: true }).catch(
    () => [],
  )) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) bytes += await directorySize(file);
    else if (entry.isFile())
      bytes += (await lstat(file).catch(() => ({ size: 0 }))).size;
    if (bytes > 128 * 1024 * 1024) break;
  }
  return bytes;
}
function gitRunner(root, environment, deadline) {
  const args = [
    "--no-pager",
    "--literal-pathspecs",
    "-c",
    `core.hooksPath=${join(root, "empty-hooks")}`,
    "-c",
    "core.fsmonitor=false",
    "-c",
    "protocol.allow=never",
    ...["https", "http", "ssh", "git"].flatMap((p) => [
      "-c",
      `protocol.${p}.allow=always`,
    ]),
    "-c",
    "submodule.recurse=false",
    "-c",
    "gc.auto=0",
    "-c",
    "maintenance.auto=false",
    "-c",
    "credential.interactive=never",
  ];
  return (command, { limit = 1024 * 1024, allowFailure = false } = {}) =>
    new Promise((resolve, reject) => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        reject(Error("Git 读取超时，请先克隆到工作区后导入"));
        return;
      }
      const child = spawn("git", [...args, ...command], {
        cwd: root,
        env: environment,
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      });
      let bytes = 0,
        stderr = "",
        failure,
        finished = false,
        scanning = false;
      const chunks = [];
      const stop = (error) => {
        failure ||= error;
        try {
          if (process.platform !== "win32" && child.pid)
            process.kill(-child.pid, "SIGKILL");
          else child.kill("SIGKILL");
        } catch {
          /* Process already exited. */
        }
      };
      const timeout = setTimeout(
        () => stop(Error("Git 读取超时，请先克隆到工作区后导入")),
        remaining,
      );
      const monitor = setInterval(async () => {
        if (scanning || finished) return;
        scanning = true;
        try {
          if ((await directorySize(root)) > 128 * 1024 * 1024 && !finished)
            stop(Error("Git 临时下载超过 128 MiB，请先克隆到工作区后导入"));
        } catch {
          /* Retry on the next tick. */
        } finally {
          scanning = false;
        }
      }, 500);
      child.stdout.on("data", (data) => {
        bytes += data.length;
        if (bytes > limit)
          stop(Error("Git 输出或资源大小超限，请选择更具体的资源目录"));
        else chunks.push(data);
      });
      child.stderr.on("data", (data) => {
        if (stderr.length < 65536)
          stderr += data.toString().slice(0, 65536 - stderr.length);
      });
      child.on("error", (error) => {
        finished = true;
        clearTimeout(timeout);
        clearInterval(monitor);
        reject(
          error.code === "ENOENT"
            ? Error("DSH 主机未安装 Git，请先安装 Git")
            : Error("无法启动 DSH 主机 Git"),
        );
      });
      child.on("close", (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        clearInterval(monitor);
        if (failure) reject(failure);
        else if (code && !allowFailure) reject(gitFailure(stderr));
        else resolve({ code, stdout: Buffer.concat(chunks) });
      });
    });
}
function treeEntries(buffer) {
  return buffer
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(
        /^(\d+) (blob|tree|commit) ([a-f0-9]{40,64})\t([\s\S]+)$/,
      );
      demand(match, 400, "INVALID_GIT_TREE", "Git 文件树格式无效");
      return { mode: match[1], type: match[2], sha: match[3], name: match[4] };
    });
}
export async function importGitResource(input) {
  demand(
    ["skill", "agent"].includes(input.type),
    400,
    "INVALID_IMPORT",
    "仅支持 Skill 和 Agent",
  );
  const parsed = parseGitImportAddress(String(input.url || "").trim());
  const requestedRef = String(input.gitRef || "").trim(),
    requestedPath = String(input.gitPath || "").trim();
  demand(
    !requestedRef || safeRef(requestedRef),
    400,
    "INVALID_GIT_REF",
    "分支或 Tag 格式无效",
  );
  safeResourcePath(requestedPath === "." ? "" : requestedPath);
  const root = await mkdtemp(join(tmpdir(), "gallery-git-import-"));
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "Never",
    GIT_PAGER: "cat",
    GIT_OPTIONAL_LOCKS: "0",
    SSH_ASKPASS_REQUIRE: "never",
  };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_COMMON_DIR",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
    "GIT_INDEX_FILE",
    "GIT_PREFIX",
    "GIT_NAMESPACE",
    "GIT_SHALLOW_FILE",
  ])
    delete env[key];
  const git = gitRunner(root, env, Date.now() + 90000),
    repo = join(root, "repo");
  try {
    await mkdir(join(root, "empty-hooks"));
    if (!env.GIT_SSH_COMMAND && !env.GIT_SSH) {
      const setting = await git(["config", "--get", "core.sshCommand"], {
        allowFailure: true,
        limit: 8192,
      });
      env.GIT_SSH_COMMAND = `${setting.stdout.toString().trim() || "ssh"} -o BatchMode=yes`;
    }
    let ref = requestedRef || "HEAD",
      path = requestedPath === "." ? "" : requestedPath;
    if (parsed.tail.length) {
      const listing = await git(
        ["ls-remote", "--heads", "--tags", "--refs", parsed.remote],
        { limit: 2 * 1024 * 1024 },
      );
      const names = listing.stdout
        .toString()
        .split("\n")
        .map((line) => line.split("\t")[1])
        .filter(Boolean)
        .map((name) => name.replace(/^refs\/(heads|tags)\//, ""));
      const match = names
        .filter(
          (name) =>
            parsed.tail.join("/") === name ||
            parsed.tail.join("/").startsWith(name + "/"),
        )
        .sort((a, b) => b.length - a.length)[0];
      demand(
        match || /^[a-f0-9]{40,64}$/i.test(parsed.tail[0]),
        400,
        "INVALID_GIT_REF",
        "无法从链接识别分支，请填写仓库地址并单独指定分支和资源路径",
      );
      const fromUrl = match || parsed.tail[0];
      ref = requestedRef || fromUrl;
      if (!requestedPath)
        path = parsed.tail.slice(fromUrl.split("/").length).join("/");
    }
    demand(safeRef(ref), 400, "INVALID_GIT_REF", "分支或 Tag 无效");
    safeResourcePath(path);
    await git(["init", "--bare", "--quiet", "--template=", repo]);
    await git(["--git-dir", repo, "remote", "add", "origin", parsed.remote]);
    await git([
      "--git-dir",
      repo,
      "fetch",
      "--quiet",
      "--depth=1",
      "--filter=blob:none",
      "--no-tags",
      "origin",
      ref,
    ]);
    demand(
      (await directorySize(root)) <= 128 * 1024 * 1024,
      413,
      "GIT_DOWNLOAD_LIMIT",
      "Git 临时下载超过 128 MiB，请先克隆到工作区后导入",
    );
    const list = async (dir, recursive = false) =>
      treeEntries(
        (
          await git([
            "--git-dir",
            repo,
            "ls-tree",
            ...(recursive ? ["-r"] : []),
            "-z",
            `FETCH_HEAD${dir ? ":" + dir : ""}`,
          ])
        ).stdout,
      );
    let parent = path,
      selected;
    if (path) {
      const target = treeEntries(
        (
          await git([
            "--git-dir",
            repo,
            "ls-tree",
            "-z",
            "FETCH_HEAD",
            "--",
            path,
          ])
        ).stdout,
      );
      demand(
        target.length === 1,
        400,
        "IMPORT_MAIN_MISSING",
        "仓库中未找到此资源路径",
      );
      selected = target[0];
      if (selected.type === "blob") {
        demand(
          ["100644", "100755"].includes(selected.mode) &&
            /\.(md|json)$/i.test(path),
          400,
          "INVALID_GIT_PATH",
          "请选择 Markdown / Gallery JSON 文件或资源目录，不支持符号链接",
        );
        parent = posix.dirname(path);
        if (parent === ".") parent = "";
      } else
        demand(
          selected.type === "tree",
          400,
          "INVALID_GIT_PATH",
          "不支持导入子模块或符号链接",
        );
    }
    const entries = await list(parent),
      canonical = input.type === "skill" ? "SKILL.md" : "AGENT.md";
    let main =
      selected?.type === "blob"
        ? { ...selected, name: posix.basename(path) }
        : entries.find((e) => e.name === canonical);
    if (!main && input.type === "agent") {
      const docs = entries.filter(
        (e) => e.type === "blob" && /\.md$/i.test(e.name),
      );
      if (docs.length === 1) main = docs[0];
    }
    demand(
      main && main.type === "blob" && ["100644", "100755"].includes(main.mode),
      400,
      "IMPORT_MAIN_MISSING",
      `未找到 ${canonical}，请在资源路径中指定单个资源目录或 Markdown 文件`,
    );
    const files = [];
    let bytes = 0;
    const read = async (entry, name) => {
      demand(
        files.length < 100 &&
          entry.type === "blob" &&
          ["100644", "100755"].includes(entry.mode),
        400,
        "INVALID_GIT_FILE",
        "资源包含过多文件、符号链接或子模块",
      );
      const size = Number(
        (
          await git(["--git-dir", repo, "cat-file", "-s", entry.sha], {
            limit: 64,
          })
        ).stdout.toString(),
      );
      demand(
        Number.isSafeInteger(size) && size + bytes <= IMPORT_LIMIT,
        413,
        "IMPORT_TOO_LARGE",
        "资源文件总大小不能超过 5 MiB",
      );
      const buffer = (
        await git(["--git-dir", repo, "cat-file", "blob", entry.sha], {
          limit: IMPORT_LIMIT - bytes,
        })
      ).stdout;
      bytes += buffer.length;
      let content,
        encoding = "utf8";
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        if (content.includes("\0")) throw Error();
      } catch {
        encoding = "base64";
        content = buffer.toString("base64");
      }
      files.push({ path: name, encoding, content });
    };
    await read(main, main.name);
    if (!/\.json$/i.test(main.name)) {
      for (const folder of input.type === "skill"
        ? ["references", "scripts", "assets"]
        : ["references", "assets"]) {
        const entry = entries.find((e) => e.name === folder);
        if (!entry) continue;
        demand(
          entry.type === "tree",
          400,
          "INVALID_GIT_FILE",
          "附属目录不能是符号链接或子模块",
        );
        for (const file of await list(
          [parent, folder].filter(Boolean).join("/"),
          true,
        )) {
          if (file.name.split("/").some((p) => p.startsWith("."))) continue;
          await read(file, `${folder}/${file.name}`);
        }
      }
      if (input.type === "agent") {
        const config = entries.find((e) => e.name === "config.json");
        if (config) await read(config, "config.json");
      }
    }
    return importResourceFiles(
      input.type,
      files,
      parsed.remote
        .split("/")
        .at(-1)
        .replace(/\.git$/, ""),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
