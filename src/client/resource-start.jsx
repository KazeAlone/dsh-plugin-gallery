import React, { useState } from "react";
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
}) {
  const label = type === "skill" ? "Skill" : "Agent";
  const [mode, setMode] = useState("choose"),
    [source, setSource] = useState("browser"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  const [directory, setDirectory] = useState(null),
    [path, setPath] = useState("");
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
  const browse = (next, shortcut) =>
    run(async () => {
      const value = await onBrowse(
        shortcut ? { shortcut } : next === undefined ? {} : { path: next },
      );
      setDirectory(value);
      setPath(value.path);
    });
  const read = (next) =>
    run(async () => {
      setPath(next);
      setResult(await onRead({ type, source: "server", path: next }));
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
                <span>从本机文件或服务器目录读取。</span>
              </button>
            </div>
          ) : (
            <>
              <nav className="gal-import-tabs" aria-label="导入来源">
                {[
                  ["browser", "本机文件"],
                  ["server", "服务器目录"],
                ].map(([key, name]) => (
                  <button
                    key={key}
                    disabled={busy}
                    aria-pressed={source === key}
                    onClick={() => {
                      setSource(key);
                      clear();
                      if (key === "server" && !directory) browse();
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
                    文件来自当前浏览器所在的电脑；读取 DSH
                    主机上的文件请切换到服务器目录。
                  </p>
                </div>
              )}
              {source === "server" && (
                <div className="gal-import-server">
                  <p>
                    浏览运行 DSH 的服务器目录，不限于工作区。读取范围由 DSH
                    运行账号的系统权限决定，仅显示文件夹和可导入的 Markdown /
                    JSON 文件。
                  </p>
                  <label>
                    服务器绝对路径
                    <input
                      aria-label="服务器导入路径"
                      value={path}
                      disabled={busy}
                      onChange={(e) => {
                        setPath(e.target.value);
                        clear();
                      }}
                      placeholder={
                        type === "skill"
                          ? "/home/user/project/skills/my-skill"
                          : "/home/user/project/agents/reviewer.md"
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !busy) {
                          e.preventDefault();
                          browse(path);
                        }
                      }}
                    />
                  </label>
                  <div className="gal-import-path-actions">
                    <button
                      disabled={busy}
                      onClick={() => browse(undefined, "root")}
                    >
                      根目录
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => browse(undefined, "home")}
                    >
                      用户目录
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => browse(undefined, "start")}
                    >
                      启动目录
                    </button>
                    <button
                      disabled={
                        busy ||
                        !directory ||
                        directory.path === directory.parentPath
                      }
                      onClick={() => browse(directory.parentPath)}
                    >
                      上一级
                    </button>
                    <button
                      disabled={busy || !path}
                      onClick={() => browse(path)}
                    >
                      浏览目录
                    </button>
                    <button
                      className="gal-primary"
                      disabled={busy || !path}
                      onClick={() => read(path)}
                    >
                      读取此路径
                    </button>
                  </div>
                  {directory && (
                    <>
                      <div className="gal-import-files" aria-label="服务器文件">
                        {directory.entries.length ? (
                          directory.entries.map((entry) => (
                            <button
                              key={entry.name}
                              disabled={busy}
                              onClick={() =>
                                entry.directory
                                  ? browse(entry.path)
                                  : read(entry.path)
                              }
                            >
                              <Glyph
                                name={entry.directory ? "folder" : "file"}
                                size={16}
                              />
                              <span>
                                {entry.name}
                                {entry.symlink ? " ↗" : ""}
                              </span>
                              {entry.directory && <span>›</span>}
                            </button>
                          ))
                        ) : (
                          <p>此目录没有可导入的文件或子目录。</p>
                        )}
                      </div>
                      <small>
                        当前目录：{directory.path}
                        。进入资源目录后点击「读取此路径」可带入附件。
                      </small>
                    </>
                  )}
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
