import React, { useEffect, useState } from "react";
import { REMOTE } from "../descriptors.mjs";
import styles from "./styles.css";
import { Modal } from "./modal.jsx";
import { BrandIcon } from "./brand-icon.jsx";
import { Glyph, ResourceVisual } from "./icons.jsx";

const NS = "dsh-gallery",
  TYPES = { skill: "Skill", agent: "Agent", mcp: "MCP", workflow: "Workflow" };
const blank = () => ({
  type: "skill",
  name: "",
  description: "",
  tags: [],
  files: [],
  metadata: {},
  references: [],
});
const when = (s) => (s ? new Date(s).toLocaleString() : "");
const fail = (e) => e?.rpcError?.message || e?.message || String(e);
async function call(remote, name, ...args) {
  const r = await remote[name](...args);
  if (r?.ok === false) throw new Error(r.error?.message || "Gallery 请求失败");
  return r?.ok === true ? r.value : r;
}
const json = JSON.stringify;
function download(name, value, type = "application/json") {
  const url = URL.createObjectURL(new Blob([value], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Icon() {
  return <BrandIcon />;
}
function Gallery({ remote }) {
  const [status, setStatus] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]),
    [total, setTotal] = useState(0),
    [type, setType] = useState(""),
    [scope, setScope] = useState("all"),
    [q, setQ] = useState(""),
    [refresh, setRefresh] = useState(0),
    [offset, setOffset] = useState(0),
    [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null),
    [editor, setEditor] = useState(null);
  const [reference, setReference] = useState("");
  const [storageSettings, setStorageSettings] = useState(null);
  const [connectionResult, setConnectionResult] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const confirmAction = (message) =>
    new Promise((resolve) => setConfirmation({ message, resolve }));
  function answerConfirmation(value) {
    const current = confirmation;
    setConfirmation(null);
    current?.resolve(value);
  }
  async function run(fn) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      return await fn();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let live = true;
    call(remote, "uiStatus")
      .then((x) => {
        if (live) {
          setStatus(x);
          if (x.storage && !x.storage.configured) {
            setStorageSettings(x.storage);
          }
        }
      })
      .catch((e) => {
        if (live) setError(fail(e));
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!status?.ready) return;
    let live = true;
    setLoading(true);
    const timer = setTimeout(
      () =>
        call(remote, "uiList", json({ type, scope, q, limit: 48, offset }))
          .then((x) => {
            if (live) {
              setItems(x.items);
              setTotal(x.total);
            }
          })
          .catch((e) => {
            if (live) setError(fail(e));
          })
          .finally(() => {
            if (live) setLoading(false);
          }),
      180,
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    status?.ready,
    status?.storage?.activeLibraryId,
    type,
    scope,
    q,
    offset,
    refresh,
  ]);
  async function load(id) {
    const r = await call(remote, "uiGet", id);
    setSelected(r);
    setReference("");
    return r;
  }
  function edit(r) {
    setNotice("");
    setError("");
    const d = r || blank();
    setEditor({
      id: r?.id,
      revision: r?.revision,
      resource: structuredClone(d),
      tags: d.tags.join(", "),
      metadata: json(d.metadata, null, 2),
      references: json(d.references, null, 2),
      fileIndex: 0,
      newPath: "",
      importError: "",
    });
  }
  function change(key, value) {
    setEditor((x) => ({ ...x, [key]: value }));
  }
  function field(key, value) {
    setEditor((x) => ({ ...x, resource: { ...x.resource, [key]: value } }));
  }
  async function upload(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    try {
      if (files.length === 1 && files[0].name.endsWith(".json")) {
        const raw = await files[0].text();
        let bundle;
        try {
          bundle = JSON.parse(raw);
        } catch {}
        if (
          bundle?.format === "dsh-gallery-resource" &&
          [1, 2].includes(bundle.schemaVersion) &&
          bundle.resource
        ) {
          const r = bundle.resource;
          setEditor((x) => ({
            ...x,
            resource: { ...blank(), ...r },
            tags: (r.tags || []).join(", "),
            metadata: json(r.metadata || {}, null, 2),
            references: json(r.references || [], null, 2),
            fileIndex: 0,
            importError: "",
          }));
          return;
        }
      }
      const incoming = [];
      let size = 0;
      for (const f of files) {
        size += f.size;
        if (size > 5 * 1024 * 1024) throw new Error("文件总量不能超过 5 MiB");
        const bytes = new Uint8Array(await f.arrayBuffer());
        let content,
          encoding = "utf8";
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          if (content.includes("\0")) throw new Error();
        } catch {
          encoding = "base64";
          content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
        }
        incoming.push({
          path: f.webkitRelativePath || f.name,
          encoding,
          content,
        });
      }
      setEditor((x) => {
        const merged = new Map(x.resource.files.map((f) => [f.path, f]));
        for (const f of incoming) merged.set(f.path, f);
        return {
          ...x,
          resource: {
            ...x.resource,
            name: x.resource.name || files[0].name.replace(/\.[^.]+$/, ""),
            files: [...merged.values()],
          },
          importError: "",
        };
      });
    } catch (e) {
      setEditor((x) => ({ ...x, importError: fail(e) }));
    }
  }
  async function save() {
    const resource = {
      ...editor.resource,
      tags: editor.tags
        .split(/[,，]/)
        .map((x) => x.trim())
        .filter(Boolean),
      metadata: JSON.parse(editor.metadata),
      references: JSON.parse(editor.references),
    };
    const r = editor.id
      ? await call(
          remote,
          "uiUpdate",
          editor.id,
          json({ resource, expectedRevision: editor.revision }),
        )
      : await call(remote, "uiCreate", json(resource));
    setEditor(null);
    await load(r.id);
    setRefresh((x) => x + 1);
    setNotice("资源已保存。");
  }
  async function closeEditor() {
    if (busy) return;
    if (await confirmAction("放弃尚未保存的修改？")) setEditor(null);
  }
  function closeStorage() {
    if (busy) return;
    return run(async () => {
      if (!storageSettings.configured) {
        const storage = await call(remote, "uiConfigureStorage");
        setStatus((x) => ({ ...x, storage }));
      }
      setStorageSettings(null);
    });
  }
  const content = selected;
  const activeFile = editor?.resource.files[editor.fileIndex];
  const chooseFilter = (t) => {
    setType(t);
    setOffset(0);
  };
  return (
    <div className="gal">
      <header className="gal-header">
        <div>
          <h1>
            <BrandIcon size={32} />
            Gallery
          </h1>
        </div>
        <div className="gal-header-actions">
          <button
            className="gal-icon-button"
            aria-label="存储设置"
            title={
              "存储设置 · " +
              (status?.storage?.libraries.find(
                (l) => l.id === status.storage.activeLibraryId,
              )?.name || "本地资源库")
            }
            disabled={busy || !status?.ready}
            onClick={() =>
              run(async () => {
                const settings = await call(remote, "uiStorageSettings");
                setStorageSettings(settings);

                setConnectionResult("");
              })
            }
          >
            <Glyph name="settings" size={20} />
          </button>
          <button
            className="gal-primary"
            disabled={!status?.ready}
            onClick={() => edit(null)}
          >
            <Glyph name="plus" />
            新建资源
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="gal-alert">
          {error}
          <button aria-label="关闭错误" onClick={() => setError("")}>
            <Glyph name="close" />
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="gal-notice">
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            <Glyph name="close" />
          </button>
        </div>
      )}
      {!status?.ready ? (
        <div className="gal-empty">
          {error
            ? "资源库暂时不可用，请检查提示后刷新。"
            : "正在打开本地资源库…"}
        </div>
      ) : (
        <>
          <div className="gal-toolbar">
            <nav className="gal-filters" aria-label="资源类型">
              <button
                className={!type ? "active" : ""}
                aria-pressed={!type}
                onClick={() => {
                  setScope("all");
                  chooseFilter("");
                }}
              >
                <Glyph name="grid" />
                全部
              </button>
              {Object.entries(TYPES).map(([key, label]) => (
                <button
                  key={key}
                  className={type === key ? "active" : ""}
                  aria-pressed={type === key}
                  onClick={() => chooseFilter(key)}
                >
                  <Glyph name={key} />
                  {label}
                </button>
              ))}
            </nav>
            <div className="gal-search-wrap">
              <Glyph name="search" />
              <input
                aria-label="搜索资源"
                className="gal-search"
                placeholder="搜索名称、描述或标签…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOffset(0);
                }}
              />
            </div>
          </div>
          <div className="gal-list-heading">
            <span>
              {type ? TYPES[type] : "资源"} <strong>{total}</strong>
            </span>
            <div>
              <button
                className="gal-icon-button"
                title="刷新资源"
                aria-label="刷新"
                disabled={busy}
                onClick={() => setRefresh((x) => x + 1)}
              >
                <Glyph name="refresh" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="gal-empty">正在加载资源…</div>
          ) : items.length === 0 ? (
            <div className="gal-empty">
              <Icon />
              <h3>
                {q || type || scope !== "all" ? "没有匹配的资源" : "暂无资源"}
              </h3>
              <p>
                {q || type || scope !== "all"
                  ? "试试其他关键词或分类。"
                  : "新建资源或上传文件。"}
              </p>
              <button className="gal-primary" onClick={() => edit(null)}>
                新建资源
              </button>
            </div>
          ) : (
            <div className="gal-resource-grid">
              {items.map((r) => (
                <button
                  key={r.id}
                  className="gal-resource-card"
                  title={r.name}
                  disabled={busy}
                  onClick={() => run(() => load(r.id))}
                >
                  <ResourceVisual type={r.type} />
                  <div className="gal-resource-content">
                    <h3>{r.name}</h3>
                    {r.description && <p>{r.description}</p>}
                  </div>
                  <div className="gal-tags">
                    {r.tags.slice(0, 2).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <footer>
                    <span title="文件数量">
                      <Glyph name="file" size={15} />
                      {r.fileCount}
                    </span>
                    <span title="更新时间">
                      <Glyph name="clock" size={15} />
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                  </footer>
                </button>
              ))}
            </div>
          )}
          {total > 48 && (
            <div className="gal-pagination">
              <button
                disabled={!offset}
                onClick={() => setOffset((x) => Math.max(0, x - 48))}
              >
                上一页
              </button>
              <span>
                {Math.floor(offset / 48) + 1} / {Math.ceil(total / 48)}
              </span>
              <button
                disabled={offset + 48 >= total}
                onClick={() => setOffset((x) => x + 48)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
      {selected && !editor && (
        <Modal onClose={() => !busy && setSelected(null)}>
          <section
            tabIndex={-1}
            className="gal-dialog gal-detail"
            role="dialog"
            aria-modal="true"
            aria-label="资源详情"
          >
            <div className="gal-dialog-head">
              <div>
                <span className={"gal-pill " + selected.type}>
                  <Glyph name={selected.type} size={16} />
                  {TYPES[selected.type]}
                </span>
                <h2>{content.name}</h2>
                <p>更新于 {when(selected.updatedAt)}</p>
              </div>
              <button aria-label="关闭详情" onClick={() => setSelected(null)}>
                <Glyph name="close" />
              </button>
            </div>
            <div className="gal-detail-actions">
              {selected.canEdit && (
                <button onClick={() => edit(selected)}>
                  <Glyph name="edit" />
                  编辑资源
                </button>
              )}
              <button
                onClick={() =>
                  download(
                    `${content.name}.gallery.json`,
                    json(
                      {
                        format: "dsh-gallery-resource",
                        schemaVersion: 2,
                        resource: {
                          type: content.type,
                          name: content.name,
                          description: content.description,
                          tags: content.tags,
                          files: content.files,
                          metadata: content.metadata,
                          references: content.references,
                        },
                        source: {
                          libraryId: selected.libraryId,
                          id: selected.id,
                          digest: selected.digest,
                        },
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                <Glyph name="download" />
                下载资源
              </button>
              <button
                onClick={() =>
                  setReference(
                    json(
                      {
                        libraryId: selected.libraryId,
                        id: selected.id,
                        digest: selected.digest,
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                <Glyph name="link" />
                获取引用
              </button>
            </div>
            <div className="gal-dialog-body">
              {reference && (
                <label className="gal-reference">
                  资源引用
                  <textarea readOnly rows={4} value={reference} />
                </label>
              )}
              <p className="gal-description">
                {content.description || "暂无描述"}
              </p>
              <div className="gal-tags">
                {content.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              {content.files.map((f) => (
                <details className="gal-file" key={f.path}>
                  <summary>
                    <Glyph name="file" size={16} /> {f.path}
                    <span>{f.bytes ?? new Blob([f.content]).size} B</span>
                  </summary>
                  {f.encoding === "utf8" ? (
                    <pre>{f.content}</pre>
                  ) : (
                    <p>二进制附件包含在下载的资源包中。</p>
                  )}
                </details>
              ))}
              <details className="gal-file">
                <summary>元数据与依赖</summary>
                <pre>
                  {json(
                    {
                      metadata: content.metadata,
                      references: content.references,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          </section>
        </Modal>
      )}
      {editor && (
        <Modal onClose={closeEditor}>
          <section
            tabIndex={-1}
            className="gal-dialog gal-editor"
            role="dialog"
            aria-modal="true"
            aria-label={editor.id ? "编辑资源" : "新建资源"}
          >
            <div className="gal-dialog-head">
              <div>
                <h2>{editor.id ? "编辑资源" : "创建资源"}</h2>
              </div>
              <button
                aria-label="关闭编辑"
                onClick={closeEditor}
                disabled={busy}
              >
                <Glyph name="close" />
              </button>
            </div>
            <div className="gal-dialog-body">
              <div className="gal-form-row">
                <label>
                  类型
                  <select
                    disabled={Boolean(editor.id)}
                    value={editor.resource.type}
                    onChange={(e) => field("type", e.target.value)}
                  >
                    {Object.entries(TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="gal-grow">
                  资源名称
                  <input
                    value={editor.resource.name}
                    maxLength={160}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder="例如：代码审查 Skill"
                  />
                </label>
              </div>
              <label>
                描述
                <textarea
                  rows={3}
                  value={editor.resource.description}
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="资源描述（选填）"
                  maxLength={10000}
                />
              </label>
              <label>
                标签
                <input
                  value={editor.tags}
                  onChange={(e) => change("tags", e.target.value)}
                  placeholder="标签，用逗号分隔"
                />
              </label>
              <div className="gal-file-toolbar">
                <h3>
                  资源文件 <small>{editor.resource.files.length} / 100</small>
                </h3>
                <div>
                  <label className="gal-upload">
                    <Glyph name="upload" />
                    上传文件
                    <input
                      aria-label="上传资源文件"
                      type="file"
                      multiple
                      onChange={(e) => {
                        upload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label className="gal-upload">
                    <Glyph name="folder" />
                    上传文件夹
                    <input
                      aria-label="上传资源文件夹"
                      type="file"
                      multiple
                      webkitdirectory=""
                      onChange={(e) => {
                        upload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              {editor.importError && (
                <p className="gal-error">{editor.importError}</p>
              )}
              <div className="gal-add-file">
                <input
                  aria-label="新文件路径"
                  placeholder="新文件路径，例如 SKILL.md"
                  value={editor.newPath}
                  onChange={(e) => change("newPath", e.target.value)}
                />
                <button
                  disabled={!editor.newPath.trim()}
                  onClick={() => {
                    const p = editor.newPath.trim();
                    if (editor.resource.files.some((f) => f.path === p)) {
                      change("importError", "该文件已存在");
                      return;
                    }
                    setEditor((x) => ({
                      ...x,
                      newPath: "",
                      fileIndex: x.resource.files.length,
                      resource: {
                        ...x.resource,
                        files: [
                          ...x.resource.files,
                          { path: p, encoding: "utf8", content: "" },
                        ],
                      },
                    }));
                  }}
                >
                  添加文本文件
                </button>
              </div>
              <div className="gal-file-editor">
                <nav>
                  {editor.resource.files.map((f, i) => (
                    <button
                      className={i === editor.fileIndex ? "active" : ""}
                      key={f.path}
                      onClick={() => change("fileIndex", i)}
                    >
                      {f.path}
                    </button>
                  ))}
                  {!editor.resource.files.length && (
                    <p>可上传已有文件，也可直接创建文本文件。</p>
                  )}
                </nav>
                <div>
                  {activeFile ? (
                    <>
                      <div className="gal-code-head">
                        <span>{activeFile.path}</span>
                        <button
                          onClick={() =>
                            setEditor((x) => ({
                              ...x,
                              fileIndex: 0,
                              resource: {
                                ...x.resource,
                                files: x.resource.files.filter(
                                  (_, i) => i !== x.fileIndex,
                                ),
                              },
                            }))
                          }
                        >
                          移除文件
                        </button>
                      </div>
                      {activeFile.encoding === "utf8" ? (
                        <textarea
                          aria-label="文件内容"
                          spellCheck="false"
                          value={activeFile.content}
                          onChange={(e) =>
                            setEditor((x) => ({
                              ...x,
                              resource: {
                                ...x.resource,
                                files: x.resource.files.map((f, i) =>
                                  i === x.fileIndex
                                    ? { ...f, content: e.target.value }
                                    : f,
                                ),
                              },
                            }))
                          }
                        />
                      ) : (
                        <p>二进制文件已上传，可移除后重新上传替换。</p>
                      )}
                    </>
                  ) : (
                    <div className="gal-code-placeholder">
                      选择文件以查看或编辑
                    </div>
                  )}
                </div>
              </div>
              <details className="gal-advanced">
                <summary>元数据与资源引用</summary>
                <label>
                  元数据（JSON 对象）
                  <textarea
                    rows={5}
                    value={editor.metadata}
                    onChange={(e) => change("metadata", e.target.value)}
                    spellCheck="false"
                  />
                </label>
                <label>
                  资源依赖（JSON）
                  <textarea
                    rows={5}
                    value={editor.references}
                    onChange={(e) => change("references", e.target.value)}
                    spellCheck="false"
                  />
                </label>
              </details>
            </div>
            <footer className="gal-dialog-footer">
              <button disabled={busy} onClick={closeEditor}>
                取消
              </button>
              <button
                className="gal-primary"
                disabled={busy}
                onClick={() => run(save)}
              >
                {busy ? "保存中…" : "保存资源"}
              </button>
            </footer>
          </section>
        </Modal>
      )}
      {storageSettings && (
        <Modal onClose={closeStorage}>
          <section
            tabIndex={-1}
            className="gal-dialog gal-storage"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gal-storage-title"
          >
            <div className="gal-dialog-head">
              <h2 id="gal-storage-title">
                {storageSettings.configured ? "资源库存储" : "选择资源库存储"}
              </h2>
              <button
                aria-label="关闭存储设置"
                disabled={busy}
                onClick={closeStorage}
              >
                <Glyph name="close" />
              </button>
            </div>
            <div className="gal-dialog-body">
              <div className="gal-storage-providers">
                {storageSettings.providers.map((provider) => (
                  <div
                    key={provider.type}
                    className={provider.available ? "active" : ""}
                  >
                    <strong>{provider.name}</strong>
                    <span>{provider.available ? "可用" : "后续接入"}</span>
                  </div>
                ))}
              </div>
              {connectionResult && <p role="status">{connectionResult}</p>}
              {error && <p role="alert">{error}</p>}
            </div>
            <footer className="gal-dialog-footer">
              <span className="gal-local">v0.4.4</span>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await call(
                      remote,
                      "uiTestStorage",
                      json({ libraryId: "local" }),
                    );
                    setConnectionResult("资源库可用");
                  })
                }
              >
                检查存储
              </button>
              <button
                className="gal-primary"
                disabled={busy}
                onClick={closeStorage}
              >
                {busy ? "处理中…" : "完成"}
              </button>
            </footer>
          </section>
        </Modal>
      )}
      {confirmation && (
        <Modal confirmation onClose={() => answerConfirmation(false)}>
          <section
            tabIndex={-1}
            className="gal-dialog gal-small"
            role="alertdialog"
            aria-modal="true"
            aria-label="确认操作"
          >
            <div className="gal-dialog-head">
              <h2>确认操作</h2>
            </div>
            <div className="gal-dialog-body">
              <p>{confirmation.message}</p>
            </div>
            <div className="gal-dialog-footer">
              <button autoFocus onClick={() => answerConfirmation(false)}>
                取消
              </button>
              <button
                className="gal-primary"
                onClick={() => answerConfirmation(true)}
              >
                确认
              </button>
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}
export const inject = ["remote", "slots", "locale"];
export async function apply(ctx) {
  await ctx.remote.$mount(REMOTE);
  const remote = ctx.get("remote.gallery");
  ctx.effect(() =>
    ctx.locale.register(NS, {
      zh: { title: "Gallery" },
      en: { title: "Gallery" },
    }),
  );
  ctx.effect(() => {
    const s = document.createElement("style");
    s.dataset.gallery = "styles";
    s.textContent = styles;
    document.head.appendChild(s);
    return () => s.remove();
  });
  ctx.slots.inject("sidebar.panellist", () =>
    ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: "gallery",
        order: 62,
        locale: NS,
        label: () => "Gallery",
      },
      Icon,
    ),
  );
  ctx.slots.inject("main", () =>
    ctx.slots.register(
      { name: "main", key: "gallery", locale: NS, inject: () => ({ remote }) },
      Gallery,
    ),
  );
}
