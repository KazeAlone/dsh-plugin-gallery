import { demand } from "./model.mjs";
export function validateMcpConfig(input) {
  demand(
    input && typeof input === "object",
    400,
    "INVALID_MCP",
    "MCP 配置无效",
  );
  const serverName = input.serverName;
  demand(
    typeof serverName === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(serverName),
    400,
    "INVALID_MCP_NAME",
    "服务器名称须为 1–32 位字母、数字、下划线或连字符",
  );
  demand(
    ["stdio", "streamable-http"].includes(input.transport),
    400,
    "INVALID_TRANSPORT",
    "连接方式须为 stdio 或 streamable-http",
  );
  const envRefs = input.envRefs || {};
  demand(
    envRefs && typeof envRefs === "object" && !Array.isArray(envRefs),
    400,
    "INVALID_ENV_REFS",
    "环境变量引用无效",
  );
  for (const [key, value] of Object.entries(envRefs))
    demand(
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) &&
        typeof value === "string" &&
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(value),
      400,
      "INVALID_ENV_REFS",
      "环境变量引用只能填写变量名",
    );
  if (input.transport === "stdio") {
    demand(
      typeof input.command === "string" &&
        input.command.trim() &&
        input.command.length <= 500,
      400,
      "INVALID_COMMAND",
      "请输入本地服务启动命令",
    );
    demand(
      Array.isArray(input.args) &&
        input.args.length <= 64 &&
        input.args.every((x) => typeof x === "string" && x.length <= 1000),
      400,
      "INVALID_ARGS",
      "启动参数无效",
    );
    demand(
      !input.cwd || (typeof input.cwd === "string" && input.cwd.length <= 1000),
      400,
      "INVALID_CWD",
      "工作目录无效",
    );
    return {
      serverName,
      transport: "stdio",
      command: input.command.trim(),
      args: input.args,
      cwd: input.cwd || "",
      envRefs,
    };
  }
  let url;
  try {
    url = new URL(input.url);
  } catch {}
  demand(
    url &&
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.hash,
    400,
    "INVALID_URL",
    "请输入有效的 HTTP MCP 端点",
  );
  return { serverName, transport: "streamable-http", url: url.href, envRefs };
}
export function resolveMcpConfig(config, environment = process.env) {
  const safe = validateMcpConfig(config),
    values = {};
  for (const [key, source] of Object.entries(safe.envRefs)) {
    demand(
      typeof environment[source] === "string" && environment[source].length > 0,
      400,
      "MISSING_ENV",
      `宿主缺少环境变量 ${source}`,
    );
    values[key] = environment[source];
  }
  return safe.transport === "stdio"
    ? { ...safe, env: values }
    : { ...safe, headers: values };
}
