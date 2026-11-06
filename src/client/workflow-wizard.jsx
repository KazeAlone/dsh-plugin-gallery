import React, {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
import { createResourceIdentifier } from "./resource-id.mjs";
import { validateWorkflowTemplate } from "../workflow-template.mjs";

function initial(resource) {
  let definition;
  try {
    definition = JSON.parse(
      resource.files.find((f) => f.path === "workflow.json").content,
    );
  } catch {
    definition = {
      name: "",
      description: "",
      tags: [],
      inputs: "",
      members: [],
      tasks: [],
      positions: {},
    };
  }
  const saved = resource?.metadata?.workflowCanvas;
  const agents =
    saved?.agents?.map((a) => ({
      ...a,
      snapshot: definition.members.find((m) => m.name === a.id),
    })) ||
    definition.members.map((m, i) => ({
      id: m.name,
      label: m.name,
      resourceId: "",
      snapshot: m,
      skills: [],
      mcps: [],
      position: { x: 40, y: 70 + i * 155 },
    }));
  return {
    definition,
    agents,
    positions: Object.fromEntries(
      definition.tasks.map((t, i) => [
        t.id,
        definition.positions?.[`task:${t.id}`] || {
          x: 380 + (i % 3) * 270,
          y: 80 + Math.floor(i / 3) * 180,
        },
      ]),
    ),
  };
}
export function WorkflowWizard({ resource, onClose, onSave, onList, onGet }) {
  const [fullscreen, setFullscreen] = useState(false);
  const editor = useRef(null),
    pan = useRef(null),
    zoomValue = useRef(1),
    pendingScroll = useRef(null);
  const arrow = useId();
  const [start] = useState(() => initial(resource));
  const [draft, setDraft] = useState(start.definition),
    [agents, setAgents] = useState(start.agents),
    [positions, setPositions] = useState(start.positions);
  const [catalog, setCatalog] = useState({ agent: [], skill: [], mcp: [] });
  const [selected, setSelected] = useState(null),
    [linkFrom, setLinkFrom] = useState(null),
    [zoom, setZoom] = useState(1);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const drag = useRef(null),
    board = useRef(null),
    view = useRef(null),
    pendingAgent = useRef(0);
  useEffect(() => {
    let live = true;
    Promise.all(
      ["agent", "skill", "mcp"].map(async (type) => [type, await onList(type)]),
    )
      .then((entries) => {
        if (live) setCatalog(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (live) setError(e.message || String(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      pendingAgent.current++;
    };
  }, []);
  function zoomAt(next, x, y) {
    const viewport = view.current;
    next = Math.max(0.25, Math.min(2, Math.round(next * 100) / 100));
    if (!viewport || next === zoomValue.current) return;
    const ratio = next / zoomValue.current;
    pendingScroll.current = {
      left: (viewport.scrollLeft + x) * ratio - x,
      top: (viewport.scrollTop + y) * ratio - y,
    };
    zoomValue.current = next;
    setZoom(next);
  }
  useLayoutEffect(() => {
    if (pendingScroll.current && view.current) {
      view.current.scrollTo(pendingScroll.current);
      pendingScroll.current = null;
    }
  }, [zoom]);
  useEffect(() => {
    const viewport = view.current;
    const wheel = (event) => {
      event.preventDefault();
      const r = viewport.getBoundingClientRect();
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? viewport.clientHeight
            : 1);
      zoomAt(
        zoomValue.current * Math.exp(-delta * 0.0015),
        event.clientX - r.left,
        event.clientY - r.top,
      );
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    return () => viewport.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    const change = () =>
      setFullscreen(document.fullscreenElement === editor.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  async function toggleFullscreen() {
    if (fullscreen) {
      if (document.fullscreenElement === editor.current)
        await document.exitFullscreen();
      setFullscreen(false);
    } else {
      try {
        if (editor.current.requestFullscreen)
          await editor.current.requestFullscreen();
      } catch {
        /* Fall back to a viewport-sized editor. */
      }
      setFullscreen(true);
    }
  }
  const task = draft.tasks.find(
    (t) => selected?.kind === "task" && t.id === selected.id,
  );
  const agent = agents.find(
    (a) => selected?.kind === "agent" && a.id === selected.id,
  );
  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const updateTask = (patch) =>
    setDraft((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === selected.id ? { ...t, ...patch } : t,
      ),
    }));
  const updateAgent = (patch) =>
    setAgents((rows) =>
      rows.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)),
    );
  function add(kind, point) {
    if (busy) return;
    setError("");
    const position = point || {
      x: Math.min(
        900,
        (view.current?.scrollLeft || 0) / zoom +
          60 +
          ((draft.tasks.length + agents.length) % 3) * 40,
      ),
      y: Math.min(
        800,
        (view.current?.scrollTop || 0) / zoom +
          70 +
          ((draft.tasks.length + agents.length) % 4) * 45,
      ),
    };
    if (kind === "agent") {
      if (agents.length >= 32) return setError("最多添加 32 个 Agent");
      const id = createResourceIdentifier("a");
      setAgents((rows) => [
        ...rows,
        {
          id,
          label: "选择 Agent",
          resourceId: "",
          skills: [],
          mcps: [],
          position,
        },
      ]);
      setSelected({ kind: "agent", id });
    } else {
      if (draft.tasks.length >= 32)
        return setError("最多添加 32 个任务或人工节点");
      const id = createResourceIdentifier("t");
      update({
        tasks: [
          ...draft.tasks,
          {
            id,
            subject: kind === "human" ? "人工确认" : "新任务",
            assignee: "",
            dependencies: [],
            checkpoint: kind === "human",
            general: { requirements: "", deliverables: "", acceptance: "" },
          },
        ],
      });
      setPositions((p) => ({ ...p, [id]: position }));
      setSelected({ kind: "task", id });
    }
  }
  function pointerDown(event, kind, id) {
    if (event.button !== 0 || busy) return;
    const position =
      kind === "agent"
        ? agents.find((a) => a.id === id).position
        : positions[id];
    drag.current = { kind, id, x: event.clientX, y: event.clientY, position };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected({ kind, id });
  }
  function move(event) {
    if (!drag.current) return;
    const d = drag.current,
      position = {
        x: Math.round(
          Math.max(
            12,
            Math.min(9700, d.position.x + (event.clientX - d.x) / zoom),
          ),
        ),
        y: Math.round(
          Math.max(
            12,
            Math.min(9700, d.position.y + (event.clientY - d.y) / zoom),
          ),
        ),
      };
    if (d.kind === "agent")
      setAgents((rows) =>
        rows.map((a) => (a.id === d.id ? { ...a, position } : a)),
      );
    else setPositions((p) => ({ ...p, [d.id]: position }));
  }
  function connect(to) {
    if (!linkFrom)
      return setError("先点击前置节点的“连出”，再点击后续节点的“连入”");
    try {
      const tasks = draft.tasks.map((t) =>
        t.id === to
          ? { ...t, dependencies: [...new Set([...t.dependencies, linkFrom])] }
          : t,
      );
      // Validate topology with placeholder text while the draft is incomplete.
      validateWorkflowTemplate({
        ...draft,
        name: draft.name || "草稿",
        members: agents.map((a) => ({
          name: a.id,
          summary: "",
          role: "",
          executionPrompt: "",
        })),
        tasks: tasks.map((t) => ({ ...t, subject: t.subject || "节点" })),
        positions: {},
      });
      update({ tasks });
      setError("");
      setLinkFrom(null);
    } catch (e) {
      setError(e.message);
    }
  }
  async function chooseAgent(id) {
    const ticket = ++pendingAgent.current,
      nodeId = selected.id;
    if (!id) {
      updateAgent({ resourceId: "", label: "选择 Agent", snapshot: null });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const row = await onGet(id);
      if (ticket !== pendingAgent.current) return;
      setAgents((rows) =>
        rows.map((a) =>
          a.id === nodeId
            ? {
                ...a,
                resourceId: id,
                label: row.name,
                snapshot: {
                  name: nodeId,
                  summary: row.description,
                  role: row.name,
                  executionPrompt:
                    row.files.find((f) => f.path === "AGENT.md")?.content || "",
                },
                resourceDigest: row.digest,
              }
            : a,
        ),
      );
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      if (ticket === pendingAgent.current) setBusy(false);
    }
  }
  function remove() {
    if (agent) {
      setAgents((rows) => rows.filter((a) => a.id !== agent.id));
      update({
        tasks: draft.tasks.map((t) =>
          t.assignee === agent.id ? { ...t, assignee: "" } : t,
        ),
      });
    } else if (task) {
      update({
        tasks: draft.tasks
          .filter((t) => t.id !== task.id)
          .map((t) => ({
            ...t,
            dependencies: t.dependencies.filter((id) => id !== task.id),
          })),
      });
      setPositions((p) => {
        const copy = { ...p };
        delete copy[task.id];
        return copy;
      });
      if (linkFrom === task.id) setLinkFrom(null);
    }
    setSelected(null);
  }
  async function save() {
    setError("");
    try {
      if (agents.some((a) => !a.resourceId && !a.snapshot))
        throw Error("请为每个 Agent 节点选择资源库中的 Agent");
      if (draft.tasks.some((t) => !t.checkpoint && !t.assignee))
        throw Error("请为每个任务节点指定负责的 Agent");
      if (draft.tasks.some((t) => !t.general.requirements.trim()))
        throw Error("请填写每个节点的任务要求或人工确认事项");
      const value = validateWorkflowTemplate({
        ...draft,
        members: agents.map((a) => ({ ...a.snapshot, name: a.id })),
        positions: Object.fromEntries(
          draft.tasks.map((t) => [`task:${t.id}`, positions[t.id]]),
        ),
      });
      setBusy(true);
      await onSave({
        type: "workflow",
        name: value.name,
        description: value.description,
        tags: value.tags,
        files: [
          {
            path: "workflow.json",
            encoding: "utf8",
            content: JSON.stringify(value, null, 2) + "\n",
          },
        ],
        metadata: {
          ...(resource?.metadata || {}),
          format: "dsh-teamflow-template-v1",
          workflowCanvas: {
            version: 1,
            agents: agents.map(({ snapshot, ...node }) => node),
          },
        },
        references: resource?.references || [],
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  const extent = [
    ...Object.values(positions),
    ...agents.map((a) => a.position),
  ];
  const width = Math.max(1400, ...extent.map((p) => p.x + 300)),
    height = Math.max(1000, ...extent.map((p) => p.y + 200));
  function edge(from, to, key, assignment = false) {
    if (!from || !to) return null;
    return (
      <path
        key={key}
        className={assignment ? "assignment" : ""}
        markerEnd={assignment ? undefined : `url(#${arrow})`}
        d={`M${from.x + 220},${from.y + 65} C${from.x + 290},${from.y + 65} ${to.x - 70},${to.y + 65} ${to.x},${to.y + 65}`}
      />
    );
  }
  return (
    <Modal
      onClose={() => {
        if (fullscreen) {
          void toggleFullscreen();
          return;
        }
        if (!busy) onClose();
      }}
    >
      <section
        ref={editor}
        className={`gal-dialog gal-flow-editor ${fullscreen ? "gal-flow-fullscreen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={resource ? "编辑 Workflow" : "新建 Workflow"}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <h2>
            <Glyph name="workflow" /> Workflow 画布
          </h2>
          <span className="gal-flow-status">编排草稿 · 执行对接待接入</span>
          <button
            aria-label="关闭编辑"
            disabled={busy}
            onClick={async () => {
              if (fullscreen) await toggleFullscreen();
              onClose();
            }}
          >
            <Glyph name="close" />
          </button>
        </header>
        <div className="gal-flow-toolbar">
          <div>
            {[
              ["agent", "Agent"],
              ["task", "任务"],
              ["human", "人工"],
            ].map(([kind, label]) => (
              <button
                key={kind}
                disabled={busy}
                draggable={!busy}
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/gallery-node", kind)
                }
                onClick={() => add(kind)}
              >
                <Glyph
                  name={
                    kind === "human"
                      ? "user"
                      : kind === "task"
                        ? "file"
                        : "agent"
                  }
                />
                添加{label}节点
              </button>
            ))}
          </div>
          <label>
            缩放
            <select
              aria-label="画布缩放"
              value={zoom}
              onChange={(e) =>
                zoomAt(
                  Number(e.target.value),
                  view.current.clientWidth / 2,
                  view.current.clientHeight / 2,
                )
              }
            >
              {[...new Set([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, zoom])]
                .sort((a, b) => a - b)
                .map((z) => (
                  <option key={z} value={z}>
                    {Math.round(z * 100)}%
                  </option>
                ))}
            </select>
          </label>
          <button onClick={() => setSelected(null)}>流程信息</button>
          <button
            aria-label={fullscreen ? "退出全屏" : "全屏画布"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? "退出全屏" : "全屏画布"}
          </button>
        </div>
        {error && (
          <p role="alert" className="gal-flow-error">
            {error}
            <button aria-label="关闭错误" onClick={() => setError("")}>
              <Glyph name="close" />
            </button>
          </p>
        )}
        <div className="gal-flow-body">
          <div
            className="gal-flow-view"
            ref={view}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (e.button !== 2) return;
              e.preventDefault();
              pan.current = {
                x: e.clientX,
                y: e.clientY,
                left: e.currentTarget.scrollLeft,
                top: e.currentTarget.scrollTop,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.classList.add("gal-flow-panning");
            }}
            onPointerMove={(e) => {
              if (!pan.current) return;
              e.currentTarget.scrollLeft =
                pan.current.left - (e.clientX - pan.current.x);
              e.currentTarget.scrollTop =
                pan.current.top - (e.clientY - pan.current.y);
            }}
            onPointerUp={(e) => {
              if (e.button === 2) {
                pan.current = null;
                e.currentTarget.classList.remove("gal-flow-panning");
              }
            }}
            onPointerCancel={(e) => {
              pan.current = null;
              e.currentTarget.classList.remove("gal-flow-panning");
            }}
            onLostPointerCapture={(e) => {
              pan.current = null;
              e.currentTarget.classList.remove("gal-flow-panning");
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const kind = e.dataTransfer.getData("application/gallery-node");
              if (!["agent", "task", "human"].includes(kind)) return;
              const r = board.current.getBoundingClientRect();
              add(kind, {
                x: Math.max(12, (e.clientX - r.left) / zoom),
                y: Math.max(12, (e.clientY - r.top) / zoom),
              });
            }}
          >
            <div style={{ width: width * zoom, height: height * zoom }}>
              <div
                className="gal-flow-board"
                ref={board}
                style={{ width, height, transform: `scale(${zoom})` }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelected(null);
                }}
              >
                <svg
                  className="gal-flow-edges"
                  width={width}
                  height={height}
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id={arrow}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <polygon
                        points="0 0, 10 5, 0 10"
                        fill="var(--g-accent)"
                      />
                    </marker>
                  </defs>
                  {draft.tasks.flatMap((t) => [
                    ...t.dependencies.map((id) =>
                      edge(positions[id], positions[t.id], id + ":" + t.id),
                    ),
                    ...(t.assignee
                      ? [
                          edge(
                            agents.find((a) => a.id === t.assignee)?.position,
                            positions[t.id],
                            "a:" + t.id,
                            true,
                          ),
                        ]
                      : []),
                  ])}
                </svg>
                {!draft.tasks.length && !agents.length && (
                  <div className="gal-flow-welcome">
                    <Glyph name="workflow" size={44} />
                    <h3>从一个节点开始</h3>
                    <p>拖入或点击上方节点，点击节点配置内容。</p>
                  </div>
                )}
                {[
                  ...agents.map((a) => ({
                    kind: "agent",
                    id: a.id,
                    title: a.label,
                    position: a.position,
                    subtitle: `${a.skills.length} Skill · ${a.mcps.length} MCP`,
                  })),
                  ...draft.tasks.map((t) => ({
                    kind: "task",
                    id: t.id,
                    title: t.subject,
                    position: positions[t.id],
                    human: t.checkpoint,
                    subtitle: t.checkpoint
                      ? "等待人工确认"
                      : agents.find((a) => a.id === t.assignee)?.label ||
                        "未指定 Agent",
                  })),
                ].map((n) => (
                  <article
                    className={`gal-flow-node ${n.kind} ${n.human ? "human" : ""} ${selected?.id === n.id ? "selected" : ""}`}
                    style={{ left: n.position.x, top: n.position.y }}
                    key={n.id}
                    onClick={() => setSelected({ kind: n.kind, id: n.id })}
                  >
                    <button
                      className="gal-flow-grip"
                      aria-label={`移动 ${n.title}`}
                      onPointerDown={(e) => pointerDown(e, n.kind, n.id)}
                      onPointerMove={move}
                      onPointerUp={() => {
                        drag.current = null;
                      }}
                      onPointerCancel={() => {
                        drag.current = null;
                      }}
                    >
                      <Glyph
                        name={
                          n.kind === "agent"
                            ? "agent"
                            : n.human
                              ? "user"
                              : "file"
                        }
                      />
                      {n.kind === "agent"
                        ? "AGENT"
                        : n.human
                          ? "人工节点"
                          : "任务节点"}
                    </button>
                    <button
                      className="gal-flow-node-title"
                      onClick={() => setSelected({ kind: n.kind, id: n.id })}
                    >
                      {n.title || "未命名节点"}
                    </button>
                    <p>{n.subtitle}</p>
                    {n.kind === "task" && (
                      <div className="gal-flow-ports">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            connect(n.id);
                          }}
                        >
                          连入
                        </button>
                        <button
                          aria-pressed={linkFrom === n.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLinkFrom(linkFrom === n.id ? null : n.id);
                            setError("");
                          }}
                        >
                          连出
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
          <aside className="gal-flow-inspector">
            {loading && <p role="status">正在读取资源库…</p>}
            {!task && !agent && (
              <>
                <h3>流程信息</h3>
                <label>
                  名称
                  <input
                    aria-label="流程名称"
                    maxLength={120}
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </label>
                <label>
                  描述
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={draft.description}
                    onChange={(e) => update({ description: e.target.value })}
                  />
                </label>
                <label>
                  适用输入
                  <textarea
                    maxLength={4000}
                    value={draft.inputs}
                    onChange={(e) => update({ inputs: e.target.value })}
                  />
                </label>
                <label>
                  标签
                  <input
                    value={draft.tags.join(", ")}
                    onChange={(e) =>
                      update({
                        tags: e.target.value
                          .split(/[,，]/)
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
                <p>
                  Agent 用虚线关联负责人；任务与人工节点用实线表示先后依赖。
                </p>
              </>
            )}
            {agent && (
              <>
                <h3>Agent 节点</h3>
                <label>
                  资源库 Agent
                  <select
                    aria-label="资源库 Agent"
                    value={agent.resourceId}
                    disabled={busy || loading}
                    onChange={(e) => chooseAgent(e.target.value)}
                  >
                    <option value="">请选择 Agent</option>
                    {agent.resourceId &&
                      !catalog.agent.some((r) => r.id === agent.resourceId) && (
                        <option value={agent.resourceId}>
                          {agent.label}（资源已不可用）
                        </option>
                      )}
                    {catalog.agent.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!catalog.agent.length && !loading && (
                  <p>资源库暂无 Agent，请先在 Agent 分类创建。</p>
                )}
                {[
                  ["skill", "skills", "Skill"],
                  ["mcp", "mcps", "MCP"],
                ].map(([type, key, label]) => (
                  <fieldset key={key}>
                    <legend>配置 {label}</legend>
                    {!catalog[type].length && <p>暂无可选资源</p>}
                    {catalog[type].map((r) => (
                      <label className="gal-flow-check" key={r.id}>
                        <input
                          type="checkbox"
                          checked={agent[key].some((ref) => ref.id === r.id)}
                          onChange={(e) =>
                            updateAgent({
                              [key]: e.target.checked
                                ? [
                                    ...agent[key],
                                    {
                                      id: r.id,
                                      name: r.name,
                                      digest: r.digest,
                                    },
                                  ]
                                : agent[key].filter((ref) => ref.id !== r.id),
                            })
                          }
                        />
                        {r.name}
                      </label>
                    ))}
                    {agent[key]
                      .filter(
                        (ref) => !catalog[type].some((r) => r.id === ref.id),
                      )
                      .map((ref) => (
                        <label className="gal-flow-check" key={ref.id}>
                          <input
                            type="checkbox"
                            checked
                            onChange={() =>
                              updateAgent({
                                [key]: agent[key].filter(
                                  (item) => item.id !== ref.id,
                                ),
                              })
                            }
                          />
                          {ref.name}（资源已不可用）
                        </label>
                      ))}
                  </fieldset>
                ))}
                <p>选择仅用于本流程，保存在编排草稿中。</p>
              </>
            )}
            {task && (
              <>
                <h3>{task.checkpoint ? "人工节点" : "任务节点"}</h3>
                <label>
                  名称
                  <input
                    aria-label="节点名称"
                    maxLength={200}
                    value={task.subject}
                    onChange={(e) => updateTask({ subject: e.target.value })}
                  />
                </label>
                {!task.checkpoint && (
                  <label>
                    负责 Agent
                    <select
                      aria-label="负责 Agent"
                      value={task.assignee}
                      onChange={(e) => updateTask({ assignee: e.target.value })}
                    >
                      <option value="">请选择 Agent</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {[
                  ["requirements", task.checkpoint ? "确认事项" : "任务要求"],
                  ["deliverables", "交付物"],
                  ["acceptance", "验收标准"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <textarea
                      aria-label={label}
                      rows={3}
                      maxLength={16000}
                      value={task.general[key]}
                      onChange={(e) =>
                        updateTask({
                          general: { ...task.general, [key]: e.target.value },
                        })
                      }
                    />
                  </label>
                ))}
                <fieldset>
                  <legend>前置依赖</legend>
                  {!task.dependencies.length && <p>无前置节点</p>}
                  {task.dependencies.map((id) => (
                    <div className="gal-flow-dependency" key={id}>
                      <span>
                        {draft.tasks.find((t) => t.id === id)?.subject || id}
                      </span>
                      <button
                        aria-label="移除依赖"
                        onClick={() =>
                          updateTask({
                            dependencies: task.dependencies.filter(
                              (d) => d !== id,
                            ),
                          })
                        }
                      >
                        <Glyph name="close" />
                      </button>
                    </div>
                  ))}
                </fieldset>
                <label>
                  添加前置节点
                  <select
                    aria-label="添加前置节点"
                    value=""
                    onChange={(e) => {
                      setLinkFrom(null);
                      const from = e.target.value;
                      try {
                        const tasks = draft.tasks.map((t) =>
                          t.id === task.id
                            ? { ...t, dependencies: [...t.dependencies, from] }
                            : t,
                        );
                        validateWorkflowTemplate({
                          ...draft,
                          name: draft.name || "草稿",
                          members: agents.map((a) => ({
                            name: a.id,
                            summary: "",
                            role: "",
                            executionPrompt: "",
                          })),
                          tasks,
                          positions: {},
                        });
                        update({ tasks });
                        setError("");
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    <option value="">选择节点</option>
                    {draft.tasks
                      .filter(
                        (t) =>
                          t.id !== task.id && !task.dependencies.includes(t.id),
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.subject}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            )}
            {(task || agent) && (
              <button className="gal-delete" disabled={busy} onClick={remove}>
                <Glyph name="trash" />
                删除节点
              </button>
            )}
          </aside>
        </div>
        <footer className="gal-flow-footer">
          <span aria-live="polite">
            {linkFrom
              ? "连接中：点击后续节点的“连入”"
              : `${agents.length} Agent · ${draft.tasks.length} 任务与人工节点`}
          </span>
          {linkFrom && (
            <button onClick={() => setLinkFrom(null)}>取消连线</button>
          )}
          <button
            className="gal-primary"
            disabled={busy || loading}
            onClick={save}
          >
            {busy ? "保存中…" : "保存 Workflow"}
          </button>
        </footer>
      </section>
    </Modal>
  );
}
