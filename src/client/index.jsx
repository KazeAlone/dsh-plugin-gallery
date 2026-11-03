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
    [versions, setVersions] = useState([]),
    [editor, setEditor] = useState(null),
    [tab, setTab] = useState("content"),
    [publishNote, setPublishNote] = useState("");
  const [connection, setConnection] = useState(false),
    [url, setUrl] = useState(""),
    [token, setToken] = useState("");
  const [membersOpen, setMembersOpen] = useState(false),
    [members, setMembers] = useState([]),
    [memberName, setMemberName] = useState(""),
    [memberRole, setMemberRole] = useState("member"),
    [newToken, setNewToken] = useState(null);
  const [reference, setReference] = useState(""),
    [viewedVersion, setViewedVersion] = useState(null);
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
          setUrl(x.url || "");
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
    if (!status?.connected) return;
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
  }, [status?.connected, type, scope, q, offset, refresh]);
  async function load(id) {
    const [r, v] = await Promise.all([
      call(remote, "uiGet", id),
      call(remote, "uiVersions", id),
    ]);
    setSelected(r);
    setVersions(v.items);
    setTab("content");
    setReference("");
    setViewedVersion(null);
    return r;
  }
  function edit(r) {
    setNotice("");
    setError("");
    const d = r?.draft || blank();
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
          bundle.schemaVersion === 1 &&
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
    setNotice("草稿已保存。发布后团队成员即可获取这个版本。");
  }
  const snapshot = viewedVersion || selected?.published;
  const content =
    viewedVersion?.resource || selected?.draft || selected?.published?.resource;
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
            TEAM RESOURCE LIBRARY <span>PREVIEW · 0.1</span>
          </div>
          <h1>资源 Gallery</h1>
          <p>把团队积累的能力，放在一个地方。</p>
        </div>
        <div className="gal-header-actions">
          {status?.connected && (
            <>
              <span className="gal-member">
                <i />
                {status.member.name}
                <small>
                  {status.member.role === "admin" ? "管理员" : "成员"}
                </small>
              </span>
              {status.member.role === "admin" && (
                <button
                  onClick={() =>
                    run(async () => {
                      setMembers((await call(remote, "uiMembers")).items);
                      setNewToken(null);
                      setMembersOpen(true);
                    })
                  }
                >
                  成员
                </button>
              )}
              <button className="gal-primary" onClick={() => edit(null)}>
                ＋ 新建资源
              </button>
            </>
          )}
          <button title="Gallery 连接设置" onClick={() => setConnection(true)}>
            连接设置
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
      {!status ? (
        <div className="gal-empty">正在读取 Gallery 连接…</div>
      ) : !status.connected ? (
        <section className="gal-onboarding">
          <div className="gal-large-icon">
            <Icon />
          </div>
          <h2>连接你的团队资源库</h2>
          <p>每位成员在自己的 dsh 中，使用独立令牌连接同一台 Gallery 服务。</p>
          {status.error && <p className="gal-error">{status.error}</p>}
          <label>
            共享服务地址
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://gallery.your-team.com"
            />
          </label>
          <label>
            成员令牌
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="由团队管理员提供"
            />
          </label>
          <button
            disabled={busy || status.locked}
            className="gal-primary"
            onClick={() =>
              run(async () => {
                const s = await call(remote, "uiConnect", json({ url, token }));
                setStatus(s);
                setToken("");
                setNotice("已连接团队 Gallery");
              })
            }
          >
            {busy ? "连接中…" : "连接 Gallery"}
          </button>
          {status.locked && (
            <p>此连接由宿主配置管理，请修改宿主配置或环境变量。</p>
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
              <button
                className={scope === "published" ? "active" : ""}
                onClick={() => {
                  setScope("published");
                  setOffset(0);
                }}
              >
                已发布
              </button>
            </div>
            <input
              aria-label="搜索资源"
              className="gal-search"
              placeholder="搜索名称、描述、标签或作者…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className="gal-list-heading">
            <span>
              {type ? TYPES[type] : "团队资源"} <strong>{total}</strong>
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
                  : "团队资源，从第一份积累开始"}
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
                      {r.latestVersion ? `v${r.latestVersion}` : "未发布"}
                      {r.hasDraft ? " · 草稿" : ""}
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
                    <span>{r.ownerName}</span>
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
            <span>团队内发布即共享 · 使用固定版本引用资源</span>
            <span title={status.url}>{status.url}</span>
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
                  {selected.ownerName} ·{" "}
                  {selected.latestVersion
                    ? `最新发布 v${selected.latestVersion}`
                    : "尚未发布"}
                  {selected.hasDraft ? " · 有草稿修改" : ""}
                </p>
              </div>
              <button aria-label="关闭详情" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="gal-detail-actions">
              {selected.canEdit && (
                <button onClick={() => edit(selected)}>编辑草稿</button>
              )}
              {selected.published && (
                <>
                  <button
                    onClick={() =>
                      download(
                        `${content.name}.gallery.json`,
                        json(
                          {
                            format: "dsh-gallery-resource",
                            schemaVersion: 1,
                            resource: snapshot.resource,
                            source: {
                              id: selected.id,
                              version: snapshot.version,
                              digest: snapshot.digest,
                            },
                          },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    下载 v{snapshot.version}
                  </button>
                  <button
                    onClick={() =>
                      setReference(
                        json(
                          {
                            id: selected.id,
                            version: snapshot.version,
                            digest: snapshot.digest,
                          },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    获取引用
                  </button>
                </>
              )}
            </div>
            {reference && (
              <label className="gal-reference">
                供编排插件使用的固定版本引用
                <textarea readOnly rows={5} value={reference} />
              </label>
            )}
            <div className="gal-scopes gal-detail-tabs">
              <button
                className={tab === "content" ? "active" : ""}
                onClick={() => setTab("content")}
              >
                资源内容
              </button>
              <button
                className={tab === "versions" ? "active" : ""}
                onClick={() => setTab("versions")}
              >
                版本历史 ({versions.length})
              </button>
            </div>
            <div className="gal-dialog-body">
              {tab === "content" ? (
                <>
                  {viewedVersion && (
                    <p className="gal-hint">
                      正在查看不可变历史版本 v{viewedVersion.version}。
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
                  {selected.canEdit && selected.hasDraft && (
                    <p className="gal-hint">
                      正在查看作者草稿，团队其他成员仅能获取已发布版本。
                    </p>
                  )}
                  {content.files.map((f) => (
                    <details className="gal-file" key={f.path}>
                      <summary>
                        {f.path}
                        <span>
                          {f.encoding === "base64" ? "二进制 · " : ""}
                          {(
                            f.bytes ?? new Blob([f.content]).size
                          ).toLocaleString()}{" "}
                          B
                        </span>
                      </summary>
                      {f.encoding === "utf8" ? (
                        <pre>{f.content}</pre>
                      ) : (
                        <p>二进制附件包含在下载的资源包中。</p>
                      )}
                    </details>
                  ))}
                  {!content.files.length && (
                    <p className="gal-hint">尚未添加文件，请编辑草稿后上传。</p>
                  )}
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
                </>
              ) : versions.length === 0 ? (
                <p className="gal-hint">尚无发布版本。</p>
              ) : (
                versions.map((v) => (
                  <div className="gal-history" key={v.version}>
                    <div>
                      <strong>v{v.version}</strong>
                      <small>{when(v.createdAt)}</small>
                      <p>{v.note || "未填写版本说明"}</p>
                      <code title={v.digest}>
                        SHA-256 {v.digest.slice(0, 16)}…
                      </code>
                    </div>
                    <div>
                      <button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            setReference(
                              json(
                                {
                                  id: selected.id,
                                  version: v.version,
                                  digest: v.digest,
                                },
                                null,
                                2,
                              ),
                            );
                          })
                        }
                      >
                        获取引用
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            setViewedVersion(
                              await call(
                                remote,
                                "uiReadVersion",
                                selected.id,
                                json({ version: v.version }),
                              ),
                            );
                            setTab("content");
                          })
                        }
                      >
                        查看内容
                      </button>
                      {selected.canEdit && (
                        <button
                          disabled={busy}
                          onClick={async () => {
                            if (
                              await confirmAction(
                                `将 v${v.version} 恢复为新草稿？当前已保存草稿会被替换，发布历史保留。`,
                              )
                            )
                              run(async () => {
                                await call(
                                  remote,
                                  "uiRollback",
                                  selected.id,
                                  json({
                                    version: v.version,
                                    expectedRevision: selected.revision,
                                  }),
                                );
                                await load(selected.id);
                                setRefresh((x) => x + 1);
                                setNotice(
                                  `已将 v${v.version} 恢复为草稿，请检查后重新发布。`,
                                );
                              });
                          }}
                        >
                          恢复为草稿
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {selected.canEdit && selected.hasDraft && (
              <div className="gal-publish-bar">
                <input
                  aria-label="版本说明"
                  placeholder="版本说明，例如：新增检查步骤"
                  value={publishNote}
                  onChange={(e) => setPublishNote(e.target.value)}
                  maxLength={2000}
                />
                <button
                  className="gal-primary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const v = await call(
                        remote,
                        "uiPublish",
                        selected.id,
                        json({
                          expectedRevision: selected.revision,
                          note: publishNote,
                        }),
                      );
                      await load(selected.id);
                      setPublishNote("");
                      setRefresh((x) => x + 1);
                      setNotice(`v${v.version} 已发布，团队成员现在可以获取。`);
                    })
                  }
                >
                  {busy
                    ? "处理中…"
                    : `发布 v${(selected.latestVersion ?? 0) + 1}`}
                </button>
              </div>
            )}
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
                <div className="gal-eyebrow">RESOURCE DRAFT</div>
                <h2>{editor.id ? "编辑草稿" : "创建资源"}</h2>
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
                  固定版本依赖（JSON 数组，例如{" "}
                  {'[{"id":"资源ID","version":1}]'}）
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
              <span>草稿仅作者和管理员可见</span>
              <button
                className="gal-primary"
                disabled={busy}
                onClick={() => run(save)}
              >
                {busy ? "保存中…" : "保存草稿"}
              </button>
            </footer>
          </section>
        </div>
      )}
      {connection && (
        <div className="gal-overlay">
          <section
            className="gal-dialog gal-small"
            role="dialog"
            aria-modal="true"
            aria-label="连接设置"
          >
            <div className="gal-dialog-head">
              <h2>连接团队 Gallery</h2>
              <button
                aria-label="关闭连接设置"
                onClick={() => setConnection(false)}
              >
                ×
              </button>
            </div>
            <div className="gal-dialog-body">
              <label>
                服务地址
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://gallery.your-team.com"
                />
              </label>
              <label>
                成员令牌
                <input
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="填写新令牌以切换或重新连接"
                />
              </label>
              <p className="gal-hint">
                令牌仅保存在本机 dsh 宿主，不会返回浏览器。远程服务使用 HTTPS。
              </p>
              {status?.locked && (
                <p className="gal-error">连接由宿主配置或环境变量管理。</p>
              )}
            </div>
            <div className="gal-dialog-footer">
              <span>{status?.member?.name || "未连接"}</span>
              <button
                className="gal-primary"
                disabled={busy || status?.locked}
                onClick={() =>
                  run(async () => {
                    const s = await call(
                      remote,
                      "uiConnect",
                      json({ url, token }),
                    );
                    setStatus(s);
                    setToken("");
                    setConnection(false);
                    setSelected(null);
                    setRefresh((x) => x + 1);
                    setNotice("Gallery 连接已更新");
                  })
                }
              >
                验证并连接
              </button>
            </div>
          </section>
        </div>
      )}
      {membersOpen && (
        <div className="gal-overlay">
          <section
            className="gal-dialog gal-members"
            role="dialog"
            aria-modal="true"
            aria-label="团队成员"
          >
            <div className="gal-dialog-head">
              <div>
                <div className="gal-eyebrow">TEAM ACCESS</div>
                <h2>团队成员</h2>
                <p>每位成员使用独立令牌，资源作者身份由共享服务确定。</p>
              </div>
              <button
                aria-label="关闭成员管理"
                onClick={() => {
                  setMembersOpen(false);
                  setNewToken(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="gal-dialog-body">
              {newToken && (
                <div className="gal-token">
                  <strong>{newToken.name} 的成员令牌</strong>
                  <p>仅本次显示。请通过团队可信渠道交给本人。</p>
                  <textarea
                    aria-label="新成员令牌"
                    readOnly
                    rows={2}
                    value={newToken.token}
                  />
                </div>
              )}
              <div className="gal-form-row">
                <label className="gal-grow">
                  成员名称
                  <input
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="输入成员名称"
                  />
                </label>
                <label>
                  角色
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                  >
                    <option value="member">成员</option>
                    <option value="admin">管理员</option>
                  </select>
                </label>
                <button
                  className="gal-primary"
                  disabled={busy || !memberName.trim()}
                  onClick={() =>
                    run(async () => {
                      const x = await call(
                        remote,
                        "uiAddMember",
                        json({ name: memberName, role: memberRole }),
                      );
                      setNewToken({ name: x.member.name, token: x.token });
                      setMemberName("");
                      setMembers((await call(remote, "uiMembers")).items);
                    })
                  }
                >
                  添加成员
                </button>
              </div>
              {members.map((m) => (
                <div className="gal-member-row" key={m.id}>
                  <div>
                    <strong>{m.name}</strong>
                    <small>
                      {m.role === "admin" ? "管理员" : "成员"} ·{" "}
                      {m.active ? "有效" : "已停用"}
                    </small>
                  </div>
                  {m.id !== status.member.id && (
                    <div>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          if (
                            await confirmAction(
                              "重置令牌后，原令牌将立即失效。继续？",
                            )
                          )
                            run(async () => {
                              const x = await call(
                                remote,
                                "uiMemberAccess",
                                m.id,
                                json({ active: true }),
                              );
                              setNewToken({ name: m.name, token: x.token });
                              setMembers(
                                (await call(remote, "uiMembers")).items,
                              );
                            });
                        }}
                      >
                        重置令牌
                      </button>
                      {m.active && (
                        <button
                          disabled={busy}
                          onClick={async () => {
                            if (
                              await confirmAction(`停用 ${m.name} 的访问权限？`)
                            )
                              run(async () => {
                                await call(
                                  remote,
                                  "uiMemberAccess",
                                  m.id,
                                  json({ active: false }),
                                );
                                setMembers(
                                  (await call(remote, "uiMembers")).items,
                                );
                              });
                          }}
                        >
                          停用
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
