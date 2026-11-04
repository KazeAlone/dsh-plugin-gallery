import React, { useEffect, useState } from "react";
import { REMOTE } from "../descriptors.mjs";
import styles from "./styles.css";

const NS = "dsh-gallery",
  TYPES = { skill: "Skill", agent: "Agent", mcp: "MCP", workflow: "Workflow" };
const ICONS = { skill: "✦", agent: "◉", mcp: "⌘", workflow: "⌁" };
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
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
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
  const [identityForm, setIdentityForm] = useState({
    displayName: "",
    code: "",
    serverUrl: "http://127.0.0.1:4318",
  });
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
          setIdentityForm((f) => ({ ...f, serverUrl: x.url }));
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
  }, [status?.ready, type, scope, q, offset, refresh]);
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
    setNotice("资源已保存，团队成员现在可以使用。");
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
          <div className="gal-eyebrow">
            RESOURCE LIBRARY <span>PREVIEW · 0.3</span>
          </div>
          <h1>资源 Gallery</h1>
          <p>收集可复用资源，让每次编排都有积累。</p>
        </div>
        <div className="gal-header-actions">
          <span className="gal-local">
            {status?.identity?.displayName || "共享资源库"}
          </span>
          {status?.ready && (
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  if (
                    await confirmAction(
                      "退出当前身份？重新接入需要维护者提供的接入码。",
                    )
                  ) {
                    setStatus(await call(remote, "uiClearIdentity"));
                    setSelected(null);
                    setEditor(null);
                    setItems([]);
                  }
                })
              }
            >
              退出身份
            </button>
          )}
          <button
            className="gal-primary"
            disabled={!status?.ready}
            onClick={() => edit(null)}
          >
            ＋ 新建资源
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="gal-alert">
          {error}
          <button aria-label="关闭错误" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="gal-notice">
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      {!status?.ready ? (
        <section
          className="gal-identity gal-dialog"
          aria-label="接入共享资源库"
        >
          <div className="gal-dialog-head">
            <div>
              <h2>接入共享资源库</h2>
              <p>
                {status?.developmentAuth
                  ? "开发模式：填写姓名即可进入，无需接入码。"
                  : "填写姓名和维护者提供的一次性接入码。"}
              </p>
            </div>
          </div>
          {!status ? (
            <p className="gal-hint">正在检查身份…</p>
          ) : (
            <form
              className="gal-dialog-body"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const next = await call(
                    remote,
                    "uiEnroll",
                    json(identityForm),
                  );
                  setStatus(next);
                  setIdentityForm((f) => ({ ...f, code: "" }));
                  setRefresh((x) => x + 1);
                });
              }}
            >
              {status.error && (
                <p role="alert" className="gal-hint">
                  {status.error}
                </p>
              )}
              <label>
                共享服务地址
                <input
                  required
                  aria-label="共享服务地址"
                  value={identityForm.serverUrl}
                  disabled={status.serverLocked || busy}
                  onChange={(e) =>
                    setIdentityForm((f) => ({
                      ...f,
                      serverUrl: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                姓名
                <input
                  required
                  maxLength={100}
                  autoComplete="name"
                  aria-label="姓名"
                  value={identityForm.displayName}
                  onChange={(e) =>
                    setIdentityForm((f) => ({
                      ...f,
                      displayName: e.target.value,
                    }))
                  }
                />
              </label>
              {!status.developmentAuth && (
                <label>
                  一次性接入码
                  <input
                    required
                    type="password"
                    autoComplete="off"
                    aria-label="一次性接入码"
                    value={identityForm.code}
                    onChange={(e) =>
                      setIdentityForm((f) => ({ ...f, code: e.target.value }))
                    }
                  />
                </label>
              )}
              <p className="gal-hint">
                资源保存即共享；只有上传者可以编辑。身份验证后会保存在这台电脑上。
              </p>
              <button className="gal-primary" disabled={busy} type="submit">
                {busy ? "验证中…" : "验证身份并进入"}
              </button>
            </form>
          )}
        </section>
      ) : (
        <>
          <div className="gal-type-grid">
            {Object.entries(TYPES).map(([key, label]) => (
              <button
                key={key}
                className={"gal-type-card " + (type === key ? "active" : "")}
                onClick={() => chooseFilter(type === key ? "" : key)}
              >
                <span className={"gal-type-icon " + key}>{ICONS[key]}</span>
                <strong>{label}</strong>
                <small>
                  {
                    {
                      skill: "技能与参考资料",
                      agent: "角色与能力定义",
                      mcp: "工具服务与连接",
                      workflow: "任务编排模板",
                    }[key]
                  }
                </small>
                <b>↗</b>
              </button>
            ))}
          </div>
          <div className="gal-toolbar">
            <div className="gal-scopes">
              <button
                className={scope === "all" ? "active" : ""}
                onClick={() => {
                  setScope("all");
                  setOffset(0);
                }}
              >
                全部资源
              </button>
              <button
                className={scope === "mine" ? "active" : ""}
                onClick={() => {
                  setScope("mine");
                  setOffset(0);
                }}
              >
                我的资源
              </button>
            </div>
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
          <div className="gal-list-heading">
            <span>
              {type ? TYPES[type] : "资源"} <strong>{total}</strong>
            </span>
            <div>
              {type && (
                <button onClick={() => chooseFilter("")}>清除分类 ×</button>
              )}
              <button disabled={busy} onClick={() => setRefresh((x) => x + 1)}>
                刷新 ↻
              </button>
            </div>
          </div>
          {loading ? (
            <div className="gal-empty">正在加载资源…</div>
          ) : items.length === 0 ? (
            <div className="gal-empty">
              <Icon />
              <h3>
                {q || type || scope !== "all"
                  ? "没有匹配的资源"
                  : "资源，从第一份积累开始"}
              </h3>
              <p>
                {q || type || scope !== "all"
                  ? "试试其他关键词或分类。"
                  : "上传已有的 Skill、Agent 描述、MCP 配置或 Workflow 模板。"}
              </p>
              <button className="gal-primary" onClick={() => edit(null)}>
                创建 / 上传资源
              </button>
            </div>
          ) : (
            <div className="gal-resource-grid">
              {items.map((r) => (
                <button
                  key={r.id}
                  className="gal-resource-card"
                  onClick={() => run(() => load(r.id))}
                >
                  <div className="gal-card-top">
                    <span className={"gal-pill " + r.type}>
                      {TYPES[r.type]}
                    </span>
                    <span className="gal-version">
                      {r.owner?.displayName || "归属待确认"}
                    </span>
                  </div>
                  <h3>{r.name}</h3>
                  <p>{r.description || "暂无描述"}</p>
                  <div className="gal-tags">
                    {r.tags.slice(0, 4).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <footer>
                    <span>{r.fileCount} 个文件</span>
                    <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
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
          <footer className="gal-bottom">
            <span>团队共享 · 保存后即可使用</span>
            <span>Skill · Agent · MCP · Workflow</span>
          </footer>
        </>
      )}
      {selected && !editor && (
        <div className="gal-overlay">
          <section
            className="gal-dialog gal-detail"
            role="dialog"
            aria-modal="true"
            aria-label="资源详情"
          >
            <div className="gal-dialog-head">
              <div>
                <span className={"gal-pill " + selected.type}>
                  {TYPES[selected.type]}
                </span>
                <h2>{content.name}</h2>
                <p>
                  {selected.owner?.displayName || "归属待确认"} · 更新于{" "}
                  {when(selected.updatedAt)}
                </p>
              </div>
              <button aria-label="关闭详情" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="gal-detail-actions">
              {selected.canEdit && (
                <button onClick={() => edit(selected)}>编辑资源</button>
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
                        source: { id: selected.id, digest: selected.digest },
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                下载资源
              </button>
              <button
                onClick={() =>
                  setReference(
                    json({ id: selected.id, digest: selected.digest }, null, 2),
                  )
                }
              >
                获取引用
              </button>
            </div>
            {reference && (
              <label className="gal-reference">
                供编排插件使用的资源引用
                <textarea readOnly rows={4} value={reference} />
                <small>摘要用于检测内容变化。编排运行时可保存内容快照。</small>
              </label>
            )}
            <div className="gal-dialog-body">
              {!selected.canEdit && (
                <p className="gal-hint">
                  {selected.owner
                    ? "由其他成员上传，可查看、下载和引用。"
                    : "旧资源归属待维护者确认，当前仅可查看和使用。"}
                </p>
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
                    {f.path}
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
        </div>
      )}
      {editor && (
        <div className="gal-overlay">
          <section
            className="gal-dialog gal-editor"
            role="dialog"
            aria-modal="true"
            aria-label={editor.id ? "编辑资源" : "新建资源"}
          >
            <div className="gal-dialog-head">
              <div>
                <div className="gal-eyebrow">RESOURCE EDITOR</div>
                <h2>{editor.id ? "编辑资源" : "创建资源"}</h2>
                <p>支持上传文件、文件夹或 Gallery 导出的 JSON 资源包。</p>
              </div>
              <button
                aria-label="关闭编辑"
                onClick={async () => {
                  if (await confirmAction("放弃尚未保存的修改？"))
                    setEditor(null);
                }}
              >
                ×
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
                  placeholder="说明用途、适用场景和使用方法"
                  maxLength={10000}
                />
              </label>
              <label>
                标签
                <input
                  value={editor.tags}
                  onChange={(e) => change("tags", e.target.value)}
                  placeholder="使用逗号分隔，例如：研发, 审查, Python"
                />
              </label>
              <div className="gal-file-toolbar">
                <h3>
                  资源文件 <small>{editor.resource.files.length} / 100</small>
                </h3>
                <div>
                  <label className="gal-upload">
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
                  资源依赖（JSON 数组，例如{" "}
                  {'[{"id":"资源ID","digest":"SHA-256"}]'}）
                  <textarea
                    rows={5}
                    value={editor.references}
                    onChange={(e) => change("references", e.target.value)}
                    spellCheck="false"
                  />
                </label>
                <p className="gal-hint">
                  MCP 文件保存环境变量名称与配置模板；运行凭据由使用方配置。
                </p>
              </details>
            </div>
            <footer className="gal-dialog-footer">
              <span>保存后立即共享，只有你可以编辑</span>
              <button
                className="gal-primary"
                disabled={busy}
                onClick={() => run(save)}
              >
                {busy ? "保存中…" : "保存并共享"}
              </button>
            </footer>
          </section>
        </div>
      )}
      {confirmation && (
        <div className="gal-overlay gal-confirm-overlay">
          <section
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
                取消操作
              </button>
              <button
                className="gal-primary"
                onClick={() => answerConfirmation(true)}
              >
                确认操作
              </button>
            </div>
          </section>
        </div>
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
      zh: { title: "资源 Gallery" },
      en: { title: "Resource Gallery" },
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
        label: () => "资源 Gallery",
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
