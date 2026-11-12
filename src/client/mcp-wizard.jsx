import { createResourceIdentifier } from "./resource-id.mjs";
import { ResourceBasics } from "./resource-basics.jsx";
import { ResourceCoverPicker, withResourceCover } from "./resource-cover.jsx";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
const steps = ["基本信息", "连接配置与测试", "检查保存"];
const parseLines = (value) =>
  value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const parseRefs = (value) =>
  Object.fromEntries(
    parseLines(value).map((line) => {
      const index = line.indexOf("=");
      if (index < 1) throw Error("环境变量映射每行填写 KEY=环境变量名");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
  );
export function McpWizard({ resource, onClose, onSave, onCheck }) {
  const [cover, setCover] = useState(resource?.metadata?.cover ?? "");
  const saved = resource?.metadata?.mcp || {};
  const [step, setStep] = useState(0),
    [name, setName] = useState(resource?.name || ""),
    [description, setDescription] = useState(resource?.description || ""),
    [serverName, setServerName] = useState(
      () => saved.serverName || createResourceIdentifier("mcp"),
    ),
    [transport, setTransport] = useState(saved.transport || "stdio"),
    [command, setCommand] = useState(saved.command || ""),
    [args, setArgs] = useState((saved.args || []).join("\n")),
    [cwd, setCwd] = useState(saved.cwd || ""),
    [url, setUrl] = useState(saved.url || ""),
    [envRefs, setEnvRefs] = useState(
      Object.entries(saved.envRefs || {})
        .map(([a, b]) => `${a}=${b}`)
        .join("\n"),
    ),
    [credentialMode, setCredentialMode] = useState(
      Object.keys(saved.envRefs || {}).length && !saved.credentialKeys?.length
        ? "environment"
        : "direct",
    ),
    [authType, setAuthType] = useState(
      saved.authType || (saved.credentialKeys?.length ? "headers" : "none"),
    ),
    [token, setToken] = useState(""),
    [entries, setEntries] = useState(() =>
      (saved.credentialKeys || [])
        .filter(
          (key) =>
            !(
              saved.authType === "bearer" &&
              key.toLowerCase() === "authorization"
            ),
        )
        .map((key) => ({
          key,
          value: "",
          saved: resource?.mcpCredentialKeys?.includes(key) || false,
        })),
    ),
    [tags, setTags] = useState((resource?.tags || []).join(", ")),
    [testResult, setTestResult] = useState(
      resource?.metadata?.mcpVerification ?? null,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const validName = !!name.trim() && name.length <= 160 && !!description.trim();
  const validServer = /^[A-Za-z0-9_-]{1,32}$/.test(serverName);
  const tokenSaved =
    resource?.mcpCredentialKeys?.includes("Authorization") || false;
  const directEntries =
    transport === "streamable-http" && authType === "none"
      ? []
      : transport === "streamable-http" && authType === "bearer"
        ? [{ key: "Authorization", value: token, saved: tokenSaved }]
        : entries.filter((entry) => entry.key.trim() || entry.value);
  const validCredentials =
    credentialMode !== "direct" ||
    (directEntries.every(
      (entry) =>
        (transport === "stdio"
          ? /^[A-Za-z_][A-Za-z0-9_]*$/.test(entry.key.trim())
          : /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(entry.key.trim())) &&
        (entry.value.trim() || entry.saved),
    ) &&
      new Set(
        directEntries.map((entry) =>
          transport === "stdio"
            ? entry.key.trim()
            : entry.key.trim().toLowerCase(),
        ),
      ).size === directEntries.length);
  const validConnection =
    validServer &&
    validCredentials &&
    (transport === "stdio"
      ? !!command.trim()
      : /^https?:\/\/[^\s/]+/.test(url));
  function credentialValues() {
    if (credentialMode !== "direct") return {};
    return Object.fromEntries(
      directEntries
        .filter((entry) => entry.value)
        .map((entry) => [
          entry.key.trim(),
          transport === "streamable-http" && authType === "bearer"
            ? `Bearer ${entry.value.trim().replace(/^Bearer\s+/i, "")}`
            : entry.value,
        ]),
    );
  }
  function config() {
    const direct = credentialMode === "direct";
    return {
      serverName,
      transport,
      envRefs: direct ? {} : parseRefs(envRefs),
      ...(direct
        ? {
            credentialKeys: directEntries.map((entry) => entry.key.trim()),
            ...(transport === "streamable-http" ? { authType } : {}),
          }
        : {}),
      ...(transport === "stdio"
        ? { command, args: parseLines(args), cwd }
        : { url }),
    };
  }
  function editEntry(index, key, value) {
    setEntries((rows) =>
      rows.map((entry, i) =>
        i === index
          ? {
              ...entry,
              [key]: value,
              ...(key === "key" ? { saved: false } : {}),
            }
          : entry,
      ),
    );
    setTestResult(null);
  }
  function change(setter) {
    return (e) => {
      setter(e.target.value);
      setTestResult(null);
    };
  }
  const parsedTags = [
    ...new Set(
      tags
        .split(/[,，]/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  async function check() {
    setBusy(true);
    setError("");
    try {
      const result = await onCheck({
        ...config(),
        credentials: credentialValues(),
        ...(resource?.id ? { resourceId: resource.id } : {}),
      });
      setTestResult({ ...result, checkedAt: new Date().toISOString() });
    } catch (e) {
      setTestResult(null);
      setError(e?.rpcError?.message || e.message || String(e));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const data = config();
      await onSave({
        type: "mcp",
        mcpCredentials: credentialValues(),
        name: name.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: {
          ...withResourceCover(resource?.metadata, cover),
          mcp: data,
          mcpVerification: testResult
            ? { checkedAt: testResult.checkedAt }
            : null,
        },
        references: resource?.references || [],
        files: [
          {
            path: "mcp.json",
            encoding: "utf8",
            content: JSON.stringify(data, null, 2) + "\n",
          },
        ],
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  return (
    <Modal onClose={() => !busy && onClose()}>
      <section
        className="gal-dialog gal-skill-wizard"
        role="dialog"
        aria-modal="true"
        aria-label={resource ? "编辑 MCP" : "新建 MCP"}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <h2>
            <Glyph name="mcp" /> {resource ? "编辑 MCP" : "新建 MCP"}
          </h2>
          <button aria-label="关闭编辑" disabled={busy} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>
        <nav className="gal-skill-steps gal-three-steps" aria-label="创建进度">
          {steps.map((title, i) => (
            <button
              key={title}
              aria-current={step === i ? "step" : undefined}
              disabled={
                busy || (i > 0 && !validName) || (i > 1 && !validConnection)
              }
              onClick={() => setStep(i)}
            >
              <span>{i < step ? "✓" : i + 1}</span>
              {title}
            </button>
          ))}
        </nav>
        <div className="gal-dialog-body gal-skill-layout">
          <main>
            <h3 ref={heading} tabIndex={-1}>
              {steps[step]}
            </h3>
            {step === 0 && (
              <ResourceBasics
                name={name}
                onName={setName}
                description={description}
                onDescription={setDescription}
                identifier={serverName}
                onIdentifier={(value) => {
                  setServerName(value);
                  setTestResult(null);
                }}
                identifierMax={32}
                busy={busy}
              />
            )}
            {step === 1 && (
              <div className="gal-skill-fields">
                <div className="gal-mcp-transport">
                  <button
                    aria-pressed={transport === "stdio"}
                    onClick={() => {
                      setTransport("stdio");
                      setTestResult(null);
                    }}
                  >
                    <Glyph name="settings" /> 本地进程
                  </button>
                  <button
                    aria-pressed={transport === "streamable-http"}
                    onClick={() => {
                      setTransport("streamable-http");
                      setTestResult(null);
                    }}
                  >
                    <Glyph name="link" /> 远程 HTTP
                  </button>
                </div>
                {transport === "stdio" ? (
                  <>
                    <label>
                      启动命令
                      <input
                        aria-label="启动命令"
                        value={command}
                        onChange={change(setCommand)}
                        placeholder="npx"
                      />
                    </label>
                    <label>
                      参数（每行一个）
                      <textarea
                        aria-label="启动参数"
                        rows={4}
                        value={args}
                        onChange={change(setArgs)}
                        placeholder="-y\n@modelcontextprotocol/server-filesystem"
                      />
                    </label>
                    <label>
                      工作目录（选填）
                      <input
                        aria-label="工作目录"
                        value={cwd}
                        onChange={change(setCwd)}
                        placeholder="留空使用 DSH 默认目录"
                      />
                    </label>
                  </>
                ) : (
                  <label>
                    Streamable HTTP 地址
                    <input
                      aria-label="MCP 地址"
                      type="url"
                      value={url}
                      onChange={change(setUrl)}
                      placeholder="https://example.com/mcp"
                    />
                  </label>
                )}
                <label>
                  认证信息
                  <select
                    aria-label="认证填写方式"
                    value={credentialMode}
                    disabled={busy}
                    onChange={change(setCredentialMode)}
                  >
                    <option value="direct">在页面填写</option>
                    <option value="environment">引用宿主环境变量</option>
                  </select>
                </label>
                {credentialMode === "environment" ? (
                  <>
                    <label>
                      {transport === "stdio" ? "环境变量映射" : "请求头映射"}
                      （选填）
                      <textarea
                        aria-label="环境变量映射"
                        rows={3}
                        value={envRefs}
                        onChange={change(setEnvRefs)}
                        placeholder={
                          transport === "stdio"
                            ? "API_KEY=MY_API_KEY"
                            : "Authorization=MCP_AUTH_HEADER"
                        }
                      />
                    </label>
                    <p>
                      每行填写「服务字段=宿主环境变量名」。Authorization
                      对应的变量值应包含 Bearer 前缀。
                    </p>
                  </>
                ) : (
                  <>
                    {transport === "streamable-http" && (
                      <label>
                        认证方式
                        <select
                          aria-label="HTTP 认证方式"
                          value={authType}
                          disabled={busy}
                          onChange={change(setAuthType)}
                        >
                          <option value="none">无需认证</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="headers">
                            自定义请求头 / API Key
                          </option>
                        </select>
                      </label>
                    )}
                    {transport === "streamable-http" &&
                    authType === "bearer" ? (
                      <label>
                        Token
                        <input
                          aria-label="Bearer Token"
                          type="password"
                          autoComplete="new-password"
                          value={token}
                          disabled={busy}
                          onChange={change(setToken)}
                          placeholder={
                            tokenSaved
                              ? "已保存，留空继续使用；填写可替换"
                              : "粘贴 Token，无需填写 Bearer 前缀"
                          }
                        />
                        {tokenSaved && (
                          <small>已保存 Token，原值不回显。</small>
                        )}
                      </label>
                    ) : (
                      (transport === "stdio" || authType === "headers") && (
                        <div className="gal-mcp-credentials">
                          <p>
                            {transport === "stdio"
                              ? "填写服务进程需要的环境变量及其实际值。"
                              : "填写请求头名称及其完整值，例如 X-API-Key。"}
                          </p>
                          {entries.map((entry, index) => (
                            <div className="gal-mcp-credential-row" key={index}>
                              <label>
                                {transport === "stdio"
                                  ? "变量名"
                                  : "请求头名称"}
                                <input
                                  aria-label={`认证字段 ${index + 1}`}
                                  autoComplete="off"
                                  value={entry.key}
                                  disabled={busy}
                                  onChange={(e) =>
                                    editEntry(index, "key", e.target.value)
                                  }
                                  placeholder={
                                    transport === "stdio"
                                      ? "API_KEY"
                                      : "X-API-Key"
                                  }
                                />
                              </label>
                              <label>
                                值
                                <input
                                  aria-label={`认证值 ${index + 1}`}
                                  type="password"
                                  autoComplete="new-password"
                                  value={entry.value}
                                  disabled={busy}
                                  onChange={(e) =>
                                    editEntry(index, "value", e.target.value)
                                  }
                                  placeholder={
                                    entry.saved
                                      ? "已保存，留空保留"
                                      : "填写实际值"
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                disabled={busy}
                                aria-label={`删除认证字段 ${index + 1}`}
                                onClick={() => {
                                  setEntries((rows) =>
                                    rows.filter((_, i) => i !== index),
                                  );
                                  setTestResult(null);
                                }}
                              >
                                <Glyph name="trash" size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={busy || entries.length >= 32}
                            onClick={() => {
                              setEntries((rows) => [
                                ...rows,
                                { key: "", value: "", saved: false },
                              ]);
                              setTestResult(null);
                            }}
                          >
                            <Glyph name="plus" size={16} />
                            添加{transport === "stdio" ? "环境变量" : "请求头"}
                          </button>
                        </div>
                      )
                    )}
                    <p>
                      认证值仅保存在当前 DSH
                      主机，不显示在资源文件、导出包和模型提示词中。编辑时留空保留已保存的值，删除字段或关闭认证将在保存后移除。
                    </p>
                  </>
                )}
                <p>
                  连接测试会尝试启动或访问该服务，并读取它提供的工具。完成后会断开测试连接。
                </p>
                <button
                  className="gal-primary"
                  disabled={busy || !validConnection}
                  onClick={check}
                >
                  <Glyph name="refresh" />
                  {busy ? "检查中…" : "检查连接"}
                </button>
                {testResult && (
                  <div className="gal-mcp-result" role="status">
                    <strong>
                      ✓ 连接成功
                      {testResult.tools &&
                        ` · ${testResult.tools.length} 个工具`}
                    </strong>
                    {testResult.tools?.map((tool) => (
                      <p key={tool.name}>
                        <Glyph name="mcp" size={15} />
                        <b>{tool.name}</b>
                        {tool.description && <span>{tool.description}</span>}
                      </p>
                    ))}
                  </div>
                )}
                <p>也可以跳过检查，保存为待验证配置。</p>
              </div>
            )}
            {step === 2 && (
              <div className="gal-skill-fields">
                <div className="gal-skill-summary">
                  <Glyph name="mcp" size={36} />
                  <h2>{name}</h2>
                  <p>{description}</p>
                  <span>
                    {serverName} ·{" "}
                    {transport === "stdio" ? "本地进程" : "远程 HTTP"}
                  </span>
                </div>
                <ResourceCoverPicker
                  resource={{
                    type: "mcp",
                    name,
                    description,
                    tags: tags.split(/[,，]/),
                    cover,
                  }}
                  onChange={setCover}
                />
                <label>
                  标签（选填）
                  <input
                    aria-label="标签"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="例如：文件，搜索"
                  />
                </label>
                <p>
                  {testResult
                    ? "✓ 已通过连接测试"
                    : "未验证 · 保存后可重新检查连接"}
                </p>
                <details>
                  <summary>查看 mcp.json</summary>
                  <pre className="gal-skill-preview">
                    {(() => {
                      try {
                        return JSON.stringify(config(), null, 2);
                      } catch {
                        return "请检查认证信息格式";
                      }
                    })()}
                  </pre>
                </details>
              </div>
            )}
            {error && (
              <p role="alert" className="gal-error">
                {error}
              </p>
            )}
          </main>
          <details open className="gal-skill-tree">
            <summary>文件结构</summary>
            <strong>
              <Glyph name="folder" /> {serverName || "my-mcp"}/
            </strong>
            <div>
              <Glyph name="file" /> mcp.json
            </div>
          </details>
        </div>
        <footer className="gal-skill-footer">
          <button
            disabled={busy}
            onClick={step ? () => setStep(step - 1) : onClose}
          >
            {step ? "上一步" : "取消"}
          </button>
          {step < 2 ? (
            <button
              className="gal-primary"
              disabled={
                busy ||
                (step === 0 && !validName) ||
                (step === 1 && !validConnection)
              }
              onClick={() => setStep(step + 1)}
            >
              下一步 <Glyph name="arrow" />
            </button>
          ) : (
            <button
              className="gal-primary"
              disabled={
                busy ||
                parsedTags.length > 20 ||
                parsedTags.some((x) => x.length > 40)
              }
              onClick={save}
            >
              {busy ? "保存中…" : "保存 MCP"}
            </button>
          )}
        </footer>
      </section>
    </Modal>
  );
}
