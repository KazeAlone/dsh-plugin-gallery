# Gallery 按需接入

TeamFlow 0.2.13 与 Gallery 0.30.0+ 使用现有两个成员开关，自动为成员安装 `resourceMode: 'discovery'`。普通聊天不启用此成员模式，仍可通过 `/gallery` 指定 Skill、直接调用已注册 MCP。

## 用户操作

在 Workflow 成员设置中打开「允许使用 Gallery Skill」或「允许使用 Gallery MCP」。用户不需要选择额外模式，也不必手动搜索。成员收到任务后可通过 Gallery 的固定工具入口自行搜索，选择相关资源后加载或调用；优先使用相关知识库的提示由 Gallery 注入。模型的实际选择仍取决于任务与资源描述，并非强制每个任务调用。

- Skill 搜索默认返回 5 条摘要，最多每页 20 条，可翻页或更换关键词。只有选中的 Skill 才加载正文；附件只列路径，不自动展开或执行。
- MCP 搜索默认返回 5 个服务摘要，再查询某个服务的少量工具与完整参数 schema，并通过代理调用所选工具。
- 不向该成员预先注入完整 Skill 目录、全部 Gallery MCP 工具定义或全部服务初始化指引。
- 两个开关独立；关闭后相关搜索、加载、查询和调用被禁止。中心 stdio 还需 DSH 本机执行许可。

## 版本和恢复

启用资源访问时会检查 Gallery `resourceCapabilities()`；未安装、不支持按需模式、缺少所需入口时，在成员首次模型请求前提示安装/升级 Gallery 0.30.0+，不悄悄退回全量模式。两个开关都关闭时不要求安装 Gallery；旧记录完全没有开关时保留原行为。

新建和冷恢复共用 `installMemberSelectionRuntime` 的成员安装边界。运行时模式不写入 Workflow 模板，不改变两个开关的数据结构；每次激活按当前插件能力重新安装。重复事件不重复安装，成员退出及插件重载释放权限和提示词。编辑成员后的现有退休/重建流程会安装最新开关；更新插件后应重启 DSH，使已有成员重新激活。

## 工具白名单

开启开关不会修改管理员的工具策略。使用 allow 白名单时需明确允许对应入口：

| 开关 | 需要的入口 |
| --- | --- |
| Gallery Skill | `gallery_skill_search`、`gallery_skill_load` |
| Gallery MCP | `gallery_mcp_search`、`gallery_mcp_tools`、`gallery_mcp_call` |

入口被 allow/deny 挡住时，成员初始化错误会列出工具名。MCP 代理仍执行原生 DSH 工具调用管线，原始 `mcp__<server>__<tool>` 名称也必须符合宿主工具策略。仅允许代理入口不会自动授予全部 MCP 权限；细粒度白名单还需列出允许的原始 MCP 工具。不要为排障放开所有工具。

## 开发验证

```bash
pnpm typecheck
pnpm build
pnpm verify:gallery
GALLERY_SOURCE=/absolute/path/dsh-plugin-gallery pnpm verify:gallery
```

默认测试验证四种开关组合、版本能力、白名单、新成员、两种持久化恢复路径和失败拦截；没有设置 `GALLERY_SOURCE` 时仅跳过跨仓库集成测试。

真实集成测试用 Gallery 源码及其已安装的 DSH rc5 服务依赖，统一两插件的宿主作用域身份，连接本机认证 HTTP MCP，验证 1000 个 Skill 的分页、附件不展开、实际 MCP 调用、计数、原工具权限及普通聊天兼容。测试使用临时数据目录、测试认证和随机端口，不调用外部模型，也不读取真实用户资源。另需使用真实模型任务检查模型选择搜索关键词与资源的效果。
