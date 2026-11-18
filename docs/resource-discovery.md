# Skill / MCP 按需访问（0.30.0）

此版本提供 Gallery 侧能力，不修改 TeamFlow。界面仍为 `gallerySkill` 和 `galleryMcp` 两个开关。消费插件可检测 `ctx.gallery.resourceCapabilities()`，然后为真实子 Agent 启用按需模式：

```js
const stopGalleryAccess = ctx.gallery.setMemberAccess(childAgent, {
  gallerySkill: member.gallerySkill === true,
  galleryMcp: member.galleryMcp === true,
  resourceMode: "discovery",
});
// 在子 Agent 生命周期结束时调用 stopGalleryAccess()。
```

`resourceMode` 省略或为 `native` 时保留原有接入方式；升级 Gallery 不会擅自改变已有 TeamFlow 会话。TeamFlow 后续需显式启用新模式，并停止自己附加全量 Skill/MCP 列表，才能完整获得上下文节省。

## 模型工具

| 工具                   | 参数                                          | 返回                                       |
| ---------------------- | --------------------------------------------- | ------------------------------------------ |
| `gallery_skill_search` | `q?`, `limit?`, `offset?`                     | 少量 Skill 摘要、总数、分页标记            |
| `gallery_skill_load`   | `id`, `libraryId?`                            | 一个 Skill 的正文、附件路径和 resourceBase |
| `gallery_mcp_search`   | `q?`, `limit?`, `offset?`                     | 少量 MCP 服务摘要，不含工具定义或认证      |
| `gallery_mcp_tools`    | `id`, `libraryId?`, `q?`, `limit?`, `offset?` | 一个 MCP 的部分工具名称、说明与参数 schema |
| `gallery_mcp_call`     | `id`, `libraryId?`, `tool`, `arguments?`      | 原生 MCP 工具的执行结果与原生模型内容      |

`id` 使用搜索结果中的资源 ID，`tool` 使用 `gallery_mcp_tools` 返回的完整 DSH 工具名称。建议同时传搜索结果的 `libraryId`，存储切换后会要求重新搜索。

搜索默认每页 5 条，最多 20 条；工具查询默认 5 条，最多 10 条。`offset` 从 0 开始。`q` 为名称、描述、标签或作者中的简短关键词，工具查询匹配工具名/说明；这是关键词检索，不是向量或 LLM 语义检索。摘要描述最多 400 字符，不包含文件正文、封面、服务地址、启动命令或密钥。工具查询保留完整参数 schema。

Agent 自己搜索和选择，不要求用户手动操作。相关任务可依次执行：搜索“论文” → 找到知识库 ID → 查看该服务工具 → 用完整工具名和参数调用。没有结果时应调整关键词，不要先遍历整个库。

Skill 只在显式加载后返回指引。附件物化到宿主目录并列出路径，不自动读取正文或执行脚本；禁用模型调用、缺少有效指引的 Skill 在加载阶段拒绝。仅搜索或查询不会计数，成功工具加载延续原生 Skill 计数语义。

## 上下文和权限

- 按需模式下，Gallery Skill provider 不向该 Agent 列出全量目录；指引通过 `gallery_skill_load` 获取。
- 模型只需要五个固定入口，不预注入所有原生 MCP 工具 schema。Gallery 的全量成员 MCP 指引和原生 MCP 服务初始化指引也不会注入此模式的成员。
- 两个开关分别约束工具可见性及执行权限。关闭时，搜索、加载、查询、调用都被拒绝；同进程接口同样要求当前 Agent 并检查开关。
- stdio 仍受该 DSH 的“允许中心 stdio MCP 执行本机命令”限制，每次查询/调用重新检查。
- MCP 代理只允许调用所选 Gallery MCP 的原生工具，不能转调其他宿主工具。执行仍通过 DSH 工具注册表，保留同一 Agent、取消信号、根调用 ID、原生工具策略、审批、参数验证、结果投影和调用统计。
- 为嵌套执行短暂恢复该原生工具在当前成员中的 Gallery 可见性，结束后立即恢复隐藏；其他宿主限制不会被移除，原生工具的直接猜名调用也会被拒绝。
- 重复设置同一成员的访问配置会清理旧过滤器和提示词；旧清理函数不会删除新权限。
- 搜索与查看 MCP 工具不增加调用次数；原生 MCP 成功执行后计数一次，不在代理层重复计数。

本版优化模型上下文。宿主仍按原有机制连接、注册和刷新 MCP，尚未改为按需建立网络连接；未使用新模式的普通会话保持原有方式。

## 同进程 API

`ctx.gallery` 还提供 `searchSkills(query, exec)`、`loadSkill(input, exec)`、`searchMcp(query, exec)`、`getMcpTools(input, exec)`、`callMcpTool(input, exec)`。前四个传真实 `{agent, signal?}`；`callMcpTool` 必须传由 DSH 提供的完整工具执行上下文（含 token、callId、signal），不要自行伪造。一般让 Agent 调用上表工具即可。

这些方法不注册为浏览器 RPC，既有 owner UI 接口保持不变。中心存储沿用现有分页 API，不增加数据库表，不需要迁移数据。
