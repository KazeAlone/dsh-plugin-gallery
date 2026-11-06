import React, { useEffect, useId, useRef, useState } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
import { ResourceCoverPicker, withResourceCover } from "./resource-cover.jsx";
import { createResourceIdentifier } from "./resource-id.mjs";
import { validateWorkflowTemplate } from "../workflow-template.mjs";

const nodeWidth = 220;
const nodeHeight = 110;
const portY = nodeHeight / 2;

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
      snapshot: definition.members.find(
        (m) => m.name === (a.memberName || a.id),
      ),
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
    definition: {
      ...definition,
      tasks: definition.tasks.map((t) => ({
        ...t,
        assignee: saved
          ? agents.find((a) => (a.memberName || a.id) === t.assignee)?.id ||
            t.assignee
          : t.assignee,
      })),
    },
    agents,
    positions:
      saved?.taskPositions ||
      Object.fromEntries(
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
export function WorkflowWizard({
  resource,
  onClose,
  onSave,
  onList,
  onGet,
  onExtract,
}) {
  const [cover, setCover] = useState(resource?.metadata?.cover ?? "");
  const [fullscreen, setFullscreen] = useState(false);
  const editor = useRef(null),
    pan = useRef(null),
    zoomValue = useRef(1),
    cameraRef = useRef({ x: 0, y: 0 }),
    boxDrag = useRef(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState([]),
    [marquee, setMarquee] = useState(null);
  function cameraTo(value) {
    cameraRef.current = value;
    setCamera(value);
  }
  const arrow = useId();
  const [start] = useState(() => initial(resource));
  const [draft, setDraft] = useState(start.definition),
    [agents, setAgents] = useState(start.agents),
    [positions, setPositions] = useState(start.positions);
  const [contextMenu, setContextMenu] = useState(null);
  const connection = useRef(null);
  const [wire, setWire] = useState(null);
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
    const old = cameraRef.current;
    cameraTo({ x: x - (x - old.x) * ratio, y: y - (y - old.y) * ratio });
    zoomValue.current = next;
    setZoom(next);
  }
  function fitView() {
    const points = [
      ...Object.values(positions),
      ...agents.map((a) => a.position),
    ];
    if (!points.length || !view.current) {
      cameraTo({ x: 0, y: 0 });
      zoomValue.current = 1;
      setZoom(1);
      return;
    }
    const minX = Math.min(...points.map((p) => p.x)),
      minY = Math.min(...points.map((p) => p.y));
    const maxX = Math.max(...points.map((p) => p.x + nodeWidth)),
      maxY = Math.max(...points.map((p) => p.y + nodeHeight));
    const z = Math.max(
      0.25,
      Math.min(
        1,
        (view.current.clientWidth - 60) / (maxX - minX),
        (view.current.clientHeight - 60) / (maxY - minY),
      ),
    );
    zoomValue.current = z;
    setZoom(z);
    cameraTo({ x: 30 - minX * z, y: 30 - minY * z });
  }
  useEffect(() => {
    fitView();
  }, []);
  function worldPoint(event) {
    const r = view.current.getBoundingClientRect();
    return {
      x: (event.clientX - r.left - cameraRef.current.x) / zoomValue.current,
      y: (event.clientY - r.top - cameraRef.current.y) / zoomValue.current,
    };
  }
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
      x:
        (60 - cameraRef.current.x) / zoomValue.current +
        ((draft.tasks.length + agents.length) % 3) * 40,
      y:
        (70 - cameraRef.current.y) / zoomValue.current +
        ((draft.tasks.length + agents.length) % 4) * 45,
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
      setSelection([id]);
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
      setSelection([id]);
    }
  }
  function pointerDown(event, kind, id) {
    if (event.button !== 0 || busy || event.target.closest(".gal-flow-ports"))
      return;
    event.stopPropagation();
    let ids = selection.includes(id) ? selection : [id];
    if (event.shiftKey) {
      ids = selection.includes(id)
        ? selection.filter((value) => value !== id)
        : [...selection, id];
      setSelection(ids);
      setSelected(
        ids.length === 1
          ? {
              kind: agents.some((a) => a.id === ids[0]) ? "agent" : "task",
              id: ids[0],
            }
          : null,
      );
      return;
    }
    setSelection(ids);
    setSelected(ids.length === 1 ? { kind, id } : null);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      ids,
      positions: {
        ...positions,
        ...Object.fromEntries(agents.map((a) => [a.id, a.position])),
      },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!drag.current) return;
    const d = drag.current,
      dx = (event.clientX - d.x) / zoomValue.current,
      dy = (event.clientY - d.y) / zoomValue.current;
    const point = (id) => ({
      x: Math.round(d.positions[id].x + dx),
      y: Math.round(d.positions[id].y + dy),
    });
    setAgents((rows) =>
      rows.map((a) =>
        d.ids.includes(a.id) ? { ...a, position: point(a.id) } : a,
      ),
    );
    setPositions((p) =>
      Object.fromEntries(
        Object.entries(p).map(([id, value]) => [
          id,
          d.ids.includes(id) ? point(id) : value,
        ]),
      ),
    );
  }
  function endGesture(event) {
    pan.current = null;
    boxDrag.current = null;
    setMarquee(null);
    event.currentTarget.classList.remove("gal-flow-panning");
  }
  function connect(to, from = linkFrom) {
    if (!from)
      return setError("先点击前置节点右侧圆点，再点击后续节点左侧圆点");
    try {
      const tasks = draft.tasks.map((t) =>
        t.id === to
          ? { ...t, dependencies: [...new Set([...t.dependencies, from])] }
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
  function startWire(event, id, side) {
    if (event.button !== 0 || busy) return;
    event.preventDefault();
    event.stopPropagation();
    connection.current = { id, side };
    setLinkFrom(id);
    setWire(worldPoint(event));
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function wireTarget(event, start) {
    if (!start) return null;
    const port = document.elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-flow-port]");
    if (!port || !view.current?.contains(port)) return null;
    const { flowPort, node } = port.dataset;
    return flowPort !== start.side && node !== start.id ? port.dataset : null;
  }
  function moveWire(event) {
    const start = connection.current;
    if (!start) return;
    const target = wireTarget(event, start);
    const position = positions[target?.node];
    setWire(position ? {
      x: position.x + (target.flowPort === "out" ? nodeWidth : 0),
      y: position.y + portY,
      target: target.node,
      side: target.flowPort,
    } : worldPoint(event));
  }
  function finishWire(event) {
    const start = connection.current;
    const target = wireTarget(event, start);
    if (target) {
      connect(
        start.side === "out" ? target.node : start.id,
        start.side === "out" ? start.id : target.node,
      );
    }
    connection.current = null;
    setWire(null);
    setLinkFrom(null);
  }
  async function extractMember() {
    const id = agent.id;
    setBusy(true);
    setError("");
    try {
      const result = await onExtract(agent.resourceId);
      setAgents((rows) =>
        rows.map((a) => (a.id === id ? { ...a, snapshot: result } : a)),
      );
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
    } finally {
      setBusy(false);
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
                  name:
                    row.metadata?.agent?.slug ||
                    row.name.replace(/[^\p{L}\p{N}_-]/gu, "-").slice(0, 80) ||
                    nodeId,
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
  function remove(ids = selection) {
    if (busy) return;
    if (!Array.isArray(ids)) ids = selection;
    const deleted = new Set(ids);
    setAgents((rows) => rows.filter((a) => !deleted.has(a.id)));
    setDraft((d) => ({
      ...d,
      tasks: d.tasks
        .filter((t) => !deleted.has(t.id))
        .map((t) => ({
          ...t,
          assignee: deleted.has(t.assignee) ? "" : t.assignee,
          dependencies: t.dependencies.filter((id) => !deleted.has(id)),
        })),
    }));
    setPositions((p) =>
      Object.fromEntries(Object.entries(p).filter(([id]) => !deleted.has(id))),
    );
    if (deleted.has(linkFrom)) {
      setLinkFrom(null);
      setWire(null);
      connection.current = null;
    }
    setSelected(null);
    setSelection([]);
    setContextMenu(null);
    view.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    const key = (event) => {
      if (!editor.current?.contains(event.target)) return;
      if (event.key === "Escape" && contextMenu) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setContextMenu(null);
        return;
      }
      if (
        event.key !== "Delete" ||
        event.isComposing ||
        event.target.closest(
          'input,textarea,select,[contenteditable="true"]',
        ) ||
        !selection.length ||
        busy
      )
        return;
      const overlays = document.querySelectorAll("[data-gallery-modal]");
      if (
        overlays.length &&
        !overlays[overlays.length - 1].contains(editor.current)
      )
        return;
      event.preventDefault();
      remove();
    };
    const outside = (event) => {
      if (!event.target.closest(".gal-flow-context-menu")) setContextMenu(null);
    };
    document.addEventListener("keydown", key, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [contextMenu, selection, busy, linkFrom]);
  async function save() {
    setError("");
    try {
      if (agents.some((a) => !a.resourceId && !a.snapshot))
        throw Error("请为每个 Agent 节点选择资源库中的 Agent");
      if (draft.tasks.some((t) => !t.general.requirements.trim()))
        throw Error("请填写每个节点的通用任务要求或通用检查要求");
      const value = validateWorkflowTemplate({
        ...draft,
        members: agents.map((a) => ({ ...a.snapshot })),
        tasks: draft.tasks.map((t) => ({
          ...t,
          assignee: t.assignee
            ? agents.find((a) => a.id === t.assignee)?.snapshot?.name ||
              t.assignee
            : "",
        })),
        positions: {},
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
          ...withResourceCover(resource?.metadata, cover),
          format: "dsh-teamflow-template-v1",
          workflowCanvas: {
            version: 1,
            taskPositions: positions,
            agents: agents.map(({ snapshot, ...node }) => ({
              ...node,
              memberName: snapshot?.name,
            })),
          },
        },
        references: resource?.references || [],
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  function edge(from, to, key, { fromId, toId, assignment = false }) {
    if (!from || !to) return null;
    const path = `M${from.x + nodeWidth},${from.y + portY} C${from.x + nodeWidth + 70},${from.y + portY} ${to.x - 70},${to.y + portY} ${to.x},${to.y + portY}`;
    return (
      <g key={key}>
        <path
          className={assignment ? "assignment" : ""}
          markerEnd={assignment ? undefined : `url(#${arrow})`}
          d={path}
        />
        <path className="gal-flow-edge-hit" d={path}
          data-edge-from={fromId} data-edge-to={toId}
          data-edge-assignment={assignment ? "true" : undefined} />
      </g>
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
          <button
            onClick={() => {
              setSelected(null);
              setSelection([]);
            }}
          >
            流程信息
          </button>
          <button
            onClick={() => {
              fitView();
            }}
          >
            重置视图
          </button>
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
            tabIndex={0}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              "--gal-flow-node-width": `${nodeWidth}px`,
              "--gal-flow-node-height": `${nodeHeight}px`,
              backgroundPosition: `${camera.x}px ${camera.y}px`,
              backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
            }}
            onPointerDown={(e) => {
              if (e.button === 2) {
                e.preventDefault();
                pan.current = {
                  x: e.clientX,
                  y: e.clientY,
                  startX: cameraRef.current.x,
                  startY: cameraRef.current.y,
                  nodeId: e.target.closest("[data-flow-node]")?.dataset.flowNode,
                  edge: e.target.closest("[data-edge-from]")?.dataset,
                  moved: false,
                };
                e.currentTarget.classList.add("gal-flow-panning");
              } else if (
                e.button === 0 &&
                !e.target.closest(".gal-flow-node")
              ) {
                const point = worldPoint(e);
                boxDrag.current = { point, base: e.shiftKey ? selection : [] };
                setSelected(null);
                if (!e.shiftKey) setSelection([]);
              } else return;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (pan.current) {
                const p = pan.current;
                if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 4) {
                  p.moved = true;
                }
                if (!p.moved) return;
                cameraTo({
                  x: p.startX + e.clientX - p.x,
                  y: p.startY + e.clientY - p.y,
                });
              } else if (boxDrag.current) {
                const current = worldPoint(e),
                  start = boxDrag.current.point;
                const r = {
                  x: Math.min(start.x, current.x),
                  y: Math.min(start.y, current.y),
                  width: Math.abs(start.x - current.x),
                  height: Math.abs(start.y - current.y),
                };
                setMarquee(r);
                const nodes = [
                  ...agents.map((a) => ({ id: a.id, p: a.position })),
                  ...Object.entries(positions).map(([id, p]) => ({ id, p })),
                ];
                setSelection([
                  ...new Set([
                    ...boxDrag.current.base,
                    ...nodes
                      .filter(
                        ({ p }) =>
                          p.x < r.x + r.width &&
                          p.x + nodeWidth > r.x &&
                          p.y < r.y + r.height &&
                          p.y + nodeHeight > r.y,
                      )
                      .map((n) => n.id),
                  ]),
                ]);
              }
            }}
            onPointerUp={(e) => {
              const gesture = pan.current;
              endGesture(e);
              if (
                busy || e.button !== 2 || !gesture || gesture.moved ||
                Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 4
              ) return;
              const id = gesture.nodeId;
              const ids = id ? (selection.includes(id) ? selection : [id]) : [];
              if (id) {
                setSelection(ids);
                setSelected(
                  ids.length === 1
                    ? {
                        kind: agents.some((a) => a.id === id)
                          ? "agent"
                          : "task",
                        id,
                      }
                    : null,
                );
              }
              setContextMenu({
                x: Math.max(8, Math.min(e.clientX, window.innerWidth - 215)),
                y: Math.max(8, Math.min(e.clientY, window.innerHeight - 165)),
                point: worldPoint(e),
                ids,
                edge: gesture.edge,
              });
              view.current?.focus({ preventScroll: true });
            }}
            onPointerCancel={endGesture}
            onLostPointerCapture={endGesture}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const kind = e.dataTransfer.getData("application/gallery-node");
              if (!["agent", "task", "human"].includes(kind)) return;
              add(kind, worldPoint(e));
            }}
          >
            <div style={{ width: "100%", height: "100%" }}>
              <div
                className="gal-flow-board"
                ref={board}
                style={{
                  width: 1,
                  height: 1,
                  transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
                }}
              >
                <svg
                  className="gal-flow-edges"
                  width={1}
                  height={1}
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
                  {wire &&
                    connection.current &&
                    (() => {
                      const start = positions[connection.current.id];
                      const from =
                        connection.current.side === "out"
                          ? { x: start.x + nodeWidth, y: start.y + portY }
                          : wire;
                      const to =
                        connection.current.side === "out"
                          ? wire
                          : { x: start.x, y: start.y + portY };
                      return (
                        <path
                          className="gal-flow-wire-preview"
                          d={`M${from.x},${from.y} C${from.x + 70},${from.y} ${to.x - 70},${to.y} ${to.x},${to.y}`}
                        />
                      );
                    })()}
                  {draft.tasks.flatMap((t) => [
                    ...t.dependencies.map((id) =>
                      edge(positions[id], positions[t.id], id + ":" + t.id, { fromId: id, toId: t.id }),
                    ),
                    ...(t.assignee
                      ? [
                          edge(
                            agents.find((a) => a.id === t.assignee)?.position,
                            positions[t.id],
                            "a:" + t.id,
                            { fromId: t.assignee, toId: t.id, assignment: true },
                          ),
                        ]
                      : []),
                  ])}
                </svg>
                {marquee && (
                  <div
                    className="gal-flow-marquee"
                    style={{
                      left: marquee.x,
                      top: marquee.y,
                      width: marquee.width,
                      height: marquee.height,
                    }}
                  />
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
                    className={`gal-flow-node ${n.kind} ${n.human ? "human" : ""} ${selection.includes(n.id) ? "selected" : ""}`}
                    style={{ left: n.position.x, top: n.position.y }}
                    key={n.id}
                    data-flow-node={n.id}
                    onPointerDown={(e) => pointerDown(e, n.kind, n.id)}
                    onPointerMove={move}
                    onPointerUp={() => {
                      drag.current = null;
                    }}
                    onPointerCancel={() => {
                      drag.current = null;
                    }}
                  >
                    <button
                      className="gal-flow-grip"
                      aria-label={`移动 ${n.title}`}
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
                      onClick={(e) => {
                        if (e.detail === 0) {
                          setSelection([n.id]);
                          setSelected({ kind: n.kind, id: n.id });
                        }
                      }}
                    >
                      {n.title || "未命名节点"}
                    </button>
                    <p>{n.subtitle}</p>
                    {n.kind === "task" && (
                      <div className="gal-flow-ports">
                        <button
                          aria-label="连入"
                          title="输入：连接前置节点"
                          className="gal-flow-port-in"
                          data-flow-port="in"
                          data-snap={wire?.target === n.id && wire.side === "in" ? "true" : undefined}
                          data-node={n.id}
                          onPointerDown={(e) => startWire(e, n.id, "in")}
                          onPointerMove={moveWire}
                          onPointerUp={finishWire}
                          onPointerCancel={() => {
                            connection.current = null;
                            setWire(null);
                            setLinkFrom(null);
                          }}
                        >
                          <span className="gal-sr-only">连入</span>
                        </button>
                        <button
                          aria-label="连出"
                          title="输出：连接后续节点"
                          className="gal-flow-port-out"
                          aria-pressed={linkFrom === n.id}
                          data-flow-port="out"
                          data-snap={wire?.target === n.id && wire.side === "out" ? "true" : undefined}
                          data-node={n.id}
                          onPointerDown={(e) => startWire(e, n.id, "out")}
                          onPointerMove={moveWire}
                          onPointerUp={finishWire}
                          onPointerCancel={() => {
                            connection.current = null;
                            setWire(null);
                            setLinkFrom(null);
                          }}
                        >
                          <span className="gal-sr-only">连出</span>
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
                {selection.length > 1 && (
                  <p>
                    已选择 {selection.length}{" "}
                    个节点，拖动任一选中节点可一起移动。
                  </p>
                )}
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
                <ResourceCoverPicker resource={{ ...draft, type: "workflow", cover }} onChange={setCover} />
                <p>
                  Agent 用虚线关联负责人；任务与人工节点用实线表示先后依赖，右键单击实线可删除依赖。
                </p>
              </>
            )}
            {agent && (
              <>
                <h3>Agent 节点</h3>
                <p>配置长期职责与通用指令；本次补充指令在应用模板时填写。</p>
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
                <button
                  type="button"
                  disabled={busy || !agent.resourceId}
                  onClick={extractMember}
                >
                  提取字段
                </button>
                {[
                  ["name", "名称"],
                  ["summary", "功能概述"],
                  ["role", "长期职责"],
                  ["executionPrompt", "通用执行指令 PE"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    {key === "name" ? (
                      <input
                        aria-label={`Agent ${label}`}
                        disabled={busy}
                        maxLength={80}
                        value={agent.snapshot?.[key] || ""}
                        onChange={(e) =>
                          updateAgent({
                            snapshot: {
                              ...agent.snapshot,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    ) : (
                      <textarea
                        aria-label={`Agent ${label}`}
                        disabled={busy}
                        rows={3}
                        maxLength={16000}
                        value={agent.snapshot?.[key] || ""}
                        onChange={(e) =>
                          updateAgent({
                            snapshot: {
                              ...agent.snapshot,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </label>
                ))}
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
                <p>Skill 和 MCP 引用保存在 Gallery 的画布中，当前 TeamFlow 模板尚不接收这些引用。</p>
              </>
            )}
            {task && (
              <>
                <h3>{task.checkpoint ? "人工节点" : "任务节点"}</h3>
                <p>
                  填写可复用的通用要求；具体项目的任务说明在应用模板后生成。
                </p>
                <label>
                  通用节点名称
                  <input
                    aria-label="通用节点名称"
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
                      <option value="">由空闲成员领取</option>
                      <option value="captain">Captain（主会话）</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {[
                  [
                    "requirements",
                    task.checkpoint ? "通用检查要求" : "通用任务要求",
                  ],
                  ["deliverables", "通用交付物"],
                  ["acceptance", "通用验收要求"],
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
        {contextMenu && (
          <div
            className="gal-flow-context-menu"
            role="group"
            aria-label="画布右键菜单"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {contextMenu.edge ? (
              <button onClick={() => {
                const { edgeFrom, edgeTo, edgeAssignment } = contextMenu.edge;
                setDraft((value) => ({
                  ...value,
                  tasks: value.tasks.map((node) => {
                    if (node.id !== edgeTo) return node;
                    if (edgeAssignment) {
                      return node.assignee === edgeFrom ? { ...node, assignee: "" } : node;
                    }
                    return { ...node, dependencies: node.dependencies.filter((id) => id !== edgeFrom) };
                  }),
                }));
                setContextMenu(null);
              }}>
                <Glyph name="trash" />删除连线
              </button>
            ) : contextMenu.ids.length ? (
              <button
                className="gal-delete"
                onClick={() => remove(contextMenu.ids)}
              >
                <Glyph name="trash" />
                删除
                {contextMenu.ids.length > 1
                  ? ` ${contextMenu.ids.length} 个`
                  : ""}
                节点<span>Del</span>
              </button>
            ) : (
              [
                ["agent", "Agent"],
                ["task", "任务"],
                ["human", "人工"],
              ].map(([kind, label]) => (
                <button
                  key={kind}
                  onClick={() => {
                    add(kind, contextMenu.point);
                    setContextMenu(null);
                  }}
                >
                  <Glyph
                    name={
                      kind === "agent"
                        ? "agent"
                        : kind === "human"
                          ? "user"
                          : "file"
                    }
                  />
                  添加{label}节点
                </button>
              ))
            )}
          </div>
        )}
        <footer className="gal-flow-footer">
          <span aria-live="polite">
            {linkFrom
              ? "拖动连线：松开到另一节点的圆点"
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
