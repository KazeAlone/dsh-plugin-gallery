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
      (input.transport === "streamable-http"
        ? /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(key)
        : /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) &&
        typeof value === "string" &&
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(value),
      400,
      "INVALID_ENV_REFS",
      "环境变量引用只能填写变量名",
    );
  const credentialKeys = input.credentialKeys ?? [];
  demand(
    Array.isArray(credentialKeys) &&
      credentialKeys.length <= 32 &&
      credentialKeys.every(
        (key) =>
          typeof key === "string" &&
          key.length <= 128 &&
          (input.transport === "streamable-http"
            ? /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(key)
            : /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)),
      ),
    400,
    "INVALID_MCP_CREDENTIALS",
    "认证字段名称无效",
  );
  const identity = (key) =>
    input.transport === "streamable-http" ? key.toLowerCase() : key;
  const names = [...Object.keys(envRefs), ...credentialKeys].map(identity);
  demand(
    new Set(names).size === names.length,
    400,
    "INVALID_MCP_CREDENTIALS",
    "认证字段不能重复或同时引用环境变量",
  );
  demand(
    input.authType === undefined ||
      (input.transport === "streamable-http" &&
        ["none", "bearer", "headers"].includes(input.authType)),
    400,
    "INVALID_MCP_CREDENTIALS",
    "认证方式无效",
  );
  const credentials = {
    ...(credentialKeys.length ? { credentialKeys } : {}),
    ...(input.authType ? { authType: input.authType } : {}),
  };
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
      ...credentials,
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
  return {
    serverName,
    transport: "streamable-http",
    url: url.href,
    envRefs,
    ...credentials,
  };
}
/** Merge write-only UI values with saved values, keeping only configured fields. */
export function mergeMcpCredentials(config, patch = {}, previous = {}) {
  const safe = validateMcpConfig(config);
  demand(
    patch &&
      typeof patch === "object" &&
      !Array.isArray(patch) &&
      Object.keys(patch).length <= 32,
    400,
    "INVALID_MCP_CREDENTIALS",
    "认证信息格式无效",
  );
  const keys = safe.credentialKeys || [];
  demand(
    Object.keys(patch).every((key) => keys.includes(key)),
    400,
    "INVALID_MCP_CREDENTIALS",
    "认证值必须对应已配置的字段",
  );
  const result = keys.map((key) => {
    const value = Object.hasOwn(patch, key)
      ? patch[key]
      : Object.hasOwn(previous, key)
        ? previous[key]
        : undefined;
    demand(
      typeof value === "string" &&
        value.length > 0 &&
        value.length <= 8192 &&
        !value.includes("\0") &&
        (safe.transport !== "streamable-http" || !/[\r\n]/.test(value)),
      400,
      "MISSING_MCP_CREDENTIAL",
      `请填写认证字段 ${key} 的值`,
    );
    return [key, value];
  });
  return Object.fromEntries(result);
}
export function redactMcpError(error, values = {}) {
  let message = error?.message || String(error);
  const secrets = Object.values(values).flatMap((value) => [
    value,
    value.replace(/^Bearer\s+/i, ""),
  ]);
  for (const value of [...new Set(secrets)].sort(
    (a, b) => b.length - a.length,
  )) {
    if (value) message = message.split(value).join("[已隐藏]");
  }
  return message;
}
export function resolveMcpConfig(
  config,
  environment = process.env,
  credentials = {},
) {
  const safe = validateMcpConfig(config),
    values = new Map();
  for (const [key, source] of Object.entries(safe.envRefs)) {
    demand(
      typeof environment[source] === "string" && environment[source].length > 0,
      400,
      "MISSING_ENV",
      `宿主缺少环境变量 ${source}`,
    );
    values.set(key, environment[source]);
  }
  for (const [key, value] of Object.entries(
    mergeMcpCredentials(safe, {}, credentials),
  ))
    values.set(key, value);
  const resolved = Object.fromEntries(values);
  return safe.transport === "stdio"
    ? { ...safe, env: resolved }
    : { ...safe, headers: resolved };
}
