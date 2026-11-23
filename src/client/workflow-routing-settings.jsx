import React from "react";
import { useGalleryText } from "./i18n.jsx";

export function WorkflowRoutingSettings({ task, tasks, onChange }) {
  const l = useGalleryText();
  const route = task.dynamicRoute;
  const ordinary = !task.checkpoint && task.kind !== "archive";
  const outgoing = tasks.filter((row) => row.dependencies.includes(task.id));
  const upstream = tasks.filter(
    (row) => task.dependencies.includes(row.id) && !row.dynamicRoute,
  );
  const updateOutcome = (id, patch) =>
    onChange({
      dynamicRoute: {
        ...route,
        outcomes: route.outcomes.map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      },
    });
  return (
    <>
      {ordinary && (
        <section className="gal-flow-loop-settings" aria-label={l("动态分支")}>
          <label className="gal-flow-check">
            <input
              type="checkbox"
              aria-label={l("启用动态分支")}
              checked={Boolean(route)}
              onChange={(event) =>
                onChange({
                  dynamicRoute: event.target.checked
                    ? {
                        mode: "agent",
                        outcomes: [1, 2].map((index) => ({
                          id: `state_${index}`,
                          label: l("状态 {0}", index),
                          condition: "",
                          targets:
                            index === 1 ? outgoing.map((row) => row.id) : [],
                        })),
                      }
                    : undefined,
                })
              }
            />
            {l("动态分支")}
          </label>
          <p>
            {l(
              "完成任务后，根据结果只选择一个状态，执行该状态连接的后续节点。",
            )}
          </p>
          {route && (
            <>
              <label>
                {l("状态选择方式")}
                <select
                  aria-label={l("状态选择方式")}
                  value={route.mode}
                  onChange={(event) =>
                    onChange({
                      dynamicRoute: { ...route, mode: event.target.value },
                    })
                  }
                >
                  <option value="agent">{l("Agent 判断")}</option>
                  <option value="human">{l("人工选择")}</option>
                </select>
              </label>
              {route.outcomes.map((outcome, index) => (
                <fieldset key={outcome.id} className="gal-flow-route-outcome">
                  <legend>{l("状态 {0}", index + 1)}</legend>
                  <label>
                    {l("状态名称")}
                    <input
                      aria-label={l("状态 {0} 名称", index + 1)}
                      maxLength={80}
                      value={outcome.label}
                      onChange={(event) =>
                        updateOutcome(outcome.id, { label: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {l("判断条件")}
                    <textarea
                      aria-label={l("状态 {0} 判断条件", index + 1)}
                      maxLength={2000}
                      rows={2}
                      value={outcome.condition}
                      onChange={(event) =>
                        updateOutcome(outcome.id, {
                          condition: event.target.value,
                        })
                      }
                    />
                  </label>
                  <p>{l("后续节点")}</p>
                  {outgoing.map((row) => (
                    <label className="gal-flow-check" key={row.id}>
                      <input
                        type="checkbox"
                        aria-label={l("状态 {0} → {1}", index + 1, row.subject)}
                        checked={outcome.targets.includes(row.id)}
                        onChange={(event) =>
                          updateOutcome(outcome.id, {
                            targets: event.target.checked
                              ? [...outcome.targets, row.id]
                              : outcome.targets.filter((id) => id !== row.id),
                          })
                        }
                      />
                      {row.subject}
                    </label>
                  ))}
                  {!outcome.targets.length && (
                    <p>{l("选中此状态时结束该路径")}</p>
                  )}
                  <button
                    type="button"
                    disabled={route.outcomes.length <= 2}
                    onClick={() =>
                      onChange({
                        dynamicRoute: {
                          ...route,
                          outcomes: route.outcomes.filter(
                            (row) => row.id !== outcome.id,
                          ),
                        },
                      })
                    }
                  >
                    {l("删除状态")}
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                disabled={route.outcomes.length >= 12}
                onClick={() => {
                  let index = 1;
                  while (
                    route.outcomes.some((row) => row.id === `state_${index}`)
                  )
                    index++;
                  onChange({
                    dynamicRoute: {
                      ...route,
                      outcomes: [
                        ...route.outcomes,
                        {
                          id: `state_${index}`,
                          label: l("状态 {0}", index),
                          condition: "",
                          targets: [],
                        },
                      ],
                    },
                  });
                }}
              >
                {l("添加状态")}
              </button>
              <p>
                {l(
                  "从节点右侧对应状态的圆点拖线，也可为已有连线勾选状态。每条后续连线至少属于一个状态。",
                )}
              </p>
            </>
          )}
        </section>
      )}
      {(upstream.length > 0 || task.routeJoin?.length > 0) && (
        <section className="gal-flow-loop-settings" aria-label={l("分支汇合")}>
          <h4>{l("分支汇合")}</h4>
          <p>
            {l(
              "勾选来自互斥分支的上游：等待实际启用的路径完成，忽略未启用的路径。未勾选的依赖仍须全部完成。",
            )}
          </p>
          {upstream.map((row) => (
            <label className="gal-flow-check" key={row.id}>
              <input
                type="checkbox"
                aria-label={l("汇合 · {0}", row.subject)}
                checked={Boolean(task.routeJoin?.includes(row.id))}
                onChange={(event) =>
                  onChange({
                    routeJoin: event.target.checked
                      ? [...(task.routeJoin || []), row.id]
                      : task.routeJoin.filter((id) => id !== row.id),
                  })
                }
              />
              {row.subject}
            </label>
          ))}
        </section>
      )}
    </>
  );
}
