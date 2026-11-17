import { useGalleryText } from "./i18n.jsx";
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
  const l = useGalleryText();
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
        aria-label={l("创建 {0}", label)}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <div>
            <h2>
              <Glyph name={type} />
              {mode === "choose" ? l("创建 {0}", label) : l("导入已有 {0}", label)}
            </h2>
            <p>{l("导入后可检查和编辑，确认保存后才加入资源库。")}</p>
          </div>
          <button aria-label={l("关闭创建")} disabled={busy} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>
        <div className="gal-dialog-body">
          {mode === "choose" ? (
            <div className="gal-create-options">
              <button disabled={busy} onClick={onBlank}>
                <Glyph name="plus" size={32} />
                <strong>{l("从零创建")}</strong>
                <span>{l("填写基本信息，编写指引并添加附件。")}</span>
              </button>
              <button disabled={busy} onClick={() => setMode("import")}>
                <Glyph name="folder" size={32} />
                <strong>{l("导入已有")}</strong>
                <span>{l("从本机文件或服务器目录读取。")}</span>
              </button>
            </div>
          ) : (
            <>
              <nav className="gal-import-tabs" aria-label={l("导入来源")}>
                {[
                  ["browser", l("本机文件")],
                  ["server", l("服务器目录")],
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
                  <p>{l("选择一个 ")}{l(label)}{l(" 的 Markdown 文件、完整资源文件夹，或 Gallery 导出的 JSON 资源包。")}</p>
                  <div>
                    <label className="gal-upload">
                      <Glyph name="file" />{l("选择文件")}<input
                        type="file"
                        accept=".md,.json"
                        aria-label={l("导入本机文件")}
                        disabled={busy}
                        onChange={(e) => {
                          upload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <label className="gal-upload">
                      <Glyph name="folder" />{l("选择文件夹")}<input
                        type="file"
                        webkitdirectory=""
                        multiple
                        aria-label={l("导入本机文件夹")}
                        disabled={busy}
                        onChange={(e) => {
                          upload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p>{l("文件来自当前浏览器所在的电脑；读取 DSH 主机上的文件请切换到服务器目录。")}</p>
                </div>
              )}
              {source === "server" && (
                <div className="gal-import-server">
                  <div className="gal-server-toolbar">
                    <button
                      aria-label={l("上一级")}
                      title={l("返回上一级")}
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
                      title={directory?.path || l("服务器目录")}
                    >
                      <Glyph name="folder" size={17} />
                      <span>{directory?.path || l("正在打开服务器目录…")}</span>
                    </div>
                    <button
                      className="gal-primary"
                      disabled={busy || !directory}
                      onClick={() =>
                        read(selectedEntry?.path || directory.path)
                      }
                    >
                      <Glyph name="download" size={16} />{l("读取")}</button>
                  </div>
                  <div className="gal-file-columns" aria-hidden="true">
                    <span>{l("名称")}</span>
                    <span>{l("类型")}</span>
                  </div>
                  <div
                    className="gal-directory-list"
                    role="listbox"
                    aria-label={l("服务器文件")}
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
                              ? l("文件夹")
                              : /\.json$/i.test(entry.name)
                                ? l("资源包")
                                : "Markdown"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="gal-directory-empty">
                        {busy
                          ? l("正在读取目录…")
                          : l("此目录没有可导入的文件或文件夹")}
                      </div>
                    )}
                  </div>
                  <div className="gal-file-status">
                    <span>
                      {selectedEntry
                        ? l("已选中：{0}", selectedEntry.name)
                        : l("{0} 项", directory?.entries.length ?? 0)}
                    </span>
                    <span>{l("双击文件夹进入 · 未选中时读取当前目录")}</span>
                  </div>
                </div>
              )}
              <p className="gal-import-hint">
                {l(label)}{l(" 主文件会自动识别；")}{type === "skill"
                  ? "references / scripts / assets"
                  : l("references / assets 及 config.json")}{" "}{l("随资源带入。导入只读取内容，不执行文件。")}</p>
              {busy && <p role="status">{l("正在读取资源…")}</p>}
              {result && (
                <section className="gal-import-preview" aria-label={l("导入预览")}>
                  <h3>
                    <Glyph name="check" />{l("已读取 · ")}{result.resource.name}
                  </h3>
                  <p>
                    {result.resource.description ||
                      l("描述尚未填写，可在下一步补充。")}
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
                      <summary>{l("需要确认的内容（")}{result.warnings.length}）
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
              {l(error)}
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
            {mode === "choose" ? l("取消") : l("返回")}
          </button>
          {mode === "import" && (
            <button
              className="gal-primary"
              disabled={busy || !result}
              onClick={() => onImported(result.resource)}
            >{l("进入创建向导")}<Glyph name="arrow" />
            </button>
          )}
        </footer>
      </section>
    </Modal>
  );
}
