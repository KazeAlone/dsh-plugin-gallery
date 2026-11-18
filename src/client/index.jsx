import { createGalleryText } from "./locale.mjs";
import { GalleryLocale, useGalleryText } from "./i18n.jsx";
import React, { useEffect, useRef, useState } from "react";

import { REMOTE } from "../descriptors.mjs";
import styles from "./styles.css";
import { Leaderboards } from "./leaderboards.jsx";
import { createGalleryTrigger } from "./gallery-trigger.mjs";
import { McpWizard } from "./mcp-wizard.jsx";
import { WorkflowWizard } from "./workflow-wizard.jsx";
import { AgentWizard } from "./agent-wizard.jsx";
import { ResourceStart } from "./resource-start.jsx";
import { SkillWizard } from "./skill-wizard.jsx";
import { Modal } from "./modal.jsx";
import { BrandIcon } from "./brand-icon.jsx";
import { Glyph } from "./icons.jsx";
import { ResourceCover, hasResourceCover } from "./resource-cover.jsx";
import { THEMES, loadTheme, saveTheme } from "./theme.mjs";
import { AnimeMascot } from "./anime-mascot.jsx";
import { PaperBrowser, PaperDetail } from "./paper-browser.jsx";
import paperStyles from "./paper-browser.css";

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
const when = (s, language) => (s ? new Date(s).toLocaleString(language) : "");
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
function exportResource(content) {
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
          libraryId: content.libraryId,
          id: content.id,
          digest: content.digest,
        },
      },
      null,
      2,
    ),
  );
}
function Icon({ size = 20 }) {
  return <BrandIcon size={size} />;
}
function GalleryContent({ remote }) {
  const l = useGalleryText();
  const [theme, setTheme] = useState(() => loadTheme(globalThis.localStorage));
  const [paperDark, setPaperDark] = useState(() => {
    try { return globalThis.localStorage?.getItem("dsh-gallery-paper-dark") === "true"; } catch { return false; }
  });
  const [motionPaused, setMotionPaused] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);
  useEffect(() => {
    if (!themeMenu) return;
    const closeOutside = (event) => {
      if (!themeMenuRef.current?.contains(event.target)) setThemeMenu(false);
    };
    const closeEscape = (event) => {
      if (event.key === 'Escape') setThemeMenu(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [themeMenu]);
  const [status, setStatus] = useState(null),
    [error, setError] = useState(""),
    [notice, updateNotice] = useState(null),
    [busy, setBusy] = useState(false);
  function setNotice(message) {
    updateNotice(message ? { message } : null);
  }
  useEffect(() => {
    if (!notice) return;
    const root = document.createElement("div");
    root.className = "gal gal-toast-host";
    root.dataset.theme = theme;
    root.lang = l.language;
    root.dataset.paperDark = String(paperDark);
    const toast = document.createElement("div");
    toast.className = "gal-notice";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    const mark = document.createElement("span");
    mark.textContent = "✓";
    mark.setAttribute("aria-hidden", "true");
    const message = document.createElement("span");
    message.textContent = l(notice.message);
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", l("关闭提示"));
    close.addEventListener("click", () => updateNotice(null));
    toast.append(mark, message, close);
    root.append(toast);
    document.body.append(root);
    const timer = setTimeout(() => updateNotice(null), 5000);
    return () => {
      clearTimeout(timer);
      root.remove();
    };
  }, [notice, theme, paperDark, l]);
  const [boards, setBoards] = useState([]);
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
  const [creation, setCreation] = useState(null);
  const [skillWizard, setSkillWizard] = useState(false);
  const [agentWizard, setAgentWizard] = useState(false);
  const [mcpWizard, setMcpWizard] = useState(false);
  const [workflowWizard, setWorkflowWizard] = useState(false);
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
      setError(l(fail(e)));
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
        if (live) setError(l(fail(e)));
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!status?.ready || theme === "folio") return;
    let live = true;
    setLoading(true);
    const timer = setTimeout(
      () =>
        (type
          ? call(remote, "uiList", json({ type, scope, q, limit: 48, offset }))
          : Promise.all(
              Object.keys(TYPES).map(async (key) => ({
                type: key,
                ...(await call(
                  remote,
                  "uiList",
                  json({ type: key, q, sort: "usage", limit: 10, offset: 0 }),
                )),
              })),
            )
        )
          .then((x) => {
            if (live) {
              if (type) {
                setItems(x.items);
                setTotal(x.total);
              } else {
                setBoards(x);
                setTotal(x.reduce((sum, board) => sum + board.total, 0));
              }
            }
          })
          .catch((e) => {
            if (live) setError(l(fail(e)));
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
    theme,
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
    return r;
  }
  function edit(r, resourceType = type) {
    setNotice("");
    setError("");
    if (!r && !resourceType) return;
    setSelected(null);
    if (!r && ["skill", "agent"].includes(resourceType)) {
      setCreation(resourceType);
      return;
    }
    if ((r?.type || resourceType) === "skill") {
      setSkillWizard({ resource: r || null });
      return;
    }
    if ((r?.type || resourceType) === "agent") {
      setAgentWizard({ resource: r || null });
      return;
    }
    if ((r?.type || resourceType) === "mcp") {
      setMcpWizard({ resource: r || null });
      return;
    }
    if ((r?.type || resourceType) === "workflow") {
      setWorkflowWizard({ resource: r || null });
      return;
    }
    const d = r || { ...blank(), type: resourceType };
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
          if (r.type !== editor.resource.type)
            throw new Error(
              l("资源包类型不匹配，请在 {0} 分类中导入。", TYPES[r.type] || r.type),
            );
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
        if (size > 5 * 1024 * 1024) throw new Error(l("文件总量不能超过 5 MiB"));
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
    setNotice(l("资源已保存。"));
  }
  async function closeEditor() {
    if (busy) return;
    if (await confirmAction(l("放弃尚未保存的修改？"))) setEditor(null);
  }
  function closeStorage() {
    if (busy) return;
    return run(async () => {
      if (!storageSettings.configured) {
        const storage = await call(remote, "uiConfigureStorage", json({ type: "internal" }));
        setStatus((x) => ({ ...x, storage }));
      }
      setStorageSettings(null);
    });
  }
  async function removeResource(resource) {
    if (
      busy ||
      !(await confirmAction(
        l("删除「{0}」？资源和累计调用记录将被删除，无法恢复。", resource.name),
      ))
    )
      return;
    await run(async () => {
      await call(
        remote,
        "uiDelete",
        resource.id,
        json({ expectedRevision: resource.revision }),
      );
      setSelected(null);
      setOffset(0);
      setRefresh((x) => x + 1);
      setNotice(l("资源已删除。"));
    });
  }
  const content = selected;
  const activeFile = editor?.resource.files[editor.fileIndex];
  const chooseFilter = (t) => {
    setType(t);
    setOffset(0);
  };
  const themePicker = (
    <div className="gal-theme-picker" ref={themeMenuRef}>
      <button
        className="gal-icon-button"
        aria-label={l("切换主题")}
        aria-expanded={themeMenu}
        title={l("主题 · {0}", l(THEMES.find((item) => item.id === theme)?.label))}
        onClick={() => setThemeMenu((open) => !open)}
      >
        <Glyph name="palette" size={20} />
      </button>
      {themeMenu && (
        <div className="gal-theme-menu" role="group" aria-label={l("选择主题")}>
          {THEMES.map((item) => (
            <button
              key={item.id}
              aria-pressed={theme === item.id}
              onClick={() => {
                saveTheme(globalThis.localStorage, item.id);
                setTheme(item.id);
                setThemeMenu(false);
              }}
            >
              <span
                className={`gal-theme-swatch ${item.id}`}
                aria-hidden="true"
              />
              <span>
                <strong>{l(item.label)}</strong>
                <small>{l(item.hint)}</small>
              </span>
              {theme === item.id && <Glyph name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
  const openStorage = () => run(async () => {
    const settings = await call(remote, "uiStorageSettings");
    setStorageSettings(settings);
    setConnectionResult("");
  });
  const publishWorkflow = () => run(async () => {
    const result = await call(remote, "uiPublishWorkflow", selected.id);
    setNotice(l("已注册到 TeamFlow：{0} v{1}", result.name, result.version));
  });
  return (
    <div className="gal" lang={l.language} data-theme={theme} data-motion-paused={motionPaused} data-paper-dark={paperDark}>
      {theme === "astral" && (
        <div className="gal-astral-sky" aria-hidden="true">
          <svg className="gal-astral-chart" viewBox="0 0 540 240" fill="none">
            <g stroke="currentColor" strokeWidth="0.7">
              <circle cx="270" cy="68" r="144" />
              <circle cx="270" cy="68" r="126" strokeDasharray="2 5" />
              <circle cx="270" cy="68" r="106" />
              <path d="M24 68h492M270 0v224M133 0l274 136M407 0L133 136" opacity=".45" />
            </g>
            <circle className="gal-astral-orbit" cx="376" cy="68" r="3.5" fill="#fff4c9" />
            <path d="M270 43l5 20 20 5-20 5-5 20-5-20-20-5 20-5z" fill="#fff1c9" />
          </svg>
          <span className="gal-astral-meteor" />
          <span className="gal-astral-meteor" />
          <span className="gal-astral-meteor" />
        </div>
      )}
      {(theme !== "folio" || !status?.ready) && <header className="gal-header">
        {theme === "anime" && <AnimeMascot />}
        <div>
          <h1>
            <BrandIcon size={32} />
            Gallery
            {theme === "astral" && <span className="gal-astral-title">{l("鎏金星穹")}</span>}
          </h1>
        </div>
        <div className="gal-header-actions">
          {theme === "astral" && (
            <button className="gal-astral-motion" type="button"
              onClick={() => setMotionPaused((paused) => !paused)}>
              {motionPaused ? l("继续动效") : l("暂停动效")}
            </button>
          )}
          {themePicker}
          <button
            className="gal-icon-button"
            aria-label={l("存储设置")}
            title={
              l("存储设置 · ") +
              l(status?.storage?.libraries.find(
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
        </div>
      </header>}
      {error && (
        <div role="alert" className="gal-alert">
          {l(error)}
          <button aria-label={l("关闭错误")} onClick={() => setError("")}>
            <Glyph name="close" />
          </button>
        </div>
      )}
      {!status?.ready ? (
        <div className="gal-empty">
          {error
            ? l("资源库暂时不可用，请检查提示后刷新。")
            : l("正在打开本地资源库…")}
        </div>
      ) : theme === "folio" ? (
        <PaperBrowser remote={remote} status={status} refresh={refresh} busy={busy}
          onError={setError} onOpen={r => run(() => load(r.id))}
          onCreate={resourceType => { chooseFilter(resourceType); edit(null, resourceType); }}
          onRefresh={() => { setError(""); setRefresh(x => x + 1); }} onStorage={openStorage}
          themePicker={themePicker} dark={paperDark} onToggleDark={() => setPaperDark(current => {
            const next = !current;
            try { globalThis.localStorage?.setItem("dsh-gallery-paper-dark", String(next)); } catch { /* Apply for this visit. */ }
            return next;
          })} />
      ) : (
        <>
          <div className="gal-toolbar">
            <nav className="gal-filters" aria-label={l("资源类型")}>
              <button
                className={!type ? "active" : ""}
                aria-pressed={!type}
                onClick={() => {
                  setScope("all");
                  chooseFilter("");
                }}
              >
                <Glyph name="grid" />{l("全部")}</button>
              {Object.entries(TYPES).map(([key, label]) => (
                <button
                  key={key}
                  className={type === key ? "active" : ""}
                  aria-pressed={type === key}
                  onClick={() => chooseFilter(key)}
                >
                  <Glyph name={key} />
                  {l(label)}
                </button>
              ))}
            </nav>
            <div className="gal-search-wrap">
              <Glyph name="search" />
              <input
                aria-label={l("搜索资源")}
                className="gal-search"
                placeholder={l("搜索资源、用户名或标签…")}
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
              {type ? TYPES[type] : l("调用榜")} <strong>{total}</strong>
            </span>
            <div className="gal-list-actions">
              {type && (
                <button
                  className="gal-primary"
                  disabled={busy}
                  onClick={() => edit(null)}
                >
                  <Glyph name="plus" />{l("新建 ")}{TYPES[type]}
                </button>
              )}
              <button
                className="gal-icon-button"
                title={l("刷新资源")}
                aria-label={l("刷新")}
                disabled={busy}
                onClick={() => setRefresh((x) => x + 1)}
              >
                <Glyph name="refresh" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="gal-empty">{l("正在加载资源…")}</div>
          ) : !type ? (
            <Leaderboards
              boards={boards}
              busy={busy}
              filtered={!!q}
              onOpen={(r) => run(() => load(r.id))}
              onCategory={chooseFilter}
            />
          ) : items.length === 0 ? (
            <div className="gal-empty">
              <Icon />
              <h3>
                {q || type || scope !== "all" ? l("没有匹配的资源") : l("暂无资源")}
              </h3>
              <p>
                {q || type || scope !== "all"
                  ? l("试试其他关键词或分类。")
                  : l("选择分类后新建资源。")}
              </p>
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
                  <ResourceCover resource={r} />
                  <div className="gal-resource-content">
                    <h3>{r.name}</h3>
                    {r.description && <p>{r.description}</p>}
                  </div>
                  <p
                    className="gal-card-creator"
                    title={l("创建者：{0}", r.creator?.username || l("未记录"))}
                  >
                    <Glyph name="user" size={15} />
                    {r.creator?.username || l("未记录")}
                  </p>
                  <div className="gal-tags">
                    {r.tags.slice(0, 2).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <footer>
                    {hasResourceCover(r.type) && (
                      <span
                        title={l("累计调用次数")}
                        aria-label={l("累计调用 {0} 次", r.usageCount ?? 0)}
                      >
                        <Glyph name="usage" size={15} />
                        {(r.usageCount ?? 0).toLocaleString(l.language)}{l(" 次")}</span>
                    )}
                    <span title={l("文件数量")}>
                      <Glyph name="file" size={15} />
                      {r.fileCount}
                    </span>
                    <span title={l("更新时间")}>
                      <Glyph name="clock" size={15} />
                      {new Date(r.updatedAt).toLocaleDateString(l.language)}
                    </span>
                  </footer>
                </button>
              ))}
            </div>
          )}
          {type && total > 48 && (
            <div className="gal-pagination">
              <button
                disabled={!offset}
                onClick={() => setOffset((x) => Math.max(0, x - 48))}
              >{l("上一页")}</button>
              <span>
                {Math.floor(offset / 48) + 1} / {Math.ceil(total / 48)}
              </span>
              <button
                disabled={offset + 48 >= total}
                onClick={() => setOffset((x) => x + 48)}
              >{l("下一页")}</button>
            </div>
          )}
        </>
      )}
      {creation && <ResourceStart type={creation} onClose={() => setCreation(null)}
        onBlank={() => { const setter = creation === "skill" ? setSkillWizard : setAgentWizard; setter({resource:null}); setCreation(null); }}
        onImported={importedResource => { const setter = creation === "skill" ? setSkillWizard : setAgentWizard; setter({resource:null,importedResource}); setCreation(null); }}
        onBrowse={payload => call(remote,"uiImportDirectory",json(payload))}
        onRead={payload => call(remote,"uiImportResource",json(payload))} />}
      {workflowWizard && <WorkflowWizard onExtract={(resourceId) => call(remote,"uiExtractWorkflowAgent",json({resourceId}))} onGet={id => call(remote, "uiGet", id)} onList={async type => {
        const rows = [];
        for (let offset = 0; ; offset += 100) {
          const page = await call(remote, "uiList", json({ type, limit: 100, offset }));
          rows.push(...page.items);
          if (rows.length >= page.total || !page.items.length) return rows;
        }
      }} resource={workflowWizard.resource} onClose={async () => { if (await confirmAction(l("放弃尚未保存的 Workflow？"))) setWorkflowWizard(false); }} onSave={async (resource) => {
        const existing = workflowWizard.resource;
        await (existing ? call(remote, "uiUpdate", existing.id, json({ resource, expectedRevision: existing.revision })) : call(remote, "uiCreate", json(resource)));
        setSelected(null); setWorkflowWizard(false); setRefresh(x => x + 1); setNotice(l("Workflow 已保存。"));
      }} />}
      {mcpWizard && (
        <McpWizard
          resource={mcpWizard.resource}
          onClose={async () => {
            if (await confirmAction(l("放弃尚未保存的 MCP？")))
              setMcpWizard(false);
          }}
          onCheck={(config) => call(remote, "uiCheckMcp", json(config))}
          onSave={async (resource) => {
            const existing = mcpWizard.resource;
            await (existing
              ? call(
                  remote,
                  "uiUpdate",
                  existing.id,
                  json({ resource, expectedRevision: existing.revision }),
                )
              : call(remote, "uiCreate", json(resource)));
            setSelected(null);
            setMcpWizard(false);
            setRefresh((x) => x + 1);
            setNotice(l("MCP 已保存。"));
          }}
        />
      )}
      {agentWizard && (
        <AgentWizard
          importedResource={agentWizard.importedResource}
          resource={agentWizard.resource}
          onClose={async () => {
            if (await confirmAction(l("放弃尚未保存的 Agent？")))
              setAgentWizard(false);
          }}
          onSave={async (resource) => {
            const existing = agentWizard.resource;
            await (existing
              ? call(
                  remote,
                  "uiUpdate",
                  existing.id,
                  json({ resource, expectedRevision: existing.revision }),
                )
              : call(remote, "uiCreate", json(resource)));
            setSelected(null);
            setAgentWizard(false);
            setRefresh((x) => x + 1);
            setNotice(l("Agent 已保存。"));
          }}
        />
      )}
      {skillWizard && (
        <SkillWizard
          importedResource={skillWizard.importedResource}
          resource={skillWizard.resource}
          onClose={async () => {
            if (await confirmAction(l("放弃尚未保存的 Skill？")))
              setSkillWizard(false);
          }}
          onSave={async (resource) => {
            const existing = skillWizard.resource;
            await (existing
              ? call(
                  remote,
                  "uiUpdate",
                  existing.id,
                  json({ resource, expectedRevision: existing.revision }),
                )
              : call(remote, "uiCreate", json(resource)));
            setSelected(null);
            setSkillWizard(false);
            setRefresh((x) => x + 1);
            setNotice(l("Skill 已保存。"));
          }}
        />
      )}
      {theme === "folio" && selected && !editor && !skillWizard && !agentWizard && !mcpWizard && !workflowWizard && (
        <PaperDetail key={selected.id} resource={selected} busy={busy} error={l(error)}
          onClose={() => setSelected(null)} onEdit={() => edit(selected)}
          onDelete={() => removeResource(selected)} onExport={() => exportResource(selected)}
          onPublish={publishWorkflow} />
      )}
      {theme !== "folio" && selected && !editor && !skillWizard && !agentWizard && !mcpWizard && !workflowWizard && (
        <Modal onClose={() => !busy && setSelected(null)}>
          <section
            tabIndex={-1}
            className="gal-dialog gal-detail"
            role="dialog"
            aria-modal="true"
            aria-label={l("资源详情")}
          >
            <div className="gal-dialog-head">
              <div>
                <span className={"gal-pill " + selected.type}>
                  <Glyph name={selected.type} size={16} />
                  {TYPES[selected.type]}
                </span>
                <h2>{content.name}</h2>
                <p>{l("创建者：")}{content.creator?.username || l("未记录")}</p>
                <p>{l("更新于 ")}{when(selected.updatedAt, l.language)}</p>
              </div>
              <button
                disabled={busy}
                aria-label={l("关闭详情")}
                onClick={() => setSelected(null)}
              >
                <Glyph name="close" />
              </button>
            </div>
            {hasResourceCover(content.type) && <ResourceCover resource={content} />}
            {selected.type === "workflow" &&
              selected.metadata?.workflowCanvas?.agents?.some(
                (agent) => agent.skills?.length || agent.mcps?.length,
              ) && (
                <p>{l("原有 Skill 和 MCP 引用保留在 Gallery 中。TeamFlow 按 Agent 节点的两个开关启用资源。")}</p>
              )}
            <div className="gal-detail-actions">
              {selected.type === "workflow" && selected.files.some(f => f.path === "workflow.json") && <button disabled={busy} onClick={() => run(async () => { const result = await call(remote, "uiPublishWorkflow", selected.id); setNotice(l("已注册到 TeamFlow：{0} v{1}", result.name, result.version)); })}><Glyph name="workflow" />{l("注册到 TeamFlow")}</button>}
              {selected.canEdit && (
                <button disabled={busy} onClick={() => edit(selected)}>
                  <Glyph name="edit" />{l("编辑资源")}</button>
              )}
              <button
                onClick={() =>
                  exportResource(content)
                }
              >
                <Glyph name="download" />{l("下载资源")}</button>
              {selected.canDelete && (
                <button
                  className="gal-delete"
                  disabled={busy}
                  onClick={() => removeResource(selected)}
                >
                  <Glyph name="trash" />{l("删除资源")}</button>
              )}
            </div>
            <div className="gal-dialog-body">
              {error && (
                <p role="alert" className="gal-error">
                  {l(error)}
                </p>
              )}
              {hasResourceCover(content.type) && (
                <p className="gal-usage-total">
                  <Glyph name="usage" />{l(" 累计调用次数")}{" "}
                  <strong>{(content.usageCount ?? 0).toLocaleString(l.language)}</strong>{" "}{l("次")}</p>
              )}
              {content.type === "mcp" && (
                <p>{content.metadata?.mcpVerification?.checkedAt ? l("已通过连接检查") : l("未验证连接")}</p>
              )}
              <p className="gal-description">
                {content.description || l("暂无描述")}
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
                    <p>{l("二进制附件包含在下载的资源包中。")}</p>
                  )}
                </details>
              ))}
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
            aria-label={editor.id ? l("编辑资源") : l("新建资源")}
          >
            <div className="gal-dialog-head">
              <div>
                <h2>
                  {editor.id ? l("编辑") : l("新建")} {TYPES[editor.resource.type]}
                </h2>
              </div>
              <button
                aria-label={l("关闭编辑")}
                onClick={closeEditor}
                disabled={busy}
              >
                <Glyph name="close" />
              </button>
            </div>
            <div className="gal-dialog-body">
              <div className="gal-form-row">
                <div className="gal-type-field">
                  <span>{l("类型")}</span>
                  <span className="gal-editor-type">
                    <Glyph name={editor.resource.type} />
                    {TYPES[editor.resource.type]}
                  </span>
                </div>
                <label className="gal-grow">{l("资源名称")}<input
                    value={editor.resource.name}
                    maxLength={160}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder={l("输入资源名称")}
                  />
                </label>
              </div>
              <label>{l("描述")}<textarea
                  rows={3}
                  value={editor.resource.description}
                  onChange={(e) => field("description", e.target.value)}
                  placeholder={l("资源描述（选填）")}
                  maxLength={10000}
                />
              </label>
              <label>{l("标签")}<input
                  value={editor.tags}
                  onChange={(e) => change("tags", e.target.value)}
                  placeholder={l("标签，用逗号分隔")}
                />
              </label>
              <div className="gal-file-toolbar">
                <h3>{l("资源文件 ")}<small>{editor.resource.files.length} / 100</small>
                </h3>
                <div>
                  <label className="gal-upload">
                    <Glyph name="upload" />{l("上传文件")}<input
                      aria-label={l("上传资源文件")}
                      type="file"
                      multiple
                      onChange={(e) => {
                        upload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label className="gal-upload">
                    <Glyph name="folder" />{l("上传文件夹")}<input
                      aria-label={l("上传资源文件夹")}
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
                  aria-label={l("新文件路径")}
                  placeholder={l("新文件路径，例如 SKILL.md")}
                  value={editor.newPath}
                  onChange={(e) => change("newPath", e.target.value)}
                />
                <button
                  disabled={!editor.newPath.trim()}
                  onClick={() => {
                    const p = editor.newPath.trim();
                    if (editor.resource.files.some((f) => f.path === p)) {
                      change("importError", l("该文件已存在"));
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
                >{l("添加文本文件")}</button>
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
                    <p>{l("可上传已有文件，也可直接创建文本文件。")}</p>
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
                        >{l("移除文件")}</button>
                      </div>
                      {activeFile.encoding === "utf8" ? (
                        <textarea
                          aria-label={l("文件内容")}
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
                        <p>{l("二进制文件已上传，可移除后重新上传替换。")}</p>
                      )}
                    </>
                  ) : (
                    <div className="gal-code-placeholder">{l("选择文件以查看或编辑")}</div>
                  )}
                </div>
              </div>
            </div>
            <footer className="gal-dialog-footer">
              <button disabled={busy} onClick={closeEditor}>{l("取消")}</button>
              <button
                className="gal-primary"
                disabled={busy}
                onClick={() => run(save)}
              >
                {busy ? l("保存中…") : l("保存资源")}
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
                {storageSettings.configured ? l("资源库存储") : l("选择资源库存储")}
              </h2>
              <button
                aria-label={l("关闭存储设置")}
                disabled={busy}
                onClick={closeStorage}
              >
                <Glyph name="close" />
              </button>
            </div>
            <div className="gal-dialog-body">
              <div className="gal-storage-providers">
                {storageSettings.providers.map((provider) => (
                  <button
                    type="button"
                    key={provider.type}
                    className={(storageSettings.type || (storageSettings.activeLibraryId === "center" ? "service" : "internal")) === provider.type ? "active" : ""}
                    aria-pressed={(storageSettings.type || (storageSettings.activeLibraryId === "center" ? "service" : "internal")) === provider.type}
                    disabled={busy}
                    onClick={() => { setStorageSettings(x => ({ ...x, type: provider.type })); setConnectionResult(""); }}
                  >
                    <strong>{l(provider.name)}</strong>
                  </button>
                ))}
              </div>
              {(storageSettings.type || (storageSettings.activeLibraryId === "center" ? "service" : "internal")) === "service" && <>
                <label className="gal-username-setting">{l("服务地址")}<input type="text" placeholder="109.105.132.53:8088" value={storageSettings.service?.url || ""}
                    onChange={e => { setStorageSettings(x => ({ ...x, service: { ...x.service, url: e.target.value } })); setConnectionResult(""); }} />
                </label>
                <p>{l("填写服务器 IP 和端口即可，无需接入密钥或证书。")}</p>
                <p>{l("首次接入后自动保存此 DSH 的独立身份。所有成员可查看和使用资源，仅创建者可编辑和删除。")}</p>
                <label className="gal-storage-consent"><input type="checkbox" checked={Boolean(storageSettings.service?.allowStdio)}
                  onChange={e => setStorageSettings(x => ({ ...x, service: { ...x.service, allowStdio: e.target.checked } }))} />{l("允许中心 stdio MCP 在此 DSH 执行本机命令（仅信任资源作者时开启）")}</label>
              </>}
              <p>{l("切换后显示对应资源库；已有资源保留在原处，不自动迁移。")}</p>
              <label className="gal-username-setting">{l("用户名")}<input
                  value={storageSettings.username || ""}
                  maxLength={80}
                  placeholder={l("新资源的创建者名称")}
                  onChange={(e) =>
                    setStorageSettings((x) => ({
                      ...x,
                      username: e.target.value,
                    }))
                  }
                />
              </label>
              <button
                disabled={busy || !storageSettings.username?.trim()}
                onClick={() =>
                  run(async () => {
                    const storage = await call(
                      remote,
                      "uiSetUsername",
                      json({ username: storageSettings.username }),
                    );
                    setStorageSettings(x => ({ ...storage, type: x.type, service: x.service || storage.service }));
                    setStatus((x) => ({ ...x, storage }));
                    setConnectionResult(l("用户名已保存，用于之后创建的资源。"));
                  })
                }
              >{l("保存用户名")}</button>
              {connectionResult && <p role="status">{l(connectionResult)}</p>}
              {error && <p role="alert">{l(error)}</p>}
            </div>
            <footer className="gal-dialog-footer">
              <span className="gal-local">v0.31.0</span>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await call(
                      remote,
                      "uiTestStorage",
                      json({ type: storageSettings.type || (storageSettings.activeLibraryId === "center" ? "service" : "internal"), ...storageSettings.service }),
                    );
                    setConnectionResult(l("资源库可用"));
                  })
                }
              >{l("检查存储")}</button>
              <button
                className="gal-primary"
                disabled={busy}
                onClick={() => run(async () => {
                  await call(remote, "uiSetUsername", json({ username: storageSettings.username }));
                  const storage = await call(remote, "uiConfigureStorage", json({
                    type: storageSettings.type || (storageSettings.activeLibraryId === "center" ? "service" : "internal"),
                    ...storageSettings.service,
                  }));
                  setStatus(x => ({ ...x, storage }));
                  setSelected(null);
                  setEditor(null);
                  setStorageSettings(null);
                  setOffset(0);
                  setRefresh(x => x + 1);
                  setNotice(l("存储设置已保存"));
                })}
              >
                {busy ? l("处理中…") : l("完成")}
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
            aria-label={l("确认操作")}
          >
            <div className="gal-dialog-head">
              <h2>{l("确认操作")}</h2>
            </div>
            <div className="gal-dialog-body">
              <p>{l(confirmation.message)}</p>
            </div>
            <div className="gal-dialog-footer">
              <button autoFocus onClick={() => answerConfirmation(false)}>{l("取消")}</button>
              <button
                className="gal-primary"
                onClick={() => answerConfirmation(true)}
              >{l("确认")}</button>
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}
function Gallery({ remote, t }) {
  return <GalleryLocale t={t}><GalleryContent remote={remote} /></GalleryLocale>;
}
export const inject = ["remote", "slots", "locale", "inputTriggers"];
export async function apply(ctx) {
  await ctx.remote.$mount(REMOTE);
  const remote = ctx.get("remote.gallery");
  ctx.effect(() =>
    ctx.locale.register(NS, {
      zh: { title: "Gallery", "language.code": "zh" },
      en: { title: "Gallery", "language.code": "en" },
    }),
  );
  ctx.effect(() =>
    ctx.inputTriggers.registerSource(createGalleryTrigger(remote, Icon, () => createGalleryText(ctx.locale.bind?.(NS)?.("language.code")))),
  );
  ctx.effect(() => {
    const s = document.createElement("style");
    s.dataset.gallery = "styles";
    s.textContent = styles + "\n" + paperStyles;
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
