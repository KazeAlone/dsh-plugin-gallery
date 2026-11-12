import React, { useEffect, useRef, useState } from "react";
import { Glyph } from "./icons.jsx";
import { Modal } from "./modal.jsx";

const TYPES = {
  skill: { name: "Skill", color: "#8063ad", tint: "#ede7f7" },
  agent: { name: "Agent", color: "#4f7fa9", tint: "#e3edf6" },
  mcp: { name: "MCP", color: "#418b79", tint: "#e1f0eb" },
  workflow: { name: "Workflow", color: "#b57c42", tint: "#f4e8db" },
};
const author = (r) => r.creator?.username || "未记录";
const count = (r) => (r.usageCount ?? 0).toLocaleString();
const palette = (r) => ({
  "--pb-color": TYPES[r.type]?.color,
  "--pb-tint": TYPES[r.type]?.tint,
});
const date = (value) =>
  value ? new Date(value).toLocaleDateString() : "未记录";

export function PaperCover({ resource, className = "" }) {
  return (
    <div className={`pb-cover ${className}`} style={palette(resource)}>
      <span className="pb-cover-label">
        {resource.type.toUpperCase()} / GALLERY
      </span>
      <PaperArt type={resource.type} />
      <span className="pb-cover-code">
        {TYPES[resource.type]?.name} COLLECTION
      </span>
    </div>
  );
}

function PaperArt({ type }) {
  const c = TYPES[type]?.color || "#8063ad";
  return (
    <svg
      viewBox="0 0 360 170"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      fill="none"
    >
      {type === "skill" && (
        <>
          <circle cx="235" cy="73" r="65" fill={c} opacity=".08" />
          <g transform="translate(116 22) rotate(-8 60 60)">
            <rect
              x="-17"
              y="13"
              width="96"
              height="103"
              rx="7"
              fill={c}
              opacity=".13"
            />
            <rect width="96" height="110" rx="7" fill="#fff" />
            <rect
              x="16"
              y="17"
              width="25"
              height="7"
              rx="3"
              fill={c}
              opacity=".6"
            />
            <path
              d="M16 43h62M16 56h45M16 69h62M16 82h35"
              stroke={c}
              strokeWidth="3"
              opacity=".35"
            />
            <circle cx="87" cy="92" r="22" fill={c} />
            <path d="m78 92 7 7 13-15" stroke="white" strokeWidth="3" />
          </g>
        </>
      )}
      {type === "agent" && (
        <>
          <ellipse cx="180" cy="136" rx="66" ry="8" fill={c} opacity=".1" />
          <circle cx="180" cy="77" r="64" stroke={c} strokeOpacity=".12" />
          <path
            d="M124 145c2-33 27-47 56-47s54 14 56 47"
            fill={c}
            opacity=".3"
          />
          <circle cx="180" cy="62" r="34" fill="white" />
          <path
            d="M148 60c-2-25 30-49 55-29 10 8 13 20 10 35-7-4-16-14-18-22-10 12-28 17-47 16"
            fill={c}
          />
          <path d="M167 77c7 7 16 7 24 0" stroke={c} strokeWidth="2" />
          <circle cx="169" cy="65" r="2" fill={c} />
          <circle cx="192" cy="65" r="2" fill={c} />
          <path
            d="m245 33 3 9 10 3-10 3-3 10-3-10-10-3 10-3z"
            fill={c}
            opacity=".6"
          />
        </>
      )}
      {type === "mcp" && (
        <g stroke={c}>
          <path
            d="M105 100 163 49l80 20-39 58-99-27 138-31M163 49l41 78"
            strokeWidth="1.6"
            opacity=".4"
          />
          <circle cx="163" cy="49" r="13" fill="#fff" />
          <circle cx="105" cy="100" r="17" fill={c} stroke="none" />
          <circle cx="243" cy="69" r="22" fill="#fff" />
          <circle cx="204" cy="127" r="9" fill={c} stroke="none" />
          <circle cx="243" cy="69" r="10" strokeDasharray="2 3" />
          <circle cx="174" cy="83" r="65" opacity=".15" />
        </g>
      )}
      {type === "workflow" && (
        <>
          <path
            d="M90 65h85v54h82M175 65h82"
            stroke={c}
            strokeWidth="2"
            opacity=".5"
          />
          <g fill="white">
            <rect x="53" y="42" width="78" height="44" rx="8" />
            <rect x="215" y="42" width="78" height="44" rx="8" />
          </g>
          <path d="m237 98 23 22-23 22-23-22z" fill={c} />
          <circle cx="77" cy="64" r="7" fill={c} opacity=".5" />
          <path
            d="M92 59h24M92 68h16M230 59h48M230 69h30"
            stroke={c}
            strokeWidth="3"
            opacity=".35"
          />
          <path d="m235 114 4 5-4 5" stroke="white" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

function PaperCard({ resource: r, busy, onOpen }) {
  return (
    <button
      className="pb-card"
      disabled={busy}
      onClick={() => onOpen(r)}
      aria-label={`查看 ${r.name}`}
    >
      <PaperCover resource={r} />
      <div className="pb-card-content">
        <h3>{r.name}</h3>
        <p className="pb-desc">{r.description || "暂无描述"}</p>
        <div className="pb-tags">
          {r.tags?.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="pb-card-foot">
          <span className="pb-mini-avatar" style={palette(r)}>
            {[...author(r)][0]?.toUpperCase()}
          </span>
          <span className="pb-author">{author(r)}</span>
          <span className="pb-uses" title="累计调用次数">
            ↗ {count(r)} 次调用
          </span>
        </div>
      </div>
    </button>
  );
}

/** Presentation-only theme: all reads use the existing Gallery RPC contract. */
export function PaperBrowser({
  remote,
  status,
  refresh,
  busy,
  onOpen,
  onCreate,
  onError,
  onRefresh,
  onStorage,
  themePicker,
  dark,
  onToggleDark,
}) {
  const [view, setView] = useState("discover");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("usage");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(0);
  const search = useRef(null);
  useEffect(() => {
    setPage(0);
  }, [refresh, status?.storage?.activeLibraryId]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadError(false);
    (async () => {
      const all = [];
      for (let offset = 0; ; offset += 100) {
        const result = await remote.uiList(
          JSON.stringify({ limit: 100, offset, sort: "usage" }),
        );
        if (result?.ok === false)
          throw new Error(result.error?.message || "资源加载失败");
        const data = result?.ok === true ? result.value : result;
        if (!live) return;
        all.push(...data.items);
        if (!data.items.length || all.length >= data.total) break;
      }
      if (live) setRows(all);
    })()
      .catch((e) => {
        if (live) {
          setLoadError(true);
          onError(e?.rpcError?.message || e.message);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [remote, refresh, status?.storage?.activeLibraryId, onError]);
  useEffect(() => {
    const shortcut = (e) => {
      if (
        e.key !== "/" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        document.querySelector("[data-gallery-modal]")
      )
        return;
      if (
        e.target.isContentEditable ||
        /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
      )
        return;
      e.preventDefault();
      search.current?.focus();
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  const choose = (next) => {
    setView(next);
    setTag("");
    setQ("");
    setPage(0);
  };
  const matches = (r) =>
    [r.name, r.description, author(r), ...(r.tags || [])]
      .join(" ")
      .toLocaleLowerCase()
      .includes(q.trim().toLocaleLowerCase());
  const relevant = rows.filter(
    (r) =>
      TYPES[r.type] &&
      (view === "discover" || view === "all" || r.type === view) &&
      matches(r),
  );
  const tags = [...new Set(relevant.flatMap((r) => r.tags || []))].sort(
    (a, b) => a.localeCompare(b),
  );
  const filtered = relevant
    .filter((r) => !tag || r.tags?.includes(tag))
    .sort(
      (a, b) =>
        (sort === "usage"
          ? (b.usageCount ?? 0) - (a.usageCount ?? 0)
          : new Date(b.updatedAt) - new Date(a.updatedAt)) ||
        a.name.localeCompare(b.name),
    );
  const top = (type) =>
    rows
      .filter((r) => r.type === type && matches(r))
      .sort(
        (a, b) =>
          (b.usageCount ?? 0) - (a.usageCount ?? 0) ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 3);
  const featured = top("workflow")[0];
  const username = status?.storage?.username || "本地用户";
  const category = TYPES[view];
  const nav = (key, label, icon) => (
    <button
      key={key}
      className={`pb-nav-item ${view === key ? "active" : ""}`}
      aria-pressed={view === key}
      onClick={() => choose(key)}
    >
      <Glyph name={icon} size={18} />
      <span>{label}</span>
      {key !== "discover" && (
        <small>
          {rows.filter((r) => key === "all" || r.type === key).length}
        </small>
      )}
    </button>
  );
  return (
    <div className="pb-app">
      <aside className="pb-sidebar">
        <div className="pb-brand">
          <span className="pb-brand-symbol">g.</span>Gallery
        </div>
        <div className="pb-side-label">WORKSPACE</div>
        {nav("discover", "发现资源", "grid")}
        {nav("all", "全部资源", "grid")}
        <div className="pb-side-label">COLLECTIONS</div>
        <nav className="pb-side-categories" aria-label="资源分类">
          {Object.entries(TYPES).map(([key, t]) => nav(key, t.name, key))}
        </nav>
        <div className="pb-profile">
          <span className="pb-avatar">
            {[...username].slice(0, 2).join("").toUpperCase()}
          </span>
          <div>
            <strong>{username}</strong>
            <small>资源库 · {rows.length} 个资源</small>
          </div>
        </div>
      </aside>
      <div className="pb-workspace">
        <header className="pb-topbar">
          <span className="pb-breadcrumb">
            工作区 <span>/ Gallery</span>
          </span>
          <span className="pb-theme-label">PAPER COLLECTION</span>
          <div className="pb-top-right">
            <button
              className="pb-storage"
              onClick={onStorage}
              disabled={busy}
              aria-label="存储设置"
            >
              <Glyph name="settings" size={15} />
              <span>
                {status?.storage?.libraries?.find(
                  (l) => l.id === status.storage.activeLibraryId,
                )?.name || "本地存储"}
              </span>
            </button>
            <button
              className="pb-theme-button"
              onClick={onToggleDark}
              aria-label={dark ? "切换浅色" : "切换深色"}
              title={dark ? "切换浅色" : "切换深色"}
            >
              ◐
            </button>
            {themePicker}
          </div>
        </header>
        <main className="pb-main">
          <div className="pb-intro">
            <div>
              <div className="pb-eyebrow">YOUR TOOL COLLECTION</div>
              <h1>
                {category?.name || (view === "all" ? "全部资源" : "发现资源")}
              </h1>
              <p>方法、角色、工具与流程，在这里各就其位。</p>
            </div>
            <label className="pb-search">
              <Glyph name="search" size={15} />
              <input
                ref={search}
                value={q}
                aria-label="搜索资源"
                placeholder="搜索资源、用途或作者"
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
              />
              <span className="pb-key" aria-hidden="true">
                /
              </span>
            </label>
          </div>
          <nav className="pb-tabs" aria-label="浏览资源">
            {[
              ["discover", "发现"],
              ...Object.entries(TYPES).map(([k, v]) => [k, v.name]),
              ["all", "全部"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={view === key}
                className={view === key ? "active" : ""}
                onClick={() => choose(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          {view === "discover" && !q && (
            <section className="pb-hero">
              <div className="pb-hero-text">
                <div className="pb-eyebrow">WORKFLOW / COLLECTION</div>
                <h2>
                  从资料到结论，
                  <br />
                  让协作有一条清晰的路线。
                </h2>
                <p>
                  {featured
                    ? `${featured.name} · ${featured.description || "查看工作流中的分工与协作"}`
                    : "连接方法、角色与工具，构建你的工作流。"}
                </p>
                <button
                  className="pb-hero-link"
                  disabled={busy || loading}
                  onClick={() =>
                    featured ? onOpen(featured) : choose("workflow")
                  }
                >
                  {featured ? "查看流程" : "浏览 Workflow"}
                  <Glyph name="arrow" size={15} />
                </button>
              </div>
              <div className="pb-hero-art">
                <PaperArt type="workflow" />
              </div>
            </section>
          )}
          {view === "discover" && (
            <>
              <div className="pb-section-title">
                <h2>
                  分类调用榜 <small>按累计调用次数</small>
                </h2>
                <span>每类 TOP 3</span>
              </div>
              <div className="pb-rank-grid">
                {Object.entries(TYPES).map(([key, t]) => (
                  <section
                    className="pb-rank-panel"
                    key={key}
                    style={{ "--pb-color": t.color, "--pb-tint": t.tint }}
                    aria-label={`${t.name} 调用榜`}
                  >
                    <div className="pb-rank-head">
                      <span className="pb-rank-icon">
                        <Glyph name={key} size={17} />
                      </span>
                      <h3>{t.name}</h3>
                      <span className="pb-rank-arrow">↗</span>
                    </div>
                    {loading ? (
                      <p className="pb-rank-empty">正在加载…</p>
                    ) : top(key).length ? (
                      top(key).map((r, i) => (
                        <button
                          key={r.id}
                          className="pb-rank-row"
                          disabled={busy}
                          onClick={() => onOpen(r)}
                        >
                          <span className="pb-rank-number">{i + 1}</span>
                          <span className="pb-rank-info">
                            <strong>{r.name}</strong>
                            <small>{author(r)}</small>
                          </span>
                          <span className="pb-rank-count" title="累计调用次数">
                            {count(r)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="pb-rank-empty">
                        {loadError ? "加载失败" : "暂无资源"}
                      </p>
                    )}
                    <button
                      className="pb-rank-more"
                      onClick={() => choose(key)}
                    >
                      浏览 {rows.filter((r) => r.type === key).length} 个资源 →
                    </button>
                  </section>
                ))}
              </div>
            </>
          )}
          <div className="pb-section-title">
            <h2>
              {category ? `${category.name} 资源` : "资源一览"}
              <small>{filtered.length} 个资源</small>
            </h2>
            <div className="pb-list-actions">
              {category && (
                <button
                  className="pb-primary"
                  disabled={busy}
                  onClick={() => onCreate(view)}
                >
                  <Glyph name="plus" size={16} />
                  新建 {category.name}
                </button>
              )}
              <button
                className="pb-refresh"
                aria-label="刷新"
                title="刷新资源"
                disabled={busy || loading}
                onClick={onRefresh}
              >
                <Glyph name="refresh" size={16} />
              </button>
            </div>
          </div>
          <div className="pb-filter-bar">
            <div className="pb-tag-filters" aria-label="标签筛选">
              <button
                aria-pressed={!tag}
                className={!tag ? "active" : ""}
                onClick={() => {
                  setTag("");
                  setPage(0);
                }}
              >
                全部标签
              </button>
              {tags.map((t) => (
                <button
                  key={t}
                  aria-pressed={tag === t}
                  className={tag === t ? "active" : ""}
                  onClick={() => {
                    setTag(t);
                    setPage(0);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              aria-label="资源排序"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(0);
              }}
            >
              <option value="usage">调用最多 ↓</option>
              <option value="updated">最近更新 ↓</option>
            </select>
          </div>
          {loading ? (
            <div className="pb-empty" role="status">
              正在加载资源…
            </div>
          ) : loadError ? (
            <div className="pb-empty">
              <h3>资源加载失败</h3>
              <button onClick={onRefresh}>重新加载</button>
            </div>
          ) : !filtered.length ? (
            <div className="pb-empty">
              <Glyph name={category ? view : "search"} size={36} />
              <h3>{q || tag ? "没有找到匹配的资源" : "这里还没有资源"}</h3>
              <p>
                {q || tag
                  ? "换一个关键词，或清除筛选后再试试。"
                  : "选择分类，创建你的第一个资源。"}
              </p>
              {(q || tag) && (
                <button
                  onClick={() => {
                    setQ("");
                    setTag("");
                    setPage(0);
                  }}
                >
                  清除筛选
                </button>
              )}
            </div>
          ) : (
            <div className="pb-cards">
              {filtered.slice(page * 24, page * 24 + 24).map((r) => (
                <PaperCard
                  key={r.id}
                  resource={r}
                  busy={busy}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
          {filtered.length > 24 && (
            <div className="pb-pagination">
              <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
                上一页
              </button>
              <span>
                {page + 1} / {Math.ceil(filtered.length / 24)}
              </span>
              <button
                disabled={(page + 1) * 24 >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
          <footer className="pb-footer">
            <span>Gallery / Resource Browser</span>
            <span>纸境 · Paper</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function PaperDetail({
  resource: r,
  busy,
  error,
  onClose,
  onEdit,
  onDelete,
  onExport,
  onPublish,
}) {
  const [tab, setTab] = useState("overview");
  const [guide, setGuide] = useState(false);
  const files = r.files || [];
  const mainFile =
    files.find((f) =>
      /(^|\/)(SKILL\.md|AGENT\.md|agent\.md|mcp\.json|workflow\.json)$/.test(
        f.path,
      ),
    ) || files[0];
  const verification = r.metadata?.mcpVerification;
  const instructions = {
    skill: "在 DSH 会话输入 /gallery，选择此 Skill，补充任务并发送。",
    agent: `在会话中请求使用 Gallery Agent「${r.name}」执行任务。宿主需启用 gallery_agent_list、gallery_agent_run 及子 Agent 功能。`,
    mcp: "MCP 通过宿主注册为 mcp__<serverName>__<tool> 工具；认证信息在编辑向导中直接填写，无需预先设置宿主环境变量。",
  };
  return (
    <Modal variant="paper-detail" onClose={() => !busy && onClose()}>
      <section
        className="pb-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="资源详情"
        tabIndex={-1}
      >
        <div className="pb-drawer-top">
          <span>{TYPES[r.type]?.name} / 资源详情</span>
          <button disabled={busy} onClick={onClose} aria-label="关闭详情">
            <Glyph name="close" size={17} />
          </button>
        </div>
        <PaperCover resource={r} className="pb-drawer-cover" />
        <div className="pb-drawer-content">
          <div className="pb-eyebrow">
            {r.type.toUpperCase()} · GALLERY RESOURCE
          </div>
          <h2>{r.name}</h2>
          <p className="pb-drawer-description">{r.description || "暂无描述"}</p>
          <div className="pb-detail-meta">
            <span>作者 {author(r)}</span>
            <span title="累计调用次数">↗ {count(r)} 次调用</span>
            <span>更新于 {date(r.updatedAt)}</span>
          </div>
          <div className="pb-detail-actions">
            {r.type === "workflow" ? (
              files.some((f) => f.path === "workflow.json") && (
                <button
                  className="pb-primary"
                  disabled={busy}
                  onClick={onPublish}
                >
                  注册到 TeamFlow ↗
                </button>
              )
            ) : (
              <button
                className="pb-primary"
                aria-expanded={guide}
                onClick={() => setGuide((v) => !v)}
              >
                查看调用方式 ↗
              </button>
            )}
            {r.canEdit && (
              <button disabled={busy} onClick={onEdit}>
                编辑
              </button>
            )}
            <button onClick={onExport}>导出</button>
            {r.canDelete && (
              <button className="pb-delete" disabled={busy} onClick={onDelete}>
                删除
              </button>
            )}
          </div>
          {guide && (
            <p className="pb-instruction" role="status">
              {instructions[r.type]}
            </p>
          )}
          {error && (
            <p role="alert" className="gal-error">
              {error}
            </p>
          )}
          <div className="pb-detail-tabs" role="tablist" aria-label="详情内容">
            {[
              ["overview", "概览"],
              ["files", `文件 ${files.length}`],
            ].map(([key, label], i) => (
              <button
                key={key}
                role="tab"
                id={`pb-tab-${key}`}
                aria-controls="pb-detail-panel"
                aria-selected={tab === key}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? "overview"
                        : e.key === "End"
                          ? "files"
                          : i
                            ? "overview"
                            : "files";
                    setTab(next);
                    e.currentTarget.parentElement
                      .querySelector(`#pb-tab-${next}`)
                      .focus();
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="pb-detail-body"
            role="tabpanel"
            id="pb-detail-panel"
            aria-labelledby={`pb-tab-${tab}`}
            tabIndex={0}
          >
            {tab === "files" ? (
              <>
                <p>查看资源内的文件及附件内容。</p>
                {files.map((f) => (
                  <details key={f.path} className="pb-file">
                    <summary>
                      <Glyph name="file" size={16} />
                      <span>{f.path}</span>
                      <small>{f.bytes ?? new Blob([f.content]).size} B</small>
                    </summary>
                    {f.encoding === "utf8" ? (
                      <pre>{f.content}</pre>
                    ) : (
                      <p>二进制附件包含在导出的资源包中。</p>
                    )}
                  </details>
                ))}
              </>
            ) : (
              <>
                {r.type === "mcp" && (
                  <>
                    <h3>连接检查</h3>
                    <div className="pb-instruction">
                      {verification?.checkedAt
                        ? `已通过连接检查 · ${date(verification.checkedAt)}`
                        : "尚未验证连接"}
                    </div>
                    <p>
                      检查结果是历史记录，不代表服务当前在线。可在编辑向导中重新检测。
                    </p>
                  </>
                )}
                {r.type === "workflow" && (
                  <>
                    <h3>工作流</h3>
                    <p>
                      在编辑向导中查看任务、Agent、人工节点及连接关系。注册到
                      TeamFlow 后，可从模板库应用到会话。
                    </p>
                    {r.metadata?.workflowCanvas?.agents?.some(
                      (a) => a.skills?.length || a.mcps?.length,
                    ) && (
                      <p>
                        Skill 和 MCP 引用保留在 Gallery 中；TeamFlow 按 Agent
                        节点开关启用资源。
                      </p>
                    )}
                  </>
                )}
                <h3>
                  {r.type === "skill"
                    ? "执行指引"
                    : r.type === "agent"
                      ? "角色与职责"
                      : "配置内容"}
                </h3>
                {mainFile ? (
                  mainFile.encoding === "utf8" ? (
                    <pre className="pb-instruction">{mainFile.content}</pre>
                  ) : (
                    <p>主文件为二进制内容，请导出查看。</p>
                  )
                ) : (
                  <p>此资源没有文件。</p>
                )}
                <h3>附属文件</h3>
                {files.filter((f) => f !== mainFile).length ? (
                  files
                    .filter((f) => f !== mainFile)
                    .map((f) => (
                      <button
                        key={f.path}
                        className="pb-file-link"
                        onClick={() => setTab("files")}
                      >
                        <Glyph name="file" size={16} />
                        {f.path}
                        <span>↗</span>
                      </button>
                    ))
                ) : (
                  <p>此资源没有附属文件。</p>
                )}
              </>
            )}
            <h3>标签</h3>
            <div className="pb-tags">
              {r.tags?.length ? (
                r.tags.map((t) => <span key={t}>{t}</span>)
              ) : (
                <span>无标签</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </Modal>
  );
}
