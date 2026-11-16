# OpenCode lightweight export / 轻量导出

Available on both `main` and `dev`. The export feature was backported to stable `main` on 2026-11-16.

## 使用

1. 在画布保存属性修改、完成节点配置，并处理待确认的方案。
2. 点击顶部「导出 OpenCode」，下载 ZIP。
3. 将 `.opencode/` 和 `teamflow/` 合并到目标项目根目录。保留已有文件；重复导出同一流程会使用相同名称，覆盖前请检查。
4. 阅读 `teamflow/teamflow-xxxxxxxx/README.md`，在目标项目打开 OpenCode，输入其中的 `/teamflow-xxxxxxxx` 命令。无需额外插件，使用 OpenCode 已配置的模型与权限。
5. 人工验收时在对话中明确回复通过或退回。

The namespace is a deterministic hash of the TeamFlow identity, so user-provided names cannot become filesystem paths. Commands use the primary `build` agent and reference ordinary data files. Role agents have `mode: subagent`; task text is not inserted into command templates or YAML frontmatter, avoiding unintended shell/argument/file expansion during command loading.

## Package format

```text
.opencode/commands/teamflow-xxxxxxxx.md
.opencode/agents/teamflow-xxxxxxxx-member-1.md
teamflow/teamflow-xxxxxxxx/README.md
teamflow/teamflow-xxxxxxxx/workflow.md
teamflow/teamflow-xxxxxxxx/workflow.json
```

`workflow.json` is a TeamFlow interchange format, **not a native OpenCode workflow schema**. Schema version 1 contains `target`, `name`, `description`, `execution`, `members`, `tasks` and `loops`. Members map their names to agent IDs and retain role, summary, execution and instance instructions. Tasks retain contracts, dependencies, checkpoint kind/mode and archive configuration. Loops retain entry/gate IDs, body IDs derived from the current graph, reviewer, mode, return policy, maximum rounds and timeout.

ZIP generation runs locally in the browser with UTF-8 ZIP STORE entries; it has no network request or added package dependency. The exporter constructs an allowlisted configuration instead of serializing live team state. No session IDs, outputs, review decisions, round histories, runtime state, model routing, Gallery permissions or credentials are copied. User-authored sensitive text inside task/member instructions is still included; inspect it before sharing. Original workflow state is unchanged.

## 执行语义与限制

- **非循环**：按依赖顺序串行执行，包括原本可并行的分支。等待成员完成才继续；失败阻塞下游。
- **循环**：先完成外部依赖；循环内执行完成后审核。`pass` 放行，`revise` 携反馈重跑受影响任务及其循环内下游，`blocked` 暂停。固定回入口的循环重跑整个循环体。
- **次数与超时**：最大轮数包含首轮，达到上限停止。超时依赖 AI 记录时间并检查，没有后台强制计时器；人工等待不自动判为失败。
- **验收**：人工节点等待明确回复，AI 节点交给对应审核角色；验收退回生成新的返工路径，门控退回才重复循环。
- **归档**：按配置生成交付文件清单和可用证据，不等同于 TeamFlow 的不可变成果归档服务。
- **重新运行**：全部导出的节点从头执行，包括画布保留的历史/返工节点。已有历史路径需先检查 `workflow.json`，删除不需要的节点并同步依赖。运行记录不用于自动恢复；不要覆盖已有 `progress.md`，应由用户明确选择新运行或人工检查后继续。
- **环境**：模型、工具、DSH Gallery 资源不迁移。需要 DSH 专属工具的任务必须在 OpenCode 配置可用替代，不能宣称导出后原样可执行。

Both loop and ordinary execution are prompt-driven. This package does not provide the scheduling, enforcement, audit durability or recovery guarantees of TeamFlow's runtime.

## Validation

`node --test scripts/opencode-export.test.mjs` covers DAG order and contracts, both review modes and return policies, fresh-state isolation, malformed graphs, unsafe names/interpolation, ZIP round-trip through an independent reader, attachment lifecycle, and localized export controls. Existing workflow, loop, template and locale regressions are also run for this change. These checks validate generation and UI contracts, not an actual model completing a workflow inside OpenCode.

Format references checked 2026-11-15: [OpenCode Commands](https://opencode.ai/docs/commands), [OpenCode Agents](https://opencode.ai/docs/agents).
