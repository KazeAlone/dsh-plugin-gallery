# Gallery

运行在 DSH 内的本地资源库，用于管理 **Skill、Agent 描述、MCP 配置和 Workflow 模板**。Workflow 使用 TeamFlow 的原生模板结构，可从资源详情安装到 TeamFlow 个人模板库。

打开「Gallery」即可使用，**无需填写姓名、接入码或 Gallery 身份凭证**。沿用 DSH 自身的宿主访问认证，不增加插件登录流程。

## 安装

要求 Node.js >=24.9、DSH 0.2.1-rc.5。

```bash
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

更新后重启 DSH 并刷新浏览器。仓库包含构建好的客户端。

## 本地存储

无需启动 `gallery.mjs serve`，无需配置服务地址，也不连接 SQLite 或统一数据库。默认数据文件：

```text
$DSH_HOME/gallery/resources.json
```

未设置 `DSH_HOME` 时使用 `~/.dsh/gallery/resources.json`。文件由 DSH 宿主读写，重启后保留；不是浏览器 localStorage。写入使用临时文件加原子替换，revision 防止多窗口过期覆盖，写锁防止并行写入丢失数据。

旧版的 SQLite 数据、`access.json`、`serverUrl` 和 `DSH_GALLERY_URL` 不再用于默认 Gallery，不会被修改或自动导入。需要保留旧资源时可从旧版导出 Gallery JSON 资源包，再在当前界面导入。旧共享服务可以停止；当前本地数据不会自动同步到旧服务。

## 功能

- 四类资源的创建、编辑、名称/描述/标签搜索、类型筛选和分页。
- 文件及文件夹上传、文本文件编辑、二进制附件保存。
- Gallery JSON 资源包导入导出、资源引用和内容摘要。
- 本地资源均可编辑，保存后即可使用，无成员、作者权限或接入流程。
- 每个资源最多 100 个文件，总计 5 MiB；资源类型创建后固定。
- `metadata` 保存扩展配置，`references` 保存 `{id,digest?}` 引用。

Gallery 保存和读取资源。有效的 Agent 可通过会话工具 `gallery_agent_list`、`gallery_agent_run` 交给 DSH `spawn` 子 Agent 执行；需要启用 DSH tools、subagents 和 spawn 提供方。保存的 MCP 服务通过 DSH 官方 MCP 客户端注册为 `mcp__<serverName>__<tool>` 会话工具，所引用的环境变量必须在宿主启动时可用。Workflow 可以安装到 TeamFlow 模板库，再从 TeamFlow 模板库应用到会话；Gallery 本身不执行 Workflow。默认模板目录为 `~/.dsh-teamflow/templates`，如 TeamFlow 配置了其他 `templateDirectory`，请给 Gallery 进程设置 `DSH_TEAMFLOW_TEMPLATE_DIR` 为相同路径。当前不提供发布版本、历史回滚和远程同步。

Gallery 顶部的主题按钮提供「跟随系统」「墨绿黄铜」「暖纸」三种外观；选择只保存在当前浏览器，不改变资源数据或功能。

## 其他插件接入

通过同宿主 `ctx.gallery` 使用 `listResources(query)`、`getResource(id)`、`resolveReference({id,digest?})` 和 `getSnapshot({id,digest?})`。引用包含 digest 时，资源变化会返回冲突；执行方可以保存快照保证本次运行内容一致。

宿主通过独立的本地文件存储适配器访问资源，后续统一数据库可在此边界扩展。原共享 HTTP/SQLite 实现及测试暂保留为后续接入参考，不属于默认运行链路。详见 [接口说明](docs/integration.md) 和 [存储说明](docs/storage.md)。

## 开发

```bash
npm ci --legacy-peer-deps
npm run build
npm run check
npm test
npm pack
```

开发 Gallery UI 只需要启动正常的 DSH 宿主，不需要单独启动资源库服务或发放接入码。

## 资源库存储设置

首次打开可直接选择默认的「DSH 内部存储」。右上角「存储设置」可检查存储。内部存储固定使用一个默认资源库，不再提供新建本地资源库入口。关闭首次选择会保留并确认默认资源库，无需身份或接入码。

当前仅内部存储可用，固定读取 `gallery/resources.json`。中心服务作为后续适配方向展示，暂不可配置或启用。存储设置不再显示「当前资源库」，也不提供创建或切换资源库功能。

旧多库配置不会再决定当前数据来源，额外库不再读取；确认存储配置后仅保存默认库配置。资源引用中的 libraryId 当前只能为 local，旧额外库引用不再解析。

### 在会话中选择 Gallery Skill

更新插件后，在 DSH Web 会话输入框输入 `/gallery`，从建议列表选择 Skill；也可输入 `/gallery/关键词` 搜索。选中后自动插入该资源的调用标记，补充任务并发送即可。支持键盘上下键与 Enter 选择，输入建议的 Escape 可取消。

使用支持原生 Skill 加载的预设，例如 **standard**。Gallery 会注册 Skill 提供方，并在加载时准备附属文件的运行目录；不需要手动复制到 `.dsh/skills`。无效或禁止用户调用的 Skill 不显示。该功能使用 DSH 的原生输入建议与 Skill 加载机制，尚未进行完整模型会话端到端验证。

打开列表、选择、预览和加载不会增加累计调用次数；执行端确认使用后仍需调用统计接口，见 [集成说明](docs/integration.md)。


Gallery Skill 的 `SKILL.md` 和附件一起写入运行目录。加载 Skill 时会列出 `references/`、`scripts/`、`assets/` 中的文件路径；需要读取具体附件的任务，应使用支持文件读取工具的 DSH 会话。


MCP 分类提供专用四步向导。可保存本地 stdio 或远程 Streamable HTTP 连接配置，按需测试并查看工具列表；保存不会自动启用该服务，仍需接入 DSH MCP 客户端配置。
