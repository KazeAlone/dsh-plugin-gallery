import React from "react";
import { Glyph, ResourceVisual } from "./icons.jsx";

const covers = [
  { id: "writing", label: "写作与文档", keywords: /写作|周报|文档|总结|摘要|writing|document|summary/, hue: 36, path: "M13 5h20l9 9v29H13z M33 5v10h9 M20 23h15m-15 7h15m-15 7h10" },
  { id: "code", label: "开发与审查", keywords: /代码|开发|审查|编程|code|review|github|gitlab/, hue: 229, path: "M18 12 6 24l12 12m12-24 12 12-12 12M28 8l-8 32" },
  { id: "data", label: "数据与分析", keywords: /数据|分析|表格|数据库|data|analytics|sql|spreadsheet/, hue: 163, path: "M6 6v36h36M12 36V24h7v12m5 0V16h7v20m5 0V9h7v27" },
  { id: "language", label: "语言与翻译", keywords: /翻译|语言|多语|translation|translate|language/, hue: 284, path: "M5 8h24v19H16l-7 6v-6H5z M24 32h8l7 6v-6h5V17H34M11 17h12m-6-4v9" },
  { id: "search", label: "搜索与研究", keywords: /搜索|检索|研究|调研|search|research|browse/, hue: 195, path: "M34 20a14 14 0 1 1-28 0 14 14 0 1 1 28 0m-4 10 12 12M13 20h14m-7-7v14" },
  { id: "automation", label: "连接与自动化", keywords: /连接|自动化|集成|接口|automation|connector|integration|api/, hue: 326, path: "M7 7h12v12H7z M29 29h12v12H29z M13 19v10a6 6 0 0 0 6 6h10M35 29V19a6 6 0 0 0-6-6h-4" },
];

export const hasResourceCover = (type) => ["skill", "agent", "mcp"].includes(type);

function resolveCover(resource) {
  const selected = resource.cover ?? resource.metadata?.cover;
  const subject = [...(resource.tags ?? []), resource.name, resource.description].join(" ").toLowerCase();
  const cover = covers.find((item) => item.id === selected)
    ?? covers.find((item) => item.keywords.test(subject));
  if (cover) return cover;
  const name = resource.name?.trim() || resource.type;
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.codePointAt(0)) >>> 0;
  return { hue: [35, 165, 197, 231, 276, 328][hash % 6], initial: [...name][0].toUpperCase() };
}

function CoverDrawing({ cover }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {cover.path ? <path d={cover.path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        : <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize="30" fontWeight="650">{cover.initial}</text>}
    </svg>
  );
}

export function ResourceCover({ resource }) {
  if (!hasResourceCover(resource.type)) return <ResourceVisual type={resource.type} />;
  const cover = resolveCover(resource);
  return (
    <span className="gal-resource-visual gal-purpose-cover" style={{ "--cover-hue": cover.hue }} aria-hidden="true">
      <span className="gal-visual-type"><Glyph name={resource.type} size={14} />{{ skill: "Skill", agent: "Agent", mcp: "MCP" }[resource.type]}</span>
      <span className="gal-purpose-drawing"><CoverDrawing cover={cover} /></span>
    </span>
  );
}

export function ResourceCoverPicker({ resource, onChange }) {
  const value = covers.some(({ id }) => id === resource.cover) ? resource.cover : "";
  return (
    <div className="gal-cover-picker">
      <label>封面
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">按用途自动选择</option>
          {covers.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <ResourceCover resource={resource} />
    </div>
  );
}

export function withResourceCover(metadata, cover) {
  const { cover: previous, ...rest } = metadata ?? {};
  return cover ? { ...rest, cover } : rest;
}
