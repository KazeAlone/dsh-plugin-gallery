import { WorkflowRoutingSettings } from "./workflow-routing-settings.jsx";
import { reconcileWorkflowRouting, disconnectWorkflowRoute } from "../workflow-routing.mjs";
import { useDraftChanges } from "./draft-changes.mjs";
import { useGalleryText } from "./i18n.jsx";
import React, { useEffect, useId, useRef, useState } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
import { ResourceCoverPicker, withResourceCover } from "./resource-cover.jsx";
import { createResourceIdentifier } from "./resource-id.mjs";
import { configureRejectTarget, connectWorkflowNodes, removeRejectTask, workflowRejectEdges } from "./workflow-connections.mjs";
import { validateWorkflowTemplate, workflowTemplateIssues, MAX_WORKFLOW_TEXT_LENGTH, MAX_WORKFLOW_MEMBERS, MAX_WORKFLOW_TASKS } from "../workflow-template.mjs";
import { assertWorkflowDag, workflowNodeKind, workflowAncestors, workflowLoopBody, validateWorkflowLoops } from "../workflow-loops.mjs";

const nodeWidth = 220;
const nodeHeight = 110;
const portY = nodeHeight / 2;
const nodeTypes = [["agent", "Agent"], ["task", "任务"], ["gate", "门控"], ["human", "验收"], ["archive", "归档"]];
const nodeLabel = kind => ({ task: "任务节点", gate: "门控判断", human: "验收节点", archive: "成果归档" })[kind];
const memberInitial = member => [...(member.snapshot?.name || member.label || "A")][0].toUpperCase();
const nodeIcon = kind => ({ agent: "agent", task: "file", gate: "workflow", human: "user", archive: "download" })[kind];
const portPoint = (position, side, height = nodeHeight) => side === "reject" ? { x: position.x + nodeWidth / 2, y: position.y + height } : { x: position.x + (side === "out" ? nodeWidth : 0), y: position.y + height / 2 };

const galleryAccess = [
  ["gallerySkill", "允许使用 Gallery Skill"],
  ["galleryMcp", "允许使用 Gallery MCP"],
];

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
    })).map((a) => ({
      ...a,
      gallerySkill: a.snapshot?.gallerySkill,
      galleryMcp: a.snapshot?.galleryMcp,
    })) ||
    definition.members.map((m, i) => ({
      id: m.name,
      label: m.name,
      resourceId: "",
      snapshot: m,
      gallerySkill: m.gallerySkill,
      galleryMcp: m.galleryMcp,
      skills: [],
      mcps: [],
      position: { x: 40, y: 70 + i * 155 },
    }));
  return {
    definition: {
      ...definition,
      loops: definition.loops?.map(loop => ({ ...loop, reviewer: agents.find(a => (a.memberName || a.id) === loop.reviewer)?.id || loop.reviewer })),
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
  importedResource,
  onClose,
  onSave,
  onList,
  onGet,
  onExtract,
}) {
  const l = useGalleryText();
  const source = resource ?? importedResource;
  const [cover, setCover] = useState(source?.metadata?.cover ?? "");
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
  const [start] = useState(() => initial(source));
  const [draft, setDraft] = useState(start.definition),
    [agents, setAgents] = useState(start.agents),
    [positions, setPositions] = useState(start.positions);
  const dirty = useDraftChanges({ draft, agents, positions, cover }, Boolean(importedResource));
  const [contextMenu, setContextMenu] = useState(null);
  const connection = useRef(null);
  const [wire, setWire] = useState(null);
  const [catalog, setCatalog] = useState([]);
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
    onList("agent")
      .then((entries) => {
        if (live) setCatalog(entries);
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
    const points = Object.values(positions);
    if (!points.length || !view.current) {
      cameraTo({ x: 0, y: 0 });
      zoomValue.current = 1;
      setZoom(1);
      return;
    }
    const minX = Math.min(...points.map((p) => p.x)),
      minY = Math.min(...points.map((p) => p.y));
    const maxX = Math.max(...points.map((p) => p.x + nodeWidth)),
      maxY = Math.max(...Object.entries(positions).map(([id, p]) => p.y + heightFor(id)));
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
  const update = (patch) => setDraft((d) => ({ ...d, ...patch, ...(patch.tasks ? { tasks: reconcileWorkflowRouting(patch.tasks) } : {}) }));
  const updateTask = (patch) =>
    setDraft((d) => ({
      ...d,
      tasks: reconcileWorkflowRouting(d.tasks.map((t) =>
        t.id === selected.id ? { ...t, ...patch } : t,
      )),
    }));
  const updateAgent = (patch) =>
    setAgents((rows) =>
      rows.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)),
    );
  const selectedKind = task ? workflowNodeKind(task, draft.loops) : null;
  const selectedLoop = task && draft.loops?.find(loop => loop.gateId === task.id);
  function setLoop(gateId, patch) {
    setDraft(d => {
      const gate = d.tasks.find(t => t.id === gateId);
      const previous = d.loops?.find(loop => loop.gateId === gateId);
      const next = { gateId, entryId: "", mode: gate?.reviewMode || "human", maxRounds: 3, timeoutMinutes: 30, rejectToEntry: previous ? Boolean(previous.rejectToEntry) : true, ...previous, ...patch };
      return { ...d, loops: [...(d.loops || []).filter(loop => loop.gateId !== gateId), next] };
    });
  }
  function setReturn(gateId, entryId) {
    if (!entryId) { setLoop(gateId, { entryId: "" }); return; }
    try { update({ loops: configureRejectTarget(draft.tasks, draft.loops, gateId, entryId) }); }
    catch (error) { setError(l(error.message)); return; }
    setSelected({ kind: "task", id: gateId }); setSelection([gateId]); setError("");
  }
  let loopBody = [], loopIssue = "";
  if (selectedLoop) {
    try {
      loopBody = workflowLoopBody(draft.tasks, selectedLoop);
      validateWorkflowLoops(draft.loops, draft.tasks, agents.map(a => ({ name: a.id })), { requireExecutionSetup: true });
    } catch (error) { loopIssue = error.message; }
  }
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
      if (agents.length >= MAX_WORKFLOW_MEMBERS) return setError(l("最多添加 {0} 个 Agent", MAX_WORKFLOW_MEMBERS));
      const id = createResourceIdentifier("a");
      setAgents((rows) => [
        ...rows,
        {
          id,
          label: l("选择 Agent"),
          resourceId: "",
          skills: [],
          mcps: [],
          gallerySkill: false,
          galleryMcp: false,
          position,
        },
      ]);
      setSelected({ kind: "agent", id });
      setSelection([]);
    } else {
      if (draft.tasks.length >= MAX_WORKFLOW_TASKS)
        return setError(l("最多添加 {0} 个流程节点", MAX_WORKFLOW_TASKS));
      const id = createResourceIdentifier("t");
      update({
        tasks: [
          ...draft.tasks,
          {
            id,
            subject: kind === "human" ? l("验收确认") : kind === "gate" ? l("审核判断") : kind === "archive" ? l("成果归档") : l("新任务"),
            assignee: "",
            dependencies: [],
            checkpoint: kind === "human" || kind === "gate",
            ...(["human", "gate"].includes(kind) ? { checkpointKind: kind === "gate" ? "gate" : "acceptance", reviewMode: "human" } : {}),
            ...(kind === "archive" ? { kind: "archive", archive: { copyFiles: false, paths: [] } } : {}),
            general: { requirements: kind === "archive" ? l("整理并归档上游任务的成果和证据。") : "", deliverables: "", acceptance: "" },
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
      positions: { ...positions },
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
  function connect(to, from = linkFrom, outcomeId) {
    if (!from)
      return setError(l("从前置节点的输出圆点拖动到后续节点的输入圆点"));
    try {
      const next = connectWorkflowNodes(draft.tasks, draft.loops, from, to);
      if (outcomeId) next.tasks = next.tasks.map(row => row.id === from && row.dynamicRoute ? { ...row, dynamicRoute: { ...row.dynamicRoute, outcomes: row.dynamicRoute.outcomes.map(outcome => outcome.id === outcomeId ? { ...outcome, targets: [...new Set([...outcome.targets, to])] } : outcome) } } : row);
      update(next);
      setError("");
      setLinkFrom(null);
    } catch (e) {
      setError(e.message);
    }
  }
  function startWire(event, id, side, outcomeId) {
    if (event.button !== 0 || busy) return;
    event.preventDefault();
    event.stopPropagation();
    connection.current = { id, side, outcomeId };
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
    const compatible = start.side === "in" ? ["out", "reject"].includes(flowPort) : flowPort === "in";
    return compatible && node !== start.id ? port.dataset : null;
  }
  function moveWire(event) {
    const start = connection.current;
    if (!start) return;
    const target = wireTarget(event, start);
    const position = positions[target?.node];
    setWire(position ? {
      ...wirePoint(target.node, target.flowPort, target.outcome),
      target: target.node,
      side: target.flowPort,
    } : worldPoint(event));
  }
  function finishWire(event) {
    const start = connection.current;
    const target = wireTarget(event, start);
    if (target) {
      if (start.side === "reject" || target.flowPort === "reject") {
        setReturn(start.side === "reject" ? start.id : target.node, start.side === "reject" ? target.node : start.id);
      } else connect(start.side === "out" ? target.node : start.id, start.side === "out" ? start.id : target.node, start.side === "out" ? start.outcomeId : target.outcome);
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
      updateAgent({ resourceId: "", label: l("选择 Agent"), snapshot: null });
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
      loops: d.loops?.filter(loop => !deleted.has(loop.gateId)).map(loop => ({ ...loop, ...(deleted.has(loop.entryId) ? { entryId: "" } : {}), rejectTaskIds: loop.rejectTaskIds?.filter(id => !deleted.has(id)), ...(deleted.has(loop.reviewer) ? { reviewer: undefined } : {}) })),
      tasks: reconcileWorkflowRouting(d.tasks
        .filter((t) => !deleted.has(t.id))
        .map((t) => ({
          ...t,
          assignee: deleted.has(t.assignee) ? "" : t.assignee,
          dependencies: t.dependencies.filter((id) => !deleted.has(id)),
        }))),
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
        (!selection.length && selected?.kind !== "agent") ||
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
      remove(selected?.kind === "agent" ? [selected.id] : selection);
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
  }, [contextMenu, selection, selected, busy, linkFrom]);
  async function save() {
    setError("");
    try {
      if (agents.some((a) => !a.resourceId && !a.snapshot))
        throw Error(l("请为每个成员选择资源库中的 Agent"));
      const value = validateWorkflowTemplate({
        ...draft,
        loops: draft.loops?.map(loop => ({ ...loop, reviewer: agents.find(a => a.id === loop.reviewer)?.snapshot?.name || loop.reviewer })),
        members: agents.map((a) => ({ ...a.snapshot, gallerySkill: a.gallerySkill, galleryMcp: a.galleryMcp })),
        tasks: draft.tasks.map((t) => ({
          ...t,
          ...(t.kind === "archive" ? { archive: { ...t.archive, paths: (t.archive?.paths || []).map(p => p.trim()).filter(Boolean) } } : {}),
          assignee: t.assignee
            ? agents.find((a) => a.id === t.assignee)?.snapshot?.name ||
              t.assignee
            : "",
        })),
        positions: {},
      }, { draft: true });
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
          ...withResourceCover(source?.metadata, cover),
          format: "dsh-teamflow-template-v1",
          workflowCanvas: {
            version: 1,
            draft: workflowTemplateIssues(value).length > 0,
            taskPositions: positions,
            agents: agents.map(({ snapshot, ...node }) => ({
              ...node,
              memberName: snapshot?.name,
            })),
          },
        },
        references: source?.references || [],
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  const taskActor = task => task.assignee || draft.loops?.find(loop => loop.gateId === task.id && loop.mode === "ai")?.reviewer;
  function heightFor(id) { return Math.max(nodeHeight, ((draft.tasks.find(row => row.id === id)?.dynamicRoute?.outcomes.length || 0) + 1) * 22); }
  function wirePoint(id, side, outcomeId) {
    const point = portPoint(positions[id], side, heightFor(id));
    const outcomes = draft.tasks.find(row => row.id === id)?.dynamicRoute?.outcomes;
    const index = outcomes?.findIndex(row => row.id === outcomeId) ?? -1;
    return side === "out" && index >= 0 ? { ...point, y: positions[id].y + (index + 1) * heightFor(id) / (outcomes.length + 1) } : point;
  }
  function edge(from, to, key, { fromId, toId, returning = false, edgeKind, gateId, outcomeId }) {
    if (!from || !to) return null;
    const outcomes = returning ? [] : (draft.tasks.find(row => row.id === fromId)?.dynamicRoute?.outcomes.filter(row => row.targets.includes(toId) && (!outcomeId || row.id === outcomeId)) || []);
    const routeLabel = outcomes?.map(row => row.label).join(" / ");
    const start = wirePoint(fromId, "out", outcomes?.[0]?.id);
    const end = wirePoint(toId, "in");
    const bottom = returning && draft.tasks.find(t => t.id === fromId)?.checkpoint;
    const path = bottom ? `M${from.x + nodeWidth / 2},${from.y + nodeHeight} C${from.x + nodeWidth / 2},${Math.max(from.y, to.y) + nodeHeight + 100} ${to.x - 80},${Math.max(from.y, to.y) + nodeHeight + 100} ${to.x},${end.y}` : `M${start.x},${start.y} C${start.x + 70},${start.y} ${to.x - 70},${end.y} ${to.x},${end.y}`;
    const pass = !returning && workflowNodeKind(draft.tasks.find(t => t.id === fromId) || {}, draft.loops) === "gate";
    return (
      <g key={key}>
        <path
          className={returning ? "gal-flow-reject-edge" : routeLabel ? "gal-flow-route-edge" : pass ? "gal-flow-pass-edge" : ""}
          markerEnd={`url(#${arrow})`}
          d={path}
        />
        {(pass || returning || routeLabel) && <text className={returning ? "gal-flow-reject-label" : "gal-flow-pass-label"} x={returning ? (from.x + to.x) / 2 : (from.x + nodeWidth + to.x) / 2} y={bottom ? Math.max(from.y, to.y) + nodeHeight + 70 : (from.y + to.y) / 2 + portY - 10}>{returning ? l("REJECT · 返工") : routeLabel || "PASS"}</text>}
        <path className="gal-flow-edge-hit" d={path}
          data-edge-return={returning ? "true" : undefined}
          data-edge-kind={edgeKind} data-edge-gate={gateId}
          data-edge-from={fromId} data-edge-to={toId} data-edge-outcome={outcomeId}
 />
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
        if (!busy) onClose(dirty);
      }}
    >
      <section
        ref={editor}
        className={`gal-dialog gal-flow-editor ${fullscreen ? "gal-flow-fullscreen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={resource ? l("编辑 Workflow") : l("新建 Workflow")}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <h2>
            <Glyph name="workflow" />{l(" Workflow 画布")}</h2>
          <span className="gal-flow-status">{l("可保存草稿 · 补全后注册到 TeamFlow")}</span>
          <button
            aria-label={l("关闭编辑")}
            disabled={busy}
            onClick={async () => {
              if (fullscreen) await toggleFullscreen();
              onClose(dirty);
            }}
          >
            <Glyph name="close" />
          </button>
        </header>
        <div className="gal-flow-toolbar">
          <div>
            {nodeTypes.map(([kind, label]) => (
              <button
                key={kind}
                disabled={busy}
                draggable={!busy && kind !== "agent"}
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/gallery-node", kind)
                }
                onClick={() => add(kind)}
              >
                <Glyph
                  name={nodeIcon(kind)}
                />
                {kind === "agent" ? l("添加Agent成员") : l("添加{0}节点", l(label))}
              </button>
            ))}
          </div>
          <label>{l("缩放")}<select
              aria-label={l("画布缩放")}
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
          >{l("流程信息")}</button>
          <button
            onClick={() => {
              fitView();
            }}
          >{l("重置视图")}</button>
          <button
            aria-label={fullscreen ? l("退出全屏") : l("全屏画布")}
            onClick={toggleFullscreen}
          >
            {fullscreen ? l("退出全屏") : l("全屏画布")}
          </button>
        </div>
        {error && (
          <p role="alert" className="gal-flow-error">
            {l(error)}
            <button aria-label={l("关闭错误")} onClick={() => setError("")}>
              <Glyph name="close" />
            </button>
          </p>
        )}
        <div className="gal-flow-body">
          <aside className="gal-flow-roster" aria-label={l("Agent 成员列表")}>
            <header><strong>{l("Agent 成员")}</strong><span>{agents.length}</span></header>
            <div className="gal-flow-roster-list">
              {agents.map(a => {
                const owned = draft.tasks.filter(t => taskActor(t) === a.id);
                const active = selected?.kind === "agent" && selected.id === a.id;
                return <button key={a.id} type="button" className="gal-flow-member" data-flow-member={a.id} aria-pressed={active}
                  aria-label={l("编辑 Agent · {0}", a.label)} title={a.snapshot?.summary || a.label}
                  onClick={() => { setSelected({ kind: "agent", id: a.id }); setSelection([]); }}>
                  <span className="gal-flow-avatar" aria-hidden="true">{memberInitial(a)}</span>
                  <span className="gal-flow-member-copy"><strong>{a.label}</strong><small>{a.snapshot?.summary || l("选择资源并配置成员")}</small>
                    <span className="gal-flow-member-meta"><span>{owned.length}{l(" 个节点")}</span><span title={`Skill ${a.gallerySkill === false ? l("关闭") : l("开启")}`} aria-label={`Skill ${a.gallerySkill === false ? l("关闭") : l("开启")}`} data-enabled={a.gallerySkill !== false}><Glyph name="skill" size={12}/></span><span title={`MCP ${a.galleryMcp === false ? l("关闭") : l("开启")}`} aria-label={`MCP ${a.galleryMcp === false ? l("关闭") : l("开启")}`} data-enabled={a.galleryMcp !== false}><Glyph name="mcp" size={12}/></span></span>
                  </span>
                </button>;
              })}
              {!agents.length && <p>{l("添加成员，再为任务分配负责人。")}</p>}
            </div>
          </aside>
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
                  ...Object.entries(positions).map(([id, p]) => ({ id, p })),
                ];
                setSelection([
                  ...new Set([
                    ...boxDrag.current.base,
                    ...nodes
                      .filter(
                        ({ id, p }) =>
                          p.x < r.x + r.width &&
                          p.x + nodeWidth > r.x &&
                          p.y < r.y + r.height &&
                          p.y + heightFor(id) > r.y,
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
              if (!nodeTypes.some(([type]) => type === kind)) return;
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
                      const from =
                        connection.current.side !== "in"
                          ? wirePoint(connection.current.id, connection.current.side, connection.current.outcomeId)
                          : wire;
                      const to =
                        connection.current.side !== "in"
                          ? wire
                          : wirePoint(connection.current.id, "in");
                      return (
                        <path
                          className="gal-flow-wire-preview"
                          d={`M${from.x},${from.y} C${from.x + 70},${from.y} ${to.x - 70},${to.y} ${to.x},${to.y}`}
                        />
                      );
                    })()}
                  {draft.tasks.flatMap((t) => [
                    ...t.dependencies.flatMap((id) => {
                      const outcomes = draft.tasks.find(row => row.id === id)?.dynamicRoute?.outcomes.filter(row => row.targets.includes(t.id));
                      return (outcomes?.length ? outcomes : [undefined]).map(outcome => edge(positions[id], positions[t.id], `${id}:${t.id}:${outcome?.id || "dependency"}`, { fromId: id, toId: t.id, outcomeId: outcome?.id, returning: draft.loops?.some(loop => loop.rejectTaskIds?.includes(id) && loop.rejectTaskIds.includes(t.id)) }));
                    }),
                  ])}
                  {(draft.loops || []).flatMap(loop => workflowRejectEdges(draft.tasks, loop).map(({ from, to, kind }) => edge(positions[from], positions[to], `reject:${loop.gateId}:${from}:${to}`, { fromId: from, toId: to, returning: true, edgeKind: kind, gateId: loop.gateId })))}
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
                  ...draft.tasks.map((t) => ({
                    kind: "task",
                    id: t.id,
                    title: t.subject,
                    position: positions[t.id],
                    human: t.checkpoint,
                    nodeType: workflowNodeKind(t, draft.loops),
                    subtitle: t.kind === "archive" ? (t.archive?.copyFiles ? l("归档成果与文件") : l("归档证据与摘要")) : t.checkpoint
                      ? ((draft.loops?.find(loop => loop.gateId === t.id)?.mode || t.reviewMode) === "ai" ? l("AI 审核") : l("人工审核"))
                      : agents.find((a) => a.id === t.assignee)?.label ||
                        l("未指定 Agent"),
                  })),
                ].map((n) => (
                  <article
                    className={`gal-flow-node ${n.kind} ${n.nodeType || ""} ${draft.loops?.some(loop => loop.rejectTaskIds?.includes(n.id)) ? "gal-flow-reject-task" : ""} ${selection.includes(n.id) ? "selected" : ""}`}
                    style={{ left: n.position.x, top: n.position.y, height: heightFor(n.id) }}
                    key={n.id}
                    data-flow-node={n.id}
                    data-member-match={selected?.kind === "agent" && taskActor(draft.tasks.find(t => t.id === n.id)) === selected.id ? "true" : undefined}
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
                      aria-label={l("移动 {0}", n.title)}
                    >
                      <Glyph
                        name={nodeIcon(n.nodeType || n.kind)}
                      />
                      {draft.loops?.some(loop => loop.rejectTaskIds?.includes(n.id)) ? l("仅退回时执行") : draft.tasks.find(row => row.id === n.id)?.dynamicRoute ? l("动态分支") : n.kind === "agent" ? "AGENT" : l(nodeLabel(n.nodeType))}
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
                      {n.title || l("未命名节点")}
                    </button>
                    {agents.find(a => a.id === taskActor(draft.tasks.find(t => t.id === n.id))) ? (() => {
                      const owner = agents.find(a => a.id === taskActor(draft.tasks.find(t => t.id === n.id)));
                      return <button type="button" className="gal-flow-assignee" aria-label={l("编辑负责人 · {0}", owner.label)} title={owner.snapshot?.summary || owner.label}
                        onPointerDown={e => e.stopPropagation()} onClick={() => { setSelected({ kind: "agent", id: owner.id }); setSelection([]); }}>
                        <span className="gal-flow-avatar" aria-hidden="true">{memberInitial(owner)}</span><span>{owner.label}</span>{n.nodeType === "gate" && <small>{l("审核")}</small>}
                      </button>;
                    })() : <p>{n.subtitle}</p>}
                    {n.kind === "task" && (
                      <div className="gal-flow-ports">
                        <button
                          aria-label={l("连入")}
                          title={l("输入：连接前置节点")}
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
                          <span className="gal-sr-only">{l("连入")}</span>
                        </button>
                        {!draft.tasks.find(row => row.id === n.id)?.dynamicRoute && <button
                          aria-label={l("连出")}
                          title={n.nodeType === "gate" ? l("PASS：连接通过后执行的节点") : l("输出：连接后续节点")}
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
                          <span className="gal-sr-only">{l("连出")}</span>
                        </button>}
                        {draft.tasks.find(row => row.id === n.id)?.dynamicRoute?.outcomes.map((outcome, index, outcomes) => <button key={outcome.id} className="gal-flow-port-out gal-flow-port-route"
                          style={{ top: `${(index + 1) * 100 / (outcomes.length + 1)}%` }} aria-label={l("连出 · {0}", outcome.label)} title={outcome.label}
                          data-flow-port="out" data-node={n.id} data-outcome={outcome.id}
                          onPointerDown={e => startWire(e, n.id, "out", outcome.id)} onPointerMove={moveWire} onPointerUp={finishWire}
                          onPointerCancel={() => { connection.current = null; setWire(null); setLinkFrom(null); }} />)}
                        {n.nodeType === "gate" && <button className="gal-flow-port-reject" aria-label={l("REJECT 返回")} title={l("REJECT：拖到循环入口或退回分支任务的输入点")}
                          data-flow-port="reject" data-node={n.id} onPointerDown={e => startWire(e, n.id, "reject")} onPointerMove={moveWire} onPointerUp={finishWire}
                          onPointerCancel={() => { connection.current = null; setWire(null); setLinkFrom(null); }}><span>REJECT</span></button>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
          <aside className="gal-flow-inspector">
            {loading && <p role="status">{l("正在读取资源库…")}</p>}
            {!task && !agent && (
              <>
                {selection.length > 1 && (
                  <p>{l("已选择 ")}{selection.length}{" "}{l("个节点，拖动任一选中节点可一起移动。")}</p>
                )}
                <h3>{l("流程信息")}</h3>
                <label>{l("模板名称")}<input
                    aria-label={l("模板名称")}
                    maxLength={120}
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </label>
                <label>{l("适用说明")}<textarea
                    rows={3}
                    maxLength={2000}
                    value={draft.description}
                    onChange={(e) => update({ description: e.target.value })}
                  />
                </label>
                <label>{l("应用前需要提供的信息")}<textarea
                    maxLength={4000}
                    value={draft.inputs}
                    onChange={(e) => update({ inputs: e.target.value })}
                  />
                </label>
                <label>{l("标签（逗号分隔）")}<input
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
                <p>{l("从左侧成员列表配置 Agent，点击任务上的负责人也可编辑成员。画布连线表示依赖和 REJECT 返工路径。")}</p>
              </>
            )}
            {agent && (
              <>
                <h3>{l("Agent 成员")}</h3>
                <p>{l("配置长期职责与通用指令；本次补充指令在应用模板时填写。")}</p>
                <label>{l("资源库 Agent")}<select
                    aria-label={l("资源库 Agent")}
                    value={agent.resourceId}
                    disabled={busy || loading}
                    onChange={(e) => chooseAgent(e.target.value)}
                  >
                    <option value="">{l("请选择 Agent")}</option>
                    {agent.resourceId &&
                      !catalog.some((r) => r.id === agent.resourceId) && (
                        <option value={agent.resourceId}>
                          {agent.label}{l("（资源已不可用）")}</option>
                      )}
                    {catalog.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!catalog.length && !loading && (
                  <p>{l("资源库暂无 Agent，请先在 Agent 分类创建。")}</p>
                )}
                <button
                  type="button"
                  disabled={busy || !agent.resourceId}
                  onClick={extractMember}
                >{l("提取字段")}</button>
                {[
                  ["name", l("名称")],
                  ["summary", l("职责概述")],
                  ["role", l("角色职责")],
                  ["executionPrompt", l("通用执行指令 / PE")],
                ].map(([key, label]) => (
                  <label key={key}>
                    {l(label)}
                    {key === "name" ? (
                      <input
                        aria-label={`Agent ${l(label)}`}
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
                        aria-label={`Agent ${l(label)}`}
                        disabled={busy}
                        rows={3}
                        maxLength={MAX_WORKFLOW_TEXT_LENGTH}
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
                {galleryAccess.map(([key, label]) => (
                  <label className="gal-flow-check" key={key}>
                    <input type="checkbox" checked={agent[key] !== false}
                      onChange={(e) => updateAgent({ [key]: e.target.checked })} />
                    {l(label)}
                  </label>
                ))}
              </>
            )}
            {task && (
              <>
                <h3>{l(nodeLabel(selectedKind))}</h3>
                <p>{l("填写可复用的通用要求；具体项目的任务说明在应用模板后生成。")}</p>
                <label>{l("通用节点名称")}<input
                    aria-label={l("通用节点名称")}
                    maxLength={200}
                    value={task.subject}
                    onChange={(e) => updateTask({ subject: e.target.value })}
                  />
                </label>
                <WorkflowRoutingSettings task={task} tasks={draft.tasks} onChange={updateTask} />
                {task.checkpoint && <label>{l("审核方式")}<select aria-label={l("审核方式")} value={selectedLoop?.mode || task.reviewMode || "human"}
                    onChange={e => { updateTask({ reviewMode: e.target.value }); if (selectedLoop) setLoop(task.id, { mode: e.target.value, ...(e.target.value === "human" ? { reviewer: undefined } : {}) }); }}>
                    <option value="human">{l("人工审核")}</option><option value="ai">{l("AI 审核")}</option>
                  </select>
                </label>}
                {selectedKind === "gate" && <section className="gal-flow-loop-settings" aria-label={l("门控路径与循环")}>
                  <h4>{l("PASS · 通过后继续")}</h4>
                  <div className="gal-flow-pass-targets">
                    {draft.tasks.filter(t => t.id !== task.id && !selectedLoop?.rejectTaskIds?.includes(t.id) && !workflowAncestors(draft.tasks, task.id).has(t.id)).map(t => <label className="gal-flow-check" key={t.id}>
                      <input type="checkbox" checked={t.dependencies.includes(task.id)} onChange={e => {
                        if (e.target.checked) connect(t.id, task.id);
                        else update({ tasks: draft.tasks.map(row => row.id === t.id ? { ...row, dependencies: row.dependencies.filter(id => id !== task.id) } : row) });
                      }} />{t.subject || l("未命名节点")}
                    </label>)}
                  </div>
                  {!draft.tasks.some(t => t.dependencies.includes(task.id)) && <p>{l("通过后结束此路径")}</p>}
                  <label>{l("REJECT · 返回入口")}<select aria-label={l("REJECT 返回入口")} value={selectedLoop?.entryId || ""} onChange={e => setLoop(task.id, { entryId: e.target.value })}>
                      <option value="">{l("稍后连接循环入口")}</option>
                      {draft.tasks.filter(t => !t.checkpoint && t.kind !== "archive" && !selectedLoop?.rejectTaskIds?.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.subject || l("未命名节点")}</option>)}
                    </select>
                  </label>
                  {!selectedLoop && <button type="button" onClick={() => setLoop(task.id, {})}>{l("配置 REJECT 分支")}</button>}
                  {selectedLoop && <fieldset className="gal-flow-reject-settings"><legend>{l("REJECT 后执行的任务")}</legend>
                    <p>{l("仅在退回时执行，完成后返回循环入口。可从 REJECT 点拖线到任务，再连接分支内任务。")}</p>
                    {draft.tasks.filter(t => !t.checkpoint && t.kind !== "archive" && !workflowAncestors(draft.tasks, task.id).has(t.id)).map(t => <label className="gal-flow-check" key={t.id}>
                      <input type="checkbox" checked={Boolean(selectedLoop.rejectTaskIds?.includes(t.id))} onChange={e => {
                        if (e.target.checked) setReturn(task.id, t.id);
                        else update(removeRejectTask(draft.tasks, draft.loops, task.id, t.id));
                      }} />{t.subject || l("未命名节点")}
                    </label>)}
                  </fieldset>}
                  {selectedLoop && <>
                    {selectedLoop.mode === "ai" && <label>{l("独立审核 Agent")}<select aria-label={l("独立审核 Agent")} value={selectedLoop.reviewer || ""} onChange={e => setLoop(task.id, { reviewer: e.target.value })}>
                        <option value="">{l("选择独立审核 Agent")}</option>
                        {agents.map(a => <option key={a.id} value={a.id} >{a.label}</option>)}
                      </select>
                    </label>}
                    <label>{l("轮次上限（包含首次）")}<input aria-label={l("轮次上限（包含首次）")} type="number" min={1} max={20} value={selectedLoop.maxRounds} onChange={e => setLoop(task.id, { maxRounds: Number(e.target.value) })} /></label>
                    <label>{l("每轮超时（分钟）")}<input aria-label={l("每轮超时（分钟）")} type="number" min={1} max={1440} value={selectedLoop.timeoutMinutes} onChange={e => setLoop(task.id, { timeoutMinutes: Number(e.target.value) })} /></label>
                    <label className="gal-flow-check"><input type="checkbox" disabled={Boolean(selectedLoop.rejectTaskIds?.length)} checked={Boolean(selectedLoop.rejectToEntry)} onChange={e => setLoop(task.id, { rejectToEntry: e.target.checked })} />{l("退回时从入口重跑")}</label>
                    {!selectedLoop.rejectToEntry && <p>{l("审核时由 TeamFlow 指定返工任务及其下游。")}</p>}
                    {!!loopBody.length && <p>{l("循环内任务：")}{loopBody.map(id => draft.tasks.find(t => t.id === id)?.subject).join(" → ")}</p>}
                    {loopIssue && <p role="status" className="gal-error">{l(loopIssue)}</p>}
                    <button type="button" onClick={() => update({ loops: (draft.loops || []).filter(loop => loop.gateId !== task.id) })}>{l("删除 REJECT 返回线")}</button>
                  </>}
                </section>}
                {selectedKind === "archive" && <>
                  <label className="gal-flow-check"><input type="checkbox" checked={Boolean(task.archive?.copyFiles)} onChange={e => updateTask({ archive: { ...task.archive, copyFiles: e.target.checked } })} />{l("复制成果文件")}</label>
                  <p>{l("默认记录证据和文件摘要；开启后由 TeamFlow 按归档策略复制文件。")}</p>
                  <label>{l("归档路径（每行一个）")}<textarea aria-label={l("归档路径（每行一个）")} rows={4} value={(task.archive?.paths || []).join("\n")} onChange={e => updateTask({ archive: { ...task.archive, paths: e.target.value.split("\n") } })} placeholder={l("留空使用上游交付物与变更文件")} /></label>
                </>}
                {!task.checkpoint && task.kind !== "archive" && (
                  <label>{l("负责 Agent")}<select
                      aria-label={l("负责 Agent")}
                      value={task.assignee}
                      onChange={(e) => updateTask({ assignee: e.target.value })}
                    >
                      <option value="">{l("由空闲成员领取")}</option>
                      <option value="captain">{l("Captain（主会话）")}</option>
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
                    l("通用任务要求"),
                  ],
                  ["deliverables", l("通用交付物")],
                  ["acceptance", l("通用验收要求")],
                ].map(([key, label]) => (
                  <label key={key}>
                    {l(label)}
                    <textarea
                      aria-label={l(label)}
                      rows={3}
                      maxLength={MAX_WORKFLOW_TEXT_LENGTH}
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
              <button className="gal-delete" disabled={busy} onClick={() => remove(agent ? [agent.id] : selection)}>
                <Glyph name="trash" />
                {agent ? l("删除成员") : l("删除节点")}
              </button>
            )}
          </aside>
        </div>
        {contextMenu && (
          <div
            className="gal-flow-context-menu"
            role="group"
            aria-label={l("画布右键菜单")}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {contextMenu.edge ? (
              <button onClick={() => {
                const { edgeFrom, edgeTo, edgeKind, edgeGate, edgeOutcome } = contextMenu.edge;
                if (edgeKind === "return" || edgeKind === "reject-end") { setLoop(edgeGate, { entryId: "" }); setContextMenu(null); return; }
                if (edgeKind === "reject-start" || edgeKind === "reject-order") { update(removeRejectTask(draft.tasks, draft.loops, edgeGate, edgeTo)); setContextMenu(null); return; }
                setDraft((value) => ({
                  ...value,
                  tasks: disconnectWorkflowRoute(value.tasks, edgeFrom, edgeTo, edgeOutcome),
                }));
                setContextMenu(null);
              }}>
                <Glyph name="trash" />{l("删除连线")}</button>
            ) : contextMenu.ids.length ? (
              <button
                className="gal-delete"
                onClick={() => remove(contextMenu.ids)}
              >
                <Glyph name="trash" />{contextMenu.ids.length > 1 ? l("删除 {0} 个节点", contextMenu.ids.length) : l("删除节点")}<span>Del</span>
              </button>
            ) : (
              nodeTypes.map(([kind, label]) => (
                <button
                  key={kind}
                  onClick={() => {
                    add(kind, contextMenu.point);
                    setContextMenu(null);
                  }}
                >
                  <Glyph
                    name={nodeIcon(kind)}
                  />
                  {kind === "agent" ? l("添加Agent成员") : l("添加{0}节点", l(label))}
                </button>
              ))
            )}
          </div>
        )}
        <footer className="gal-flow-footer">
          <span aria-live="polite">
            {linkFrom
              ? l("拖动连线：松开到另一节点的圆点")
              : l("{0} Agent · {1} 流程节点 · {2} 循环", agents.length, draft.tasks.length, draft.loops?.length || 0)}
          </span>
          {linkFrom && (
            <button onClick={() => setLinkFrom(null)}>{l("取消连线")}</button>
          )}
          <button
            className="gal-primary"
            disabled={busy || loading}
            onClick={save}
          >
            {busy ? l("保存中…") : l("保存 Workflow")}
          </button>
        </footer>
      </section>
    </Modal>
  );
}
