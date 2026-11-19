/** Verify through TeamFlow's authenticated API after the host has persisted the template. */
export async function verifyTeamflowRegistration(result, fetcher = fetch) {
  const directory = result.directory || "~/.dsh-teamflow/templates";
  const prefix = `模板文件已写入 ${directory}，`;
  let response, body;
  try {
    response = await fetcher("/plugins/dsh-agent-teams/workflow", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "template_list" }),
      signal: AbortSignal.timeout(15000),
    });
    body = await response.json();
  } catch {
    throw new Error(
      prefix +
        "但无法确认 TeamFlow 是否已载入，请检查插件状态后重新打开模板库；不要连续重复注册。",
    );
  }
  if (!response.ok || !Array.isArray(body?.templates))
    throw new Error(
      prefix +
        "但 TeamFlow 模板接口不可用：" +
        (typeof body?.error === "string"
          ? body.error
          : `HTTP ${response.status}`),
    );
  const template = body.templates.find(
    (item) =>
      item?.id === result.id &&
      Number.isSafeInteger(item.version) &&
      item.version >= result.version,
  );
  if (template) return { ...result, verified: true };
  const rejected = (Array.isArray(body.warnings) ? body.warnings : []).find(
    (w) => typeof w === "string" && w.includes(`${result.id}.json`),
  );
  if (rejected)
    throw new Error(prefix + "但 TeamFlow 拒绝读取此模板：" + rejected);
  throw new Error(
    prefix +
      "但当前 TeamFlow 模板库中未找到它。请确认两个插件运行在同一 DSH 实例，并检查 TeamFlow 模板目录。",
  );
}
