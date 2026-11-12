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
  const [directory, setDirectory] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
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
      setSelectedEntry(null);
    });
  const read = (next) =>
    run(async () => {
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
                      if (key === "server" && !directory)
                        browse(undefined, "root");
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
                  <div className="gal-server-toolbar">
                    <button
                      aria-label="上一级"
                      title="返回上一级"
                      disabled={
                        busy ||
                        !directory ||
                        directory.path === directory.parentPath
                      }
                      onClick={() => browse(directory.parentPath)}
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <div
                      className="gal-file-location"
                      title={directory?.path || "服务器目录"}
                    >
                      <Glyph name="folder" size={17} />
                      <span>{directory?.path || "正在打开服务器目录…"}</span>
                    </div>
                    <button
                      className="gal-primary"
                      disabled={busy || !directory}
                      onClick={() =>
                        read(selectedEntry?.path || directory.path)
                      }
                    >
                      <Glyph name="download" size={16} />
                      读取
                    </button>
                  </div>
                  <div className="gal-file-columns" aria-hidden="true">
                    <span>名称</span>
                    <span>类型</span>
                  </div>
                  <div
                    className="gal-directory-list"
                    role="listbox"
                    aria-label="服务器文件"
                    aria-busy={busy}
                    onClick={(e) => {
                      if (!e.target.closest('[role="option"]')) {
                        setSelectedEntry(null);
                        clear();
                      }
                    }}
                  >
                    {directory?.entries.length ? (
                      directory.entries.map((entry, index) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedEntry?.path === entry.path}
                          tabIndex={
                            selectedEntry
                              ? selectedEntry.path === entry.path
                                ? 0
                                : -1
                              : index === 0
                                ? 0
                                : -1
                          }
                          key={entry.path}
                          data-entry-index={index}
                          disabled={busy}
                          title={entry.name}
                          onClick={() => {
                            setSelectedEntry(entry);
                            clear();
                          }}
                          onDoubleClick={() => {
                            if (entry.directory) browse(entry.path);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              entry.directory
                                ? browse(entry.path)
                                : read(entry.path);
                              return;
                            }
                            if (
                              ["ArrowDown", "ArrowUp", "Home", "End"].includes(
                                e.key,
                              )
                            ) {
                              e.preventDefault();
                              const next =
                                e.key === "Home"
                                  ? 0
                                  : e.key === "End"
                                    ? directory.entries.length - 1
                                    : Math.min(
                                        directory.entries.length - 1,
                                        Math.max(
                                          0,
                                          index +
                                            (e.key === "ArrowDown" ? 1 : -1),
                                        ),
                                      );
                              setSelectedEntry(directory.entries[next]);
                              clear();
                              e.currentTarget.parentElement
                                .querySelector(`[data-entry-index="${next}"]`)
                                ?.focus();
                            }
                          }}
                        >
                          <Glyph
                            name={entry.directory ? "folder" : "file"}
                            size={18}
                          />
                          <span className="gal-directory-name">
                            {entry.name}
                            {entry.symlink ? " ↗" : ""}
                          </span>
                          <span className="gal-directory-type">
                            {entry.directory
                              ? "文件夹"
                              : /\.json$/i.test(entry.name)
                                ? "资源包"
                                : "Markdown"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="gal-directory-empty">
                        {busy
                          ? "正在读取目录…"
                          : "此目录没有可导入的文件或文件夹"}
                      </div>
                    )}
                  </div>
                  <div className="gal-file-status">
                    <span>
                      {selectedEntry
                        ? `已选中：${selectedEntry.name}`
                        : `${directory?.entries.length ?? 0} 项`}
                    </span>
                    <span>双击文件夹进入 · 未选中时读取当前目录</span>
                  </div>
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
