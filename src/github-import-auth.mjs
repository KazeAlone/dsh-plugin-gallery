import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { demand } from "./model.mjs";

export function githubToken(value) {
  if (value === undefined || value === "") return "";
  demand(
    typeof value === "string" &&
      value.length <= 8192 &&
      !/[\r\n\0]/.test(value),
    400,
    "INVALID_GITHUB_TOKEN",
    "访问令牌格式无效",
  );
  const token = value.trim().replace(/^(?:Bearer|token)\s+/i, "");
  demand(token.length > 0, 400, "INVALID_GITHUB_TOKEN", "请填写实际的访问令牌");
  return token;
}
/** Host-only, write-only credentials, scoped to the complete normalized API root. */
export class GithubImportAuth {
  constructor(path) {
    this.path = path;
  }
  key(apiBaseUrl) {
    return createHash("sha256").update(apiBaseUrl).digest("hex");
  }
  read() {
    let data;
    try {
      data = JSON.parse(readFileSync(this.path, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return { format: 1, tokens: {} };
      throw Error("GitHub 认证存储无法读取，请检查主机文件");
    }
    demand(
      data?.format === 1 &&
        data.tokens &&
        typeof data.tokens === "object" &&
        !Array.isArray(data.tokens),
      500,
      "INVALID_GITHUB_AUTH",
      "GitHub 认证存储格式无效",
    );
    return data;
  }
  get(apiBaseUrl) {
    return githubToken(this.read().tokens[this.key(apiBaseUrl)]);
  }
  status(apiBaseUrl) {
    return { apiBaseUrl, hasToken: !!this.get(apiBaseUrl) };
  }
  set(apiBaseUrl, value) {
    const token = githubToken(value);
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
    const lock = this.path + ".lock",
      temp = this.path + "." + randomUUID();
    try {
      mkdirSync(lock);
    } catch (e) {
      if (e.code === "EEXIST") throw Error("GitHub 认证正在更新，请重试");
      throw e;
    }
    try {
      const data = this.read(),
        key = this.key(apiBaseUrl);
      if (token) data.tokens[key] = token;
      else delete data.tokens[key];
      writeFileSync(temp, JSON.stringify(data) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
      renameSync(temp, this.path);
      return this.status(apiBaseUrl);
    } finally {
      rmSync(temp, { force: true });
      rmSync(lock, { recursive: true, force: true });
    }
  }
}
