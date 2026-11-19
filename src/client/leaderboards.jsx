import { useGalleryText } from "./i18n.jsx";
import React from "react";
import { Glyph } from "./icons.jsx";
const names = {
  skill: "Skill",
  agent: "Agent",
  mcp: "MCP",
  workflow: "Workflow",
};
export function Leaderboards({ boards, busy, filtered, onOpen, onCategory }) {
  const l = useGalleryText();
  return (
    <div className="gal-leaderboards">
      {Object.entries(names).map(([type, label]) => {
        const board = boards.find((b) => b.type === type) || {
          items: [],
          total: 0,
        };
        const maximum = board.items[0]?.usageCount || 0;
        return (
          <section
            key={type}
            className={`gal-board ${type}`}
            aria-label={l("{0} 调用榜", label)}
          >
            <header className="gal-board-head">
              <div className="gal-board-icon">
                <Glyph name={type} size={26} />
              </div>
              <div>
                <h2>{l(label)}</h2>
                <span>{board.total}{l(" 个资源")}</span>
              </div>
              <span className="gal-board-top">TOP 10</span>
            </header>
            <div className="gal-board-columns">
              <span>{l("排名 / 资源")}</span>
              <span>{l("调用次数")}</span>
            </div>
            {board.items.length ? (
              <ol className="gal-board-list">
                {board.items.map((r, i) => (
                  <li key={r.id}>
                    <button
                      className={`gal-rank-row rank-${i + 1}`}
                      disabled={busy}
                      onClick={() => onOpen(r)}
                      title={l("{0} · {1} · 累计调用 {2} 次", r.name, r.creator?.username || l("未记录"), r.usageCount ?? 0)}
                    >
                      <span className="gal-rank-number">
                        {i === 0 && <Glyph name="trophy" size={16} />}
                        <span>{String(i + 1).padStart(2, "0")}</span>
                      </span>
                      <span className="gal-rank-info">
                        <strong>{r.name}</strong>
                        <span className="gal-rank-author">
                          <Glyph name="user" size={12} />
                          {r.creator?.username || l("未记录")}
                        </span>
                        <span className="gal-rank-track" aria-hidden="true">
                          <span
                            style={{
                              width: `${maximum ? Math.max(0, Math.min(100, ((r.usageCount || 0) / maximum) * 100)) : 0}%`,
                            }}
                          />
                        </span>
                      </span>
                      <span
                        className="gal-rank-count"
                        aria-label={l("累计调用 {0} 次", r.usageCount ?? 0)}
                      >
                        {(r.usageCount ?? 0).toLocaleString(l.language)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="gal-board-empty">
                <Glyph name={type} size={36} />
                <p>{filtered ? l("没有匹配的资源") : l("暂无资源")}</p>
              </div>
            )}
            <button className="gal-board-more" onClick={() => onCategory(type)}>{l("查看 ")}{l(label)}
              <Glyph name="arrow" size={16} />
            </button>
          </section>
        );
      })}
    </div>
  );
}
