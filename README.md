# Gallery

Workflow 画布原型支持添加和拖动 Agent、任务、人工节点，配置 Gallery Agent 及其 Skill/MCP 引用，连接任务依赖并保存后继续编辑。按住前置节点右侧圆点，拖到后续节点左侧圆点后松开。可从资源详情注册到 TeamFlow 个人模板库。Agent 节点可分别允许使用 Gallery Skill 和 MCP。旧的逐项引用保留在 Gallery 中，支持开关的 TeamFlow 按成员权限提供资源。

内置 `gallery-skill-reference` 参考 Skill，包含完整文件头、执行指引、输入输出示例、三类附件、标签和封面。升级首次启动时添加，可查看、编辑和调用；修改或删除后不会在重启时恢复。

运行在 DSH 内的本地资源库，用于管理 **Skill、Agent 描述、MCP 配置和 Workflow 模板**。Workflow 使用 TeamFlow 的原生模板结构，可从资源详情安装到 TeamFlow 个人模板库。

打开「Gallery」即可使用，**无需填写姓名、接入码或 Gallery 身份凭证**。沿用 DSH 自身的宿主访问认证，不增加插件登录流程。

## 安装

要求 Node.js >=24.9、DSH 0.2.1-rc.3 或 0.2.1-rc.5。

rc.3 与 rc.5 的 Gallery 所用核心接口已完成静态对比；rc.3 的完整运行验证尚未完成。开发依赖仍固定 rc.5，安装时通过 peer 依赖复用宿主对应版本，避免混用运行时。TeamFlow 的宿主兼容范围以该插件自身声明为准。

```bash
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

更新后重启 DSH 并刷新浏览器。仓库包含构建好的客户端。

本地目录链接与安装包的依赖行为不同，详见[安装说明](docs/installation.md)。

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

Gallery 保存和读取资源。有效的 Agent 可通过会话工具 `gallery_agent_list`、`gallery_agent_run` 交给 DSH `spawn` 子 Agent 执行；需要启用 DSH tools、subagents 和 spawn 提供方。保存的 MCP 服务通过 DSH 官方 MCP 客户端注册为 `mcp__<serverName>__<tool>` 会话工具，认证值直接在 MCP 配置页面填写，无需预先设置宿主环境变量。Workflow 可以安装到 TeamFlow 模板库，再从 TeamFlow 模板库应用到会话；Gallery 本身不执行 Workflow。默认模板目录为 `~/.dsh-teamflow/templates`，如 TeamFlow 配置了其他 `templateDirectory`，请给 Gallery 进程设置 `DSH_TEAMFLOW_TEMPLATE_DIR` 为相同路径。当前不提供发布版本、历史回滚和远程同步。

Gallery 顶部的主题按钮可切换「跟随系统」「墨绿黄铜」「暖纸」「漫画印刷」「鎏金星穹」「霓虹玻璃」「次元放映室」「原神 · 冒险手册」和「纸境 · Paper」。纸境提供独立的侧边导航、四类 TOP 3 调用榜、插画资源卡片、标签筛选、排序和右侧详情抽屉；顶部 ◐ 按钮切换浅色与深色。新建和编辑继续使用原有的资源专用向导，存储、调用、导出、删除及 TeamFlow 接口保持一致。鎏金星穹可在页眉暂停动效，并遵循系统的减少动态效果设置。主题选择只保存在当前浏览器。

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

### 在会话中使用 Gallery 资源

- Skill：输入 `/gallery`，选中 Skill 后补充任务并发送。
- Agent：用自然语言指定要委派的任务，例如「请让 Gallery 里的代码审查 Agent 检查这个改动」。会话可查找对应 Agent 并启动子会话，结果会回传。
- MCP：保存服务后，在会话里直接描述需要完成的操作。模型可根据已注册工具的描述选择工具并填写参数。连接检查和工具列表在 MCP 创建向导中查看。

### 在会话中选择 Gallery Skill

更新插件后，在 DSH Web 会话输入框输入 `/gallery`，从建议列表选择 Skill；也可输入 `/gallery/关键词` 搜索。选中后自动插入该资源的调用标记，补充任务并发送即可。支持键盘上下键与 Enter 选择，输入建议的 Escape 可取消。

使用支持原生 Skill 加载的预设，例如 **standard**。Gallery 会注册 Skill 提供方，并在加载时准备附属文件的运行目录；不需要手动复制到 `.dsh/skills`。无效或禁止用户调用的 Skill 不显示。该功能使用 DSH 的原生输入建议与 Skill 加载机制，尚未进行完整模型会话端到端验证。

榜单按累计调用次数排序。Skill 加入会话上下文或经原生工具成功加载时计数，Agent 成功启动子会话时计数，MCP 工具成功返回时按所属服务计数。打开列表、选中建议和检查连接不会增加次数。


Gallery Skill 的 `SKILL.md` 和附件一起写入运行目录。加载 Skill 时会列出 `references/`、`scripts/`、`assets/` 中的文件路径；需要读取具体附件的任务，应使用支持文件读取工具的 DSH 会话。


MCP 分类提供基本信息、连接配置与测试、检查保存三步向导。支持本地 stdio 和远程 Streamable HTTP；保存后由 DSH 官方 MCP 客户端注册工具，修改连接或密钥后自动更新连接。认证信息直接在页面填写：HTTP 支持 Bearer Token（自动添加前缀）及自定义请求头，本地进程支持变量名和值。页面不再提供宿主环境变量引用方式；编辑旧引用配置时保留字段名，需重新填写实际值（或移除字段），保存后改为页面认证。直接填写的认证值保存在 DSH 主机内部资源文件的私有字段中（文件权限 0600，不额外加密），仅用于连接；资源列表、详情、快照和常规导出不含认证值。再次编辑时密钥不回显，留空保留，填写新值替换；删除字段或切换为无需认证后保存会移除旧值。导出到其他主机后需重新填写密钥。

创建向导统一使用名称、描述；调用标识自动生成，可在高级设置修改。Agent 沿用父会话模型。MCP 在连接配置步骤内测试连接，支持 stdio 与 Streamable HTTP。

画布支持左键框选多个节点、拖动节点整体移动、右键自由平移与鼠标锚点滚轮缩放；重置视图可重新定位节点。

Workflow Agent 节点可用 DSH 默认模型从 AGENT.md 提取名称、功能概述、长期职责、通用执行指令，并手动修改；Skill/MCP 绑定仍是待执行适配的草稿配置。

画布空白处右键可在鼠标位置添加三类节点；节点右键可删除。选中节点或框选后按 Delete 删除，编辑输入框文字时不会触发节点删除。右键拖动仍用于平移画布。

Workflow 编辑器仅配置可复用模板：Agent 四项通用字段及 Skill/MCP，任务和人工节点填写通用要求、通用交付物与通用验收要求。本次补充指令和具体任务说明留到应用模板阶段。

TeamFlow 成员开启「允许使用 Gallery MCP」后，会自动获得相关知识库优先检索指引，无需在每个任务重复填写。只引导选择实际可用的相关工具，不强制无关任务调用 MCP；覆盖不足时仍可补充外部检索。更新重启后在成员激活时生效。
