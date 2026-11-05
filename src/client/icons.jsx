import React from "react";
const paths = {
  skill: ["M5 3h10l4 4v14H5z", "M14 3v5h5", "M8 12h8M8 16h5"],
  agent: [
    "M9 4h6v3H9z",
    "M5 9h14v11H5z",
    "M9 13h.01M15 13h.01M9 17h6",
    "M2 12v5M22 12v5",
  ],
  mcp: ["M8 3v5M16 3v5", "M6 8h12v4a6 6 0 0 1-12 0z", "M12 18v4"],
  workflow: [
    "M3 3h6v6H3zM15 15h6v6h-6z",
    "M9 6h6a3 3 0 0 1 3 3v6",
    "M15 12l3 3 3-3",
  ],
  grid: ["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
  plus: ["M12 5v14M5 12h14"],
  search: ["M21 21l-5-5", "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
  refresh: ["M20 7v5h-5", "M20 12a8 8 0 1 0-2 6"],
  settings: ["M4 7h16M4 17h16", "M8 4v6M16 14v6"],
  file: ["M5 3h10l4 4v14H5z", "M14 3v5h5"],
  folder: ["M3 6h7l2 2h9v12H3z"],
  trophy: [
    "M8 3h8v7a4 4 0 0 1-8 0z",
    "M8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v5M8 21h8M10 19h4",
  ],
  user: ["M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", "M4 21v-2a8 8 0 0 1 16 0v2"],
  trash: ["M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"],
  usage: ["M4 20h16M7 16v-5M12 16V4M17 16V8"],
  clock: ["M12 8v5l3 2", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"],
  arrow: ["M6 18L18 6M6 6h12v12"],
  edit: ["M14 5l5 5M4 20l5-1L21 7l-5-5L4 14z"],
  download: ["M12 3v12M7 10l5 5 5-5", "M4 16v5h16v-5"],
  link: [
    "M10 14l4-4",
    "M10 15l-2 2a4 4 0 0 1-5-5l4-4",
    "M14 9l2-2a4 4 0 0 1 5 5l-4 4",
  ],
  upload: ["M12 16V3M7 8l5-5 5 5", "M4 16v5h16v-5"],
  check: ["M5 12l4 4L19 6"],
  close: ["M6 6l12 12M6 18L18 6"],
};
export function Glyph({ name, size = 18, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {(paths[name] || paths.file).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
export function ResourceVisual({ type }) {
  return (
    <span className={`gal-resource-visual ${type}`} aria-hidden="true">
      <svg
        className="gal-resource-drawing"
        viewBox="0 0 240 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {type === "skill" && (
          <>
            <rect
              x="85"
              y="12"
              width="70"
              height="80"
              rx="5"
              fill="var(--g-card)"
            />
            <path d="M99 30h25M99 42h43M99 52h36M99 62h43M99 72h25" />
            <rect
              x="149"
              y="45"
              width="30"
              height="30"
              rx="7"
              fill="var(--g-card)"
            />
            <path d="M158 60l4 4 8-9" />
          </>
        )}
        {type === "agent" && (
          <>
            <path d="M66 50h27M147 50h27M120 24V12M120 76v12" />
            <rect
              x="93"
              y="24"
              width="54"
              height="52"
              rx="13"
              fill="var(--g-card)"
            />
            <circle cx="109" cy="45" r="3" />
            <circle cx="131" cy="45" r="3" />
            <path d="M109 60h22" />
            <circle cx="59" cy="50" r="7" fill="var(--g-card)" />
            <circle cx="181" cy="50" r="7" fill="var(--g-card)" />
            <circle cx="120" cy="10" r="3" />
          </>
        )}
        {type === "mcp" && (
          <>
            <path d="M72 27l29 16M72 73l29-16M139 43l29-16M139 57l29 16" />
            <rect
              x="100"
              y="30"
              width="40"
              height="40"
              rx="10"
              fill="var(--g-card)"
            />
            <path d="M114 40v8M126 40v8M111 48h18v5a9 9 0 0 1-18 0zM120 62v8" />
            <rect
              x="56"
              y="15"
              width="22"
              height="22"
              rx="5"
              fill="var(--g-card)"
            />
            <rect
              x="56"
              y="63"
              width="22"
              height="22"
              rx="5"
              fill="var(--g-card)"
            />
            <rect
              x="162"
              y="15"
              width="22"
              height="22"
              rx="5"
              fill="var(--g-card)"
            />
            <rect
              x="162"
              y="63"
              width="22"
              height="22"
              rx="5"
              fill="var(--g-card)"
            />
          </>
        )}
        {type === "workflow" && (
          <>
            <path d="M71 35h29q10 0 10 10v15q0 10 10 10h38M148 63l8 7-8 7" />
            <rect
              x="43"
              y="19"
              width="36"
              height="32"
              rx="6"
              fill="var(--g-card)"
            />
            <rect
              x="101"
              y="38"
              width="36"
              height="32"
              rx="6"
              fill="var(--g-card)"
            />
            <rect
              x="158"
              y="55"
              width="36"
              height="32"
              rx="6"
              fill="var(--g-card)"
            />
            <path d="M55 35h12M113 54h12M170 71h12" />
          </>
        )}
      </svg>
      <span className="gal-visual-type">
        <Glyph name={type} size={14} />
        {type === "mcp"
          ? "MCP"
          : type === "workflow"
            ? "Workflow"
            : type === "agent"
              ? "Agent"
              : "Skill"}
      </span>
      <Glyph name="arrow" className="gal-card-arrow" size={17} />
    </span>
  );
}
