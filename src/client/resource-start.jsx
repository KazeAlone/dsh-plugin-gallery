import React, { useState, useEffect } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
import {
  importResourceFiles,
  readBrowserResourceFiles,
} from "./resource-import.mjs";

export function ResourceStart({
  type,
  onClose,
  onBlank,
  onImported,
  onRead,
  onBrowse,
  onGithubAuth,
}) {
  const label = type === "skill" ? "Skill" : "Agent";
  const [mode, setMode] = useState("choose"),
    [source, setSource] = useState("browser"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  const [workspace, setWorkspace] = useState(null),
    [path, setPath] = useState(""),
    [url, setUrl] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [rememberToken, setRememberToken] = useState(true);
  const [authStatus, setAuthStatus] = useState(null);
  useEffect(() => {
    if (source !== "github" || !url.trim() || !onGithubAuth) return;
    let live = true;
    const timer = setTimeout(
      () =>
        onGithubAuth({ url: url.trim(), apiBaseUrl: apiBaseUrl.trim() })
          .then((value) => {
            if (live) setAuthStatus(value);
          })
          .catch(() => {
            if (live) setAuthStatus(null);
          }),
      300,
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [source, url, apiBaseUrl, onGithubAuth]);
  const clear = () => {
    setResult(null);
    setError("");
  };
  const run = async (fn) => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      await fn();
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
    } finally {
      setBusy(false);
    }
  };
  const browse = (next = "", root = workspace?.workspacePath) =>
    run(async () => {
      const value = await onBrowse({ workspacePath: root, path: next });
      setWorkspace(value);
      setPath(value.path);
    });
  const upload = (files) =>
    run(async () =>
      setResult(
        importResourceFiles(type, await readBrowserResourceFiles(files)),
      ),
    );
  return (
    <Modal onClose={() => !busy && onClose()}>
      <section
        className="gal-dialog gal-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`创建 ${label}`}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <div>
            <h2>
              <Glyph name={type} />
              {mode === "choose" ? `创建 ${label}` : `导入已有 ${label}`}
            </h2>
            <p>导入后可检查和编辑，确认保存后才加入资源库。</p>
          </div>
          <button aria-label="关闭创建" disabled={busy} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>
        <div className="gal-dialog-body">
          {mode === "choose" ? (
            <div className="gal-create-options">
              <button disabled={busy} onClick={onBlank}>
                <Glyph name="plus" size={32} />
                <strong>从零创建</strong>
                <span>填写基本信息，编写指引并添加附件。</span>
              </button>
              <button disabled={busy} onClick={() => setMode("import")}>
                <Glyph name="folder" size={32} />
                <strong>导入已有</strong>
                <span>从本机文件、DSH 工作区或 GitHub 读取。</span>
              </button>
            </div>
          ) : (
            <>
              <nav className="gal-import-tabs" aria-label="导入来源">
                {[
                  ["browser", "本机文件"],
                  ["workspace", "DSH 工作区"],
                  ["github", "GitHub 地址"],
                ].map(([key, name]) => (
                  <button
                    key={key}
                    disabled={busy}
                    aria-pressed={source === key}
                    onClick={() => {
                      setSource(key);
                      clear();
                      if (key === "workspace" && !workspace) browse();
                    }}
                  >
                    {name}
                  </button>
                ))}
              </nav>
              {source === "browser" && (
                <div className="gal-import-local">
                  <p>
                    选择一个 {label} 的 Markdown 文件、完整资源文件夹，或
                    Gallery 导出的 JSON 资源包。
                  </p>
                  <div>
                    <label className="gal-upload">
                      <Glyph name="file" />
                      选择文件
                      <input
                        type="file"
                        accept=".md,.json"
                        aria-label="导入本机文件"
                        disabled={busy}
                        onChange={(e) => {
                          upload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <label className="gal-upload">
                      <Glyph name="folder" />
                      选择文件夹
                      <input
                        type="file"
                        webkitdirectory=""
                        multiple
                        aria-label="导入本机文件夹"
                        disabled={busy}
                        onChange={(e) => {
                          upload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p>
                    文件来自当前浏览器所在的电脑；读取服务器文件请切换到 DSH
                    工作区。
                  </p>
                </div>
              )}
              {source === "workspace" && (
                <div className="gal-import-workspace">
                  <p>
                    读取 DSH
                    主机已登记的工作区（未登记时为启动目录）。可选择资源文件夹，或单个
                    Markdown / Gallery JSON 文件。
                  </p>
                  {workspace && (
                    <>
                      <label>
                        工作区
                        <select
                          aria-label="导入工作区"
                          value={workspace.workspacePath}
                          disabled={busy}
                          onChange={(e) => browse("", e.target.value)}
                        >
                          {workspace.workspaces.map((w) => (
                            <option key={w.path} value={w.path}>
                              {w.name} · {w.path}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        相对路径
                        <input
                          aria-label="工作区导入路径"
                          value={path}
                          disabled={busy}
                          placeholder={
                            type === "skill"
                              ? ".agents/skills/my-skill"
                              : "agents/research.md"
                          }
                          onChange={(e) => {
                            setPath(e.target.value);
                            clear();
                          }}
                        />
                      </label>
                      <div className="gal-import-path-actions">
                        <button disabled={busy} onClick={() => browse(path)}>
                          浏览目录
                        </button>
                        <button
                          disabled={busy || !workspace.path}
                          onClick={() =>
                            browse(
                              workspace.path.split("/").slice(0, -1).join("/"),
                            )
                          }
                        >
                          上一级
                        </button>
                        <button
                          className="gal-primary"
                          disabled={busy}
                          onClick={() =>
                            run(async () =>
                              setResult(
                                await onRead({
                                  type,
                                  source: "workspace",
                                  workspacePath: workspace.workspacePath,
                                  path,
                                }),
                              ),
                            )
                          }
                        >
                          读取此路径
                        </button>
                      </div>
                      <div className="gal-import-files" aria-label="工作区文件">
                        {workspace.entries.length ? (
                          workspace.entries.map((entry) => (
                            <button
                              key={entry.name}
                              disabled={busy}
                              onClick={() => {
                                const next = [workspace.path, entry.name]
                                  .filter(Boolean)
                                  .join("/");
                                if (entry.directory) browse(next);
                                else {
                                  setPath(next);
                                  run(async () =>
                                    setResult(
                                      await onRead({
                                        type,
                                        source: "workspace",
                                        workspacePath: workspace.workspacePath,
                                        path: next,
                                      }),
                                    ),
                                  );
                                }
                              }}
                            >
                              <Glyph
                                name={entry.directory ? "folder" : "file"}
                                size={16}
                              />
                              <span>{entry.name}</span>
                              {entry.directory && <span>›</span>}
                            </button>
                          ))
                        ) : (
                          <p>此目录没有可导入的文件或子目录。</p>
                        )}
                      </div>
                      <small>
                        目录：{workspace.path || "工作区根目录"}
                        。进入资源目录后点击「读取此路径」可带入附件。
                      </small>
                    </>
                  )}
                  {!workspace && !busy && (
                    <button onClick={() => browse()}>重新读取工作区</button>
                  )}
                </div>
              )}
              {source === "github" && (
                <div>
                  <label>
                    GitHub / 企业 GitHub 地址
                    <input
                      aria-label="GitHub 导入地址"
                      value={url}
                      disabled={busy}
                      onChange={(e) => {
                        const next = e.target.value;
                        let serviceChanged = true;
                        try {
                          serviceChanged =
                            new URL(next).origin !== new URL(url).origin;
                        } catch {
                          /* Incomplete URL clears credentials. */
                        }
                        if (serviceChanged) {
                          setApiBaseUrl("");
                          setToken("");
                          setAuthStatus(null);
                        }
                        setUrl(next);
                        clear();
                      }}
                      placeholder="https://github.com/owner/repo/tree/main/my-skill"
                    />
                  </label>
                  <p>
                    支持公开、私有和企业 GitHub
                    仓库；私有仓库需填写有读取权限的访问令牌。多资源仓库请提供具体目录或文件链接。
                  </p>
                  <details className="gal-import-connection">
                    <summary>API 连接设置</summary>
                    <label>
                      API 地址（选填）
                      <input
                        aria-label="GitHub API 地址"
                        maxLength={2048}
                        value={apiBaseUrl}
                        disabled={busy}
                        onChange={(e) => {
                          setApiBaseUrl(e.target.value);
                          setToken("");
                          setAuthStatus(null);
                          clear();
                        }}
                        placeholder="自动识别；企业服务通常为 https://github.company.net/api/v3"
                      />
                    </label>
                    <p>
                      {authStatus?.apiBaseUrl
                        ? `当前 API：${authStatus.apiBaseUrl}`
                        : "公开 GitHub 自动使用 api.github.com，企业服务默认使用同站点 /api/v3；反向代理部署可填写完整 API 根地址。"}
                    </p>
                  </details>
                  <label>
                    访问令牌（PAT，选填）
                    <input
                      aria-label="GitHub 访问令牌"
                      maxLength={8192}
                      type="password"
                      autoComplete="new-password"
                      value={token}
                      disabled={busy}
                      onChange={(e) => {
                        setToken(e.target.value);
                        clear();
                      }}
                      placeholder={
                        authStatus?.hasToken
                          ? "已保存，留空继续使用；填写新值替换"
                          : "公开仓库可留空；私有仓库填写读取令牌"
                      }
                    />
                  </label>
                  <label className="gal-import-remember">
                    <input
                      type="checkbox"
                      checked={rememberToken}
                      disabled={busy}
                      onChange={(e) => setRememberToken(e.target.checked)}
                    />
                    在当前 DSH 主机记住此服务的令牌
                  </label>
                  <p>
                    令牌按 API
                    地址分别保存，不回显，也不写入资源或导出包。未勾选时，填写的新令牌仅用于本次读取。
                  </p>
                  {authStatus?.hasToken && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const value = await onGithubAuth({
                            url: url.trim(),
                            apiBaseUrl: apiBaseUrl.trim(),
                            action: "remove",
                          });
                          setAuthStatus(value);
                          setToken("");
                        })
                      }
                    >
                      清除已保存令牌
                    </button>
                  )}
                  {/^http:\/\//i.test(apiBaseUrl || url) && (
                    <p>HTTP 会明文传输认证信息，建议使用 HTTPS。</p>
                  )}
                  <button
                    className="gal-primary"
                    disabled={busy || !url.trim()}
                    onClick={() =>
                      run(async () => {
                        setResult(
                          await onRead({
                            type,
                            source: "github",
                            url: url.trim(),
                            apiBaseUrl: apiBaseUrl.trim(),
                            token,
                            rememberToken,
                          }),
                        );
                        if (onGithubAuth)
                          try {
                            setAuthStatus(
                              await onGithubAuth({
                                url: url.trim(),
                                apiBaseUrl: apiBaseUrl.trim(),
                              }),
                            );
                          } catch {
                            /* Import result remains usable. */
                          }
                      })
                    }
                  >
                    <Glyph name="download" />
                    读取 GitHub
                  </button>
                </div>
              )}
              <p className="gal-import-hint">
                {label} 主文件会自动识别；
                {type === "skill"
                  ? "references / scripts / assets"
                  : "references / assets 及 config.json"}{" "}
                随资源带入。导入只读取内容，不执行文件。
              </p>
              {busy && <p role="status">正在读取资源…</p>}
              {result && (
                <section className="gal-import-preview" aria-label="导入预览">
                  <h3>
                    <Glyph name="check" />
                    已读取 · {result.resource.name}
                  </h3>
                  <p>
                    {result.resource.description ||
                      "描述尚未填写，可在下一步补充。"}
                  </p>
                  <div className="gal-import-files">
                    {result.resource.files.map((f) => (
                      <div key={f.path}>
                        <Glyph name="file" size={15} />
                        <span>{f.path}</span>
                      </div>
                    ))}
                  </div>
                  {result.warnings?.length > 0 && (
                    <details open>
                      <summary>
                        需要确认的内容（{result.warnings.length}）
                      </summary>
                      {result.warnings.map((text, i) => (
                        <p key={i}>{text}</p>
                      ))}
                    </details>
                  )}
                </section>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="gal-error">
              {error}
            </p>
          )}
        </div>
        <footer className="gal-dialog-footer">
          <button
            disabled={busy}
            onClick={
              mode === "choose"
                ? onClose
                : () => {
                    setMode("choose");
                    clear();
                  }
            }
          >
            {mode === "choose" ? "取消" : "返回"}
          </button>
          {mode === "import" && (
            <button
              className="gal-primary"
              disabled={busy || !result}
              onClick={() => onImported(result.resource)}
            >
              进入创建向导
              <Glyph name="arrow" />
            </button>
          )}
        </footer>
      </section>
    </Modal>
  );
}
