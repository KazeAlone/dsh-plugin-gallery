# 会话资源管理接口（0.33.0）

这些是 DSH 模型工具，供用户在会话中创建、读取和维护 Gallery 资源。需要启用 tools，工具白名单/审批策略仍由 DSH 管理；更新插件后重启宿主。与仅负责搜索、加载、调用的原有工具并存，页面 RPC 和中心 HTTP 协议保持兼容。

## 工具和参数

| 工具 | 参数 | 返回 |
| --- | --- | --- |
| `gallery_resource_schema` | `type` | 当前 `libraryId`、可编辑 `resource` 示例、文件限制与操作说明 |
| `gallery_resource_list` | `libraryId`, `type?`, `q?`, `limit?`, `offset?`, `sort?` | `{items,total,limit,offset,libraryId}`，仅摘要 |
| `gallery_resource_get` | `id`, `libraryId` | `{id,libraryId,revision,digest,canEdit,canDelete,resource,...}`，不含已存 MCP 密钥 |
| `gallery_resource_validate` | `resource`, `libraryId`, `id?`, `expectedRevision?` | `{valid:true,resource,warnings,libraryId}` 或 `{valid:false,issues,libraryId}` |
| `gallery_resource_create` | `resource`, `libraryId` | `{saved:true,id,type,name,libraryId,revision,digest,warnings}` |
| `gallery_resource_update` | `id`, `resource`, `libraryId`, `expectedRevision` | 与创建相同，revision 增加 |
| `gallery_resource_delete` | `id`, `libraryId`, `expectedRevision` | `{deleted:true,id,libraryId,warnings}` |

`type` 为 `skill`、`agent`、`mcp`、`workflow`。`libraryId` 为 `local` 或 `center`，管理操作必须明确指定；使用 schema 返回的当前库或用户明确指定的库。指定库未配置时直接报错，不回退另一库、不改变当前选择。搜索每页默认 24 条，最多 100 条；`sort` 为 `updated` 或 `usage`。

资源对象结构：

```json
{
  "type": "skill",
  "name": "审阅助手",
  "description": "用于审阅文档",
  "tags": ["审阅"],
  "files": [
    {
      "path": "SKILL.md",
      "encoding": "utf8",
      "content": "---\nname: review-helper\ndescription: 用于审阅文档\n---\n\n## 步骤\n核对事实、列出证据与待确认项。\n"
    }
  ],
  "metadata": {},
  "references": []
}
```

直接传 JSON 对象，不要将整个 resource 编成字符串。`files[].content` 本身是字符串；`workflow.json` 的内容应为 JSON 文本。不要在 resource 中传 id、revision、creator 或 canEdit 等只读字段。工具读取结果的 `resource` 已去掉这些只读字段及文件 bytes，可作为后续编辑的起点。

## 创建与编辑流程

新建：`schema(type)` → 修改示例 → `validate(resource, libraryId)` → `create(resource, libraryId)`。校验不写文件、不执行附件、不连接 MCP；不预留名称，也不保证后续网络、磁盘或并发条件，因此写入时会重新校验。

更新：`list` 定位 → `get` 读取完整资源和 revision → 修改返回的 `resource` → `validate`（同时提供 id、expectedRevision）→ `update`。这是完整替换可编辑内容，不是局部 patch；保留未修改的文件、标签、metadata 和 references。遇到冲突重新读取并核对，不猜 revision、不自动覆盖。

删除：仅在用户明确要求时使用，先读取并核对资源、目标库和 revision。删除不可恢复，不删除已生成的 Skill 运行副本或原导入文件。

保存只有在存储层成功后返回 `saved:true`。若保存后的运行时刷新失败，仍返回保存结果并附警告，避免误以为没有保存而重试。网络中断、请求超时或结果未知时先查询核对，不盲目重放创建；当前创建接口不提供持久化幂等键。

## 四类资源的格式处理

- **Skill**：必须有合法 `SKILL.md`、调用标识、描述与执行指引。支持 `references/`、`scripts/`、`assets/`，自动同步附件清单。保留 YAML 扩展字段并校验调用开关。保存不执行脚本。
- **Agent**：必须有 `AGENT.md`，从 Markdown 解析并生成向导所用 metadata，保证后续编辑/调用可用；支持 `references/`、`assets/`、可选 `config.json`。模型覆盖配置被忽略，沿用宿主模型；非法或将被忽略的附件不静默丢弃。
- **MCP**：以 `metadata.mcp` 的 `serverName`、`transport`、`command/args/cwd` 或 `url` 为连接配置来源，生成一致的 `mcp.json`。同库服务器名称不能重复。保存会刷新当前库 MCP 连接，stdio 可能启动进程；中心 stdio 仍受本机许可限制。
- **Workflow**：使用原生 `workflow.json`，保留成员、任务、门控、循环、归档和画布元数据。允许保存未完成的草稿，返回警告并标记 `workflowCanvas.draft`；普通依赖成环、非法引用等无效结构拒绝保存。保存不等于注册 TeamFlow，也不启动实例。

每个资源仍限 100 个文件、文件内容总计 5 MiB。Workflow 长文本字段上限沿用 256000 字符，其余限制与既有校验一致。

## MCP 认证

认证名称放在 `metadata.mcp.credentialKeys`；认证值只放在额外的 **`resource.mcpCredentials` 写入字段**：

```json
{
  "metadata": {
    "mcp": {
      "serverName": "papers",
      "transport": "streamable-http",
      "url": "https://example.invalid/mcp",
      "authType": "bearer",
      "credentialKeys": ["Authorization"]
    }
  },
  "mcpCredentials": {"Authorization": "Bearer <实际令牌>"}
}
```

这是 resource 的认证相关片段，仍需补齐其他资源字段。工具接口中的 Authorization 填完整请求头值，包含 `Bearer ` 前缀；stdio 的 credentialKeys 对应进程变量名。不要把认证值写入 mcp.json、普通 metadata 或描述，也不使用宿主环境变量引用。

校验结果省略 mcpCredentials，真正创建时需从原输入带上该字段。更新时省略保留原认证值，填新值替换；移除 credentialKeys 会移除相应旧认证。列表、读取、校验和保存结果都不返回认证值。通过聊天传入的认证可能保留在宿主会话记录中；希望避免进入聊天记录时仍使用 MCP 页面填写。

## 权限与运行时

普通会话使用当前 DSH 的存储配置和中心身份。中心库仍由服务端检查创建者，伪造 creator 或用户名不会取得其他资源权限；更新和删除同时检查 revision。内部库沿用本机权限。

通过 `setMemberAccess` 配置的 TeamFlow 成员仅有资源使用权限，七个管理工具在其工具列表中隐藏，直接调用也会拒绝；原有 Skill/MCP 搜索和调用开关保持原样。这两个使用开关不授予资源管理权限，管理入口也不通过模拟 owner RPC 绕过认证。

保存当前库资源后使 Skill 目录失效；MCP 还会刷新连接。显式操作另一已配置库不会切换当前库，也不会将另一库的 MCP 启动到当前运行库。

验证使用真实 DSH ToolRuntime 进行四类资源读写闭环；配置 `GALLERY_TEST_DATABASE_URL` 后另验证真实 PostgreSQL 的跨用户权限、显式库目标、密钥隐藏和更新保留。此测试不等于所有模型和预设的自然语言端到端验证。


Workflow 的 `gallery_resource_schema` 返回当前容量：成员 64、任务 512、依赖 511、循环 256。`workflow.json` 中普通任务可设置 `dynamicRoute: {mode:"agent"|"human", outcomes:[{id,label,condition,targets:[]},...]}`（2–12 个唯一状态，每状态最多 100 个目标），每条后续连线至少属于一个状态；空目标表示结束路径。`routeJoin: string[]` 只能引用当前节点非动态路由的上游依赖。动态路由路径不能进入门控循环；循环的额外 REJECT 任务仍最多 31 个。创建和更新会保留这些配置，去除运行决策和历史。
