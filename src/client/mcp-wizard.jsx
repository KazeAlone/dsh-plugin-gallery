import { ResourceCoverPicker, withResourceCover } from "./resource-cover.jsx";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
const steps = ["基本信息", "连接方式", "检查连接", "检查保存"];
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
    [serverName, setServerName] = useState(saved.serverName || ""),
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
    [tags, setTags] = useState((resource?.tags || []).join(", ")),
    [testResult, setTestResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const validName = !!name.trim() && name.length <= 160 && !!description.trim();
  const validServer = /^[A-Za-z0-9_-]{1,32}$/.test(serverName);
  const validConnection =
    validServer &&
    (transport === "stdio"
      ? !!command.trim()
      : /^https?:\/\/[^\s/]+/.test(url));
  function config() {
    return {
      serverName,
      transport,
      ...(transport === "stdio"
        ? { command, args: parseLines(args), cwd, envRefs: parseRefs(envRefs) }
        : { url, envRefs: parseRefs(envRefs) }),
    };
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
      setTestResult(await onCheck(config()));
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
        name: name.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: { ...withResourceCover(resource?.metadata, cover), mcp: data },
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
        <nav className="gal-skill-steps" aria-label="创建进度">
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
              <div className="gal-skill-fields">
                <label>
                  显示名称
                  <input
                    aria-label="显示名称"
                    value={name}
                    maxLength={160}
                    placeholder="文件系统服务"
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  简介
                  <textarea
                    aria-label="简介"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="这个 MCP 服务提供什么能力"
                  />
                </label>
                <label>
                  服务器名称
                  <input
                    aria-label="服务器名称"
                    value={serverName}
                    maxLength={32}
                    placeholder="filesystem"
                    onChange={(e) => setServerName(e.target.value)}
                  />
                </label>
                <p>1–32 位字母、数字、下划线或连字符；作为工具名称前缀。</p>
              </div>
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
                  每行填写「服务字段=DSH
                  环境变量名」。资源中只保存变量名，不保存密钥。
                </p>
              </div>
            )}
            {step === 2 && (
              <div className="gal-skill-fields">
                <p>
                  连接测试会尝试启动或访问该服务，并读取它提供的工具。完成后会断开测试连接。
                </p>
                <button className="gal-primary" disabled={busy} onClick={check}>
                  <Glyph name="refresh" />
                  {busy ? "检查中…" : "检查连接"}
                </button>
                {testResult && (
                  <div className="gal-mcp-result" role="status">
                    <strong>
                      ✓ 连接成功 · {testResult.tools.length} 个工具
                    </strong>
                    {testResult.tools.map((tool) => (
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
            {step === 3 && (
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
                  resource={{ type: "mcp", name, description, tags: tags.split(/[,，]/), cover }}
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
                  {testResult ? "✓ 已通过连接测试" : "未验证连接，可以保存配置"}
                </p>
                <details>
                  <summary>查看 mcp.json</summary>
                  <pre className="gal-skill-preview">
                    {(() => {
                      try {
                        return JSON.stringify(config(), null, 2);
                      } catch {
                        return "请检查环境变量映射格式";
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
          {step < 3 ? (
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
