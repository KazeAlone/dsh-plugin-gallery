# Workflow 门控与循环（0.27.0）

画布保存 TeamFlow main 0.2.12 的原生模板定义，不执行 Workflow。保存后可从资源详情「注册到 TeamFlow」，再由 TeamFlow 应用和执行。

## 成员与节点

- **Agent 成员**：在左侧成员栏从 Gallery 选择资源，配置成员名称、职责、指令及 Gallery Skill/MCP 权限。成员不作为画布节点，也不绘制负责人连线；任务和门控显示可点击的负责人标签。点击成员或负责人即可打开配置，并高亮其执行或审核的节点。
- **任务**：填写通用要求、交付物、验收标准，并选择负责 Agent。
- **门控**：判断是否通过。右侧输出连接 PASS 后续任务，底部 REJECT 输出拖回上游执行任务的输入点。可选择人工或 AI 审核。
- **验收**：明确的人/AI 审核步骤，单独保留审核方式，不充当循环门控。
- **归档**：系统自动整理成果，不分配 Agent。可选择复制文件，填写每行一个的路径；留空使用上游交付物和变更文件范围。真正的文件读取、复制和策略检查由 TeamFlow 执行。

顶部工具栏和空白处右键菜单均可添加成员或节点。成员可在配置栏删除，也可在选中成员后按 Delete；在输入框编辑时 Delete 只编辑文字。手机端成员栏显示为可横向滚动的紧凑列表。保留整体拖动、左键框选多节点、右键平移、鼠标中心缩放、全屏及 Delete 删除操作。右键单击连线可删除正向依赖或返回线。

## 建立循环

1. 添加执行 Agent、任务和门控，先连接正向路径，例如「编写 → 自测 → 门控」。
2. 为环内每个任务选择具体的 Agent；空闲成员领取和 Captain 不能作为环内固定负责人。
3. 从门控底部 REJECT 点拖到「编写」左侧输入点，也可在门控侧栏选择 REJECT 返回入口。
4. 在侧栏配置审核方式。AI 审核需选独立成员，不可选择环内任务执行者。
5. 设置轮次上限（包含首次，1–20）和每轮执行超时（1–1440 分钟）。人工审核等待期间不由执行超时自动推进。
6. 选择是否每次从入口重跑；取消后，执行时由 TeamFlow 审核决定具体返工任务及其下游。
7. 从门控右侧 PASS 点连接后续节点，或在侧栏勾选后续节点。通常为「归档 → 最终验收」。没有 PASS 目标表示通过后结束此路径。

返工通过独立的 `loops` 配置保存，不写入普通 `dependencies`。普通依赖仍必须无环；不能用普通输出点反向连线来代替 REJECT。BLOCKED 是 TeamFlow 的暂停决定，不新增普通任务依赖。

支持多个独立循环，不支持嵌套或共享节点。循环内不能放验收、门控或归档节点，所有对外输出必须先经过门控。Gallery 支持先保存草稿，未设置负责人或独立审核人不阻止保存模板；执行前由 TeamFlow 检查。循环入口未连好时可保存为 Gallery 草稿，注册前需连接到门控上游。普通依赖成环、重复/不存在节点、分支逃逸和非法轮次仍会阻止保存。

## 保存字段

`workflow.json` 保留任务原有字段，并支持：

- `checkpointKind: "gate" | "acceptance"`
- `reviewMode: "human" | "ai"`
- `kind: "archive"` 及 `archive: {copyFiles, paths}`
- 顶层 `loops: [{gateId, entryId, mode, reviewer?, maxRounds, timeoutMinutes, rejectToEntry?}]`

画布内部 Agent ID 与 TeamFlow 成员名称分开：保存时将负责人、审核人转换为成员名称，重新编辑时还原到同一个 Agent 卡片。修改成员名称不会使审核人引用断开。

自由画布坐标继续放在 `metadata.workflowCanvas.taskPositions`，注册时转换到 TeamFlow 的 `positions`。不会把运行时轮次、状态、执行结果或会话信息写入可复用模板。

旧版 Workflow 可以继续编辑；没有循环的新字段保持可选。升级后需让负责编辑的各个 Gallery 客户端都使用 0.27.0 或以上，避免旧客户端重新保存时丢弃新字段。使用中心存储时也应更新并重建中心服务，沿用原有数据库与身份配置。

## 验证

普通回归测试执行 `npm test`。若工作区有 TeamFlow main 源码，可额外指定：

```bash
TEAMFLOW_SOURCE=/path/to/dsh-teamflow npm test
```

会调用其实际 `lib/templates.js` 解析器，校验 Gallery 输出与 TeamFlow 内置模板往返结果。Gallery 不依赖 TeamFlow 包才能打开和编辑画布。

0.27.1 调整仅影响编辑器展示。旧资源的成员 ID、配置与旧画布坐标继续保留，成员坐标不再参与缩放和框选；任务坐标和原生模板结构保持兼容。


## REJECT 分支与草稿（0.31.0）

与 TeamFlow 0.2.13 的模板格式对齐，保留 `loops[].rejectTaskIds`、`rejectDag` 和 `rejectToEntry`。新建分支按连线执行（`rejectDag: true`）；旧模板未设置该字段时继续保留原来的列表顺序，不会在重新保存时悄悄变成并行执行。

在门控侧栏点击「配置 REJECT 分支」，选择循环入口并勾选只在退回后运行的普通任务，也可以从门控底部 REJECT 点拖到任务输入点。拖到上游任务表示选择循环入口；拖到首轮路径外的普通任务表示添加退回分支。分支内使用普通圆点连线构成 DAG；从分支末端回到入口是隐式返工关系，不写入首轮任务依赖。分支任务使用虚线边框标识，只有 REJECT 后才由 TeamFlow 执行。

可先设置分支、后补循环入口及正向连线。关闭窗口前点击「保存 Workflow」保存到 Gallery；未接好的配置写入 `workflow.json`，`metadata.workflowCanvas.draft` 标记未完成状态。空的通用要求同样可以先保存；注册到 TeamFlow 时需补全通用要求，并满足其模板图结构。不要把 Gallery 的未连接草稿直接当作可运行的 TeamFlow 模板。

右键删除分支内一条依赖线不会删除整个循环；删除返工末端到入口的隐式线只清空入口，保留其余配置供继续编辑。删除一个分支节点会移除其成员关系和相关连线；移除入口节点保留其余循环配置为草稿。「删除 REJECT 返回线」按钮清除该门控的整套 REJECT 配置。

成员的 summary、role、executionPrompt 和任务的 general.requirements、deliverables、acceptance 均允许最多 256000 字符，前端、模板校验和模型提取结果校验一致。名称等其他限制不变；整个资源包仍受 5 MiB 限制。AI 提取请求仍保留独立的输入和输出预算。

若使用中心存储，更新 Gallery 后也需重新运行 `sudo bash scripts/install-center.sh` 更新 Center 的草稿校验；数据库表无需迁移，原数据保留。TeamFlow 无需修改，建议使用 0.2.13。
