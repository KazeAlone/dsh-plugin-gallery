# Gallery 本地集成契约

当前默认使用 DSH 宿主内的 `LocalGalleryStore` 文件适配器，不连接共享 HTTP 服务或数据库。

其他插件声明 `inject = ['gallery']`，然后调用：

- `ctx.gallery.listResources({type?,q?,limit?,offset?,sort?})`：返回 `{items,total,limit,offset}`，limit 为 1–100。
- `ctx.gallery.getResource(id)`：返回资源内容、`id`、`digest`、`revision`、时间与文件数。
- `ctx.gallery.resolveReference({id,digest?})`：获取当前资源，摘要变化时返回 `DIGEST_MISMATCH`。
- `ctx.gallery.getSnapshot({id,digest?})`：返回独立的 `{id,digest,resource}` 内容快照。

资源包含 `type,name,description,tags,files,metadata,references`。文件使用 utf8 或 base64 编码。所有本地资源 `canEdit: true`，无需 Gallery 身份；浏览器 RPC 仍要求 DSH 宿主 owner 身份。RPC 仅暴露状态、列表、获取、新建和更新，不暴露身份接入接口。

`revision` 用于防止多窗口覆盖，不是历史版本。Gallery 不执行资源内容；消费方自行管理转换与执行生命周期。

原 `GalleryClient` 及 HTTP 服务模块暂时保留供后续统一存储扩展，不用于默认宿主运行链路。

## 存储适配边界

宿主经 `StorageManager` 将资源操作委托给具体适配器。当前仅注册内部文件适配器；中心服务尚不可启用。内部存储固定使用一个默认库，不再提供新增连接接口。不再读取或切换旧版额外资源库；activeLibraryId 固定为 local。

资源详情和列表项增加 `libraryId`。`resolveReference` 与 `getSnapshot` 接受 `{libraryId?,id,digest?}`，指定库时不会退回当前库；`getResource(id,{libraryId})` 也可读取指定库。未指定库的旧调用仍使用当前库。metadata 中的业务引用格式由消费插件解释；标准 references 数组现在保留 libraryId。

浏览器通过 owner RPC 调用：

- `uiStorageSettings()`：读取连接列表、当前库、后端可用性和能力。
- `uiTestStorage(payload)`：检查指定本地库文件格式；这是读取检查，不保证后续写入权限或磁盘空间。
- `uiConfigureStorage()`：确认使用默认内部存储，并保存单库配置。

当前支持读取、新建、编辑，不支持历史、共享和自动迁移。后续后端必须遵循同一资源数据结构及 revision 冲突语义；中心服务凭据不得返回浏览器或写入普通连接配置。

## Skill 实际使用计数

宿主消费插件在**已确认将 Skill 用于当前任务的一次实际执行**时调用：

```js
await ctx.gallery.recordSkillUse({
  id: skillResourceId,
  libraryId: 'local', // 可省略
  usageId: `${consumerId}:${executionId}:${skillInvocationId}`,
});
// => { id, libraryId, usageCount }
```

usageId 是每次实际使用的稳定唯一 ID（最多 200 字符），不能在重试时重新生成。不同消费插件需要自己的前缀。同一个 Skill 同一 usageId 永久去重；一次任务内实际使用多次必须提供不同 invocation ID。执行结果成功与否不改变“已使用”的计数。预加载、读取、查看、下载、编辑均不调用此方法；命中缓存后实际使用仍应上报。失败时使用同一 ID 重试，不能用新的 ID 补报。

接口仅为宿主服务方法，不注册浏览器 RPC。列表与详情返回 usageCount（旧资源默认 0），内部去重记录不返回客户端。统计与内容分离：不改变 digest、revision、updatedAt；编辑保留计数，导出文件包不带统计，新建或重新导入从 0 开始。计数与去重 ID 摘要使用现有 resources.json 原子写入和锁存储，不需要数据库；去重记录随实际使用数量增长。

DSH 会话自动统计实际注入的 Gallery Skill（同一会话轮次内同一个 Skill 只计一次）、成功的原生 Skill 工具加载、成功启动的 Gallery Agent，以及成功返回的 Gallery MCP 工具调用。MCP 按所属服务汇总。其他消费插件自行执行资源时可用上述接口上报 Skill 使用。


## /gallery 会话入口（0.6.0）

浏览器依赖原生 ui-input-trigger，注册 Gallery 斜杠建议来源。输入 `/gallery` 展示列表，或从 `/` 菜单选择 Gallery 进入 `/gallery/`；继续输入关键词过滤名称和描述。选中项插入稳定的 `/gskill-<资源 ID 摘要>`，用户补充任务后发送，原生 dsh-tool-skill 注入指引。不会自动发送、清空整份草稿或在选择时计数。此入口是 Web 会话输入建议，不是终端命令。

Gallery 宿主在 skills 服务可用时注册 `gallery` provider。uiSkillCatalog 只向 owner 返回有效且 userInvocable 的本地 Skill；新建与更新会使注册目录失效。支持标准 user-invocable 和 disable-model-invocation 布尔字段。不合格或没有 SKILL.md 的资源不出现在目录。稳定别名避免同名 Skill 互相覆盖，重命名也保持调用身份。

实际加载时将完整文件集合物化到 `$DSH_HOME/gallery/skill-runtime/<资源摘要>/<内容摘要>/`，并返回原生 directory resourceBase。旧副本保留，以免正在进行的任务引用失效；脚本只写入，不自动执行，执行方式与权限仍由 DSH 决定。Gallery 编辑仍以 resources.json 为准，不同步运行副本上的修改。

已验证真实 Cordis 与 DSH 0.2.1-rc.5 SkillRegistry 的注册、目录更新、加载和附件路径。需要启用原生技能加载工具的预设（如 standard）；minimal 不提供此能力。已在实际 DSH 会话中验证原生调用。仅查询提供方或读取资源不会增加计数。


## 创建者与删除（0.6.1）

StorageManager 在创建时写入 `creator: {username}`，取自 storage.json 的 username，缺省使用宿主 OS 用户名。该名字是单用户 Gallery 的显示署名，不是多用户登录身份。资源输入不能覆盖署名，编辑保留原署名；旧资源不补造创建者。`uiSetUsername(payload)` 仅允许 owner 修改后续署名。

`uiDelete(id, JSON.stringify({expectedRevision}))` 仅允许 owner 调用，校验当前修订号后原子删除资源及累计调用去重数据，并使 Skill 目录失效。已物化的只读用途运行副本保留，以免破坏进行中的任务；删除不是运行副本擦除，也不支持恢复。

列表 sort 支持 updated（默认）或 usage（累计调用降序）；同分按名称、ID 稳定排序，搜索包含创建者用户名。四类榜单共用 usageCount，未接入执行上报的资源显示 0；当前 recordSkillUse 仍仅支持 Skill。


### 附件加载（0.7.2）

原生 Skill 加载结果现在在正文后列出附件相对路径和物化后的绝对路径，并保留 directory resourceBase。`skill` 工具只负责加载指引，附件由具备文件读取能力的 DSH 会话在需要时读取；加载工具本身不直接展开或执行附件。二进制附件可在目录中找到，但使用方式取决于会话可用工具。


## MCP 配置向导（0.9.0）

Gallery MCP 资源保存 `mcp.json` 和 metadata.mcp，字段 transport 仅允许 stdio、streamable-http。stdio 配置为 serverName、command、args、cwd、envRefs；HTTP 配置为 serverName、url、envRefs。envRefs 将服务端字段名映射到 DSH 宿主环境变量名称，检查连接时从进程环境读取值，资源文件不含值。HTTP Authorization 需要环境变量本身提供完整请求头值（如 `Bearer ...`）。

`uiCheckMcp(payload)` 只允许 owner 调用，按需启动或连接服务，列出工具名称与描述后关闭连接；超时 12 秒。保存不要求连接成功；同一资源库内服务器名称不能重复。Gallery 通过官方 `dsh-mcp-client` 插件实例启用资源库中的 MCP 服务，并随资源更新或删除刷新。连接失败会记入宿主日志；需要 DSH 的 tools 和 MCP 插件依赖服务。工具在会话中以 `mcp__<serverName>__<tool>` 出现。

## Agent 会话调用（0.11.0）

### Workflow 画布草稿（0.18.0）

画布沿用 `workflow.json` 的任务、成员与任务位置格式；`metadata.workflowCanvas` 记录画布版本、taskPositions（支持负坐标）、Agent 节点位置、Gallery Agent ID、摘要，以及 Skill/MCP 的 ID、名称和摘要引用。成员指令快照保存在 `workflow.json`，不会修改原始 Agent。技能与 MCP 引用尚无执行适配，画布草稿的 TeamFlow 安装入口暂时关闭，宿主也拒绝通过安装 RPC 导出该草稿。旧的非画布模板仍保留安装行为。

客户端分页读取三类资源，选择 Agent 时获取完整资源快照。任务依赖禁止循环，删除 Agent 清空任务负责人，删除任务清除其他节点对它的依赖。浏览器预览已验证创建、拖动、资源勾选、循环拒绝、保存重开及移动端布局；尚未对接 TeamFlow 执行。

在启用 tools 的 DSH 预设中，Gallery 注册只读的 `gallery_agent_list`；启用 subagents 后另注册 `gallery_agent_run`，并要求 spawn 提供方可用。后者把 `AGENT.md` 指令、本次任务和按需读取的附件目录交给 `spawn` 子 Agent，完成通知返回当前会话。资源内容作为子 Agent 的任务输入，尚不是独立的 DSH Agent preset；其 `config.json` 模型配置当前不作为子 Agent 模型覆盖。

0.19.0 画布通过视图变换自由平移，Task 位置保存到 workflowCanvas.taskPositions；workflow.json 的 positions 暂留空，避免将画布负坐标误交给尚未适配的 TeamFlow。

## Workflow 字段与提取（0.20.0）

核对 yogurtss/dsh-teamflow 的 src/templates.ts、template-brief.ts、workflow-native.ts 和 builtin-templates.ts 后，成员模板字段对应 name、summary、role、executionPrompt。specificPrompt 属于运行实例，单独保存在画布 Agent 元数据中；Skill/MCP 也保存在节点元数据中，尚无执行适配。模板 members.name 使用可编辑的成员名称，保存时将画布内部节点 ID 的负责人引用转换为该名称；重新打开时反向还原，避免改名断开任务负责人。

任务与人工节点使用 subject、assignee、dependencies、checkpoint、general.requirements/deliverables/acceptance；人工节点 checkpoint=true 且 assignee 为空。实例的 description、人工验收历史及决定不混入可复用模板。

uiWorkflowModels 仅向 owner 列出当前已加载且配置了模型的 DSH 会话。uiExtractWorkflowAgent 复用指定会话的 agent.ctx.llm 与 options.provider/model，发送单个 Agent 的名称、描述及 AGENT.md，不读取会话历史、不配置独立密钥、不传工具。调用限时90秒，结果经字段类型、长度和名称格式校验后返回前端，供用户编辑。未进行真实模型网络端到端验证，已通过 mock stream 的路由与解析测试和浏览器交互测试。

0.20.2：画布仅编辑模板层。模型提取返回 name/summary/role/executionPrompt 四个字段，丢弃返回中的实例字段；UI 不再填写 specificPrompt。已有画布 Agent 的 specificPrompt 元数据会原样保留，但不进入 workflow.json 的模板成员，也不会被提取操作覆盖。任务与人工节点明确使用通用字段文案；具体 description 与验收状态仍在实例阶段生成。
