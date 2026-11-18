# Gallery

Workflow 采用成员栏与流程画布分离的布局：Agent 在成员栏统一配置，任务卡片显示可点击的负责人，选中成员高亮关联任务；画布保留任务、门控判断、验收和成果归档。门控提供 PASS 后续路径与 REJECT 拖拽返回线，可配置人工/独立 AI 审核、有限循环、返工范围和超时；保存、重新编辑及注册到 TeamFlow 保留原生门控、循环和归档字段。支持框选拖动、右键平移、鼠标中心缩放、全屏和右键删除连线。详见[画布操作说明](docs/workflow-canvas.md)。

内置 `gallery-skill-reference` 参考 Skill，包含完整文件头、执行指引、输入输出示例、三类附件、标签和封面。升级首次启动时添加，可查看、编辑和调用；修改或删除后不会在重启时恢复。

运行在 DSH 内的资源库，用于管理 **Skill、Agent 描述、MCP 配置和 Workflow 模板**。Workflow 使用 TeamFlow 的原生模板结构，可从资源详情安装到 TeamFlow 个人模板库。

打开「Gallery」即可使用，**无需填写姓名、接入码或 Gallery 身份凭证**。沿用 DSH 自身的宿主访问认证，不增加插件登录流程。

公司内网中心存储可一键部署：`sudo bash scripts/install-center.sh --port 8088`，自动准备数据库和 Center。插件只填 `服务器IP:8088`，无需共享密钥或证书，保留独立用户编辑权限。首次下载镜像需要网络，后续可复用镜像。详见[中心存储部署](docs/center-storage.md)。

## 安装

要求 Node.js >=24.9、DSH 0.2.1-rc.3 或 0.2.1-rc.5。

rc.3 与 rc.5 的 Gallery 所用核心接口已完成静态对比；rc.3 的完整运行验证尚未完成。开发依赖仍固定 rc.5，安装时通过 peer 依赖复用宿主对应版本，避免混用运行时。TeamFlow 的宿主兼容范围以该插件自身声明为准。

```bash
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

更新后重启 DSH 并刷新浏览器。仓库包含构建好的客户端。

本地目录链接与安装包的依赖行为不同，详见[安装说明](docs/installation.md)。

中心存储使用[一键中心服务部署](docs/center-storage.md)，无需单独安装数据库。默认仍使用 DSH 内部存储。

## 本地存储

默认内部存储无需启动 `gallery.mjs serve` 或数据库；如需共享资源，可切换到 PostgreSQL 中心服务。默认内部存储的数据文件：

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

Gallery 保存和读取资源。有效的 Agent 可通过会话工具 `gallery_agent_list`、`gallery_agent_run` 交给 DSH `spawn` 子 Agent 执行；需要启用 DSH tools、subagents 和 spawn 提供方。保存的 MCP 服务通过 DSH 官方 MCP 客户端注册为 `mcp__<serverName>__<tool>` 会话工具，认证值直接在 MCP 配置页面填写，无需预先设置宿主环境变量。Workflow 可以安装到 TeamFlow 模板库，再从 TeamFlow 模板库应用到会话；Gallery 本身不执行 Workflow。默认模板目录为 `~/.dsh-teamflow/templates`，如 TeamFlow 配置了其他 `templateDirectory`，请给 Gallery 进程设置 `DSH_TEAMFLOW_TEMPLATE_DIR` 为相同路径。当前不提供发布版本或历史回滚。中心服务提供共享存取，不自动迁移或镜像内部资源。

Gallery 顶部的主题按钮可切换「跟随系统」「墨绿黄铜」「暖纸」「漫画印刷」「鎏金星穹」「霓虹玻璃」「次元放映室」「原神 · 冒险手册」和「纸境 · Paper」。纸境提供独立的侧边导航、四类 TOP 3 调用榜、插画资源卡片、标签筛选、排序和右侧详情抽屉；顶部 ◐ 按钮切换浅色与深色。新建和编辑继续使用原有的资源专用向导，存储、调用、导出、删除及 TeamFlow 接口保持一致。鎏金星穹可在页眉暂停动效，并遵循系统的减少动态效果设置。主题选择只保存在当前浏览器。

Gallery 界面跟随 DSH 的中英文开关即时切换；资源内容和未保存草稿保留原文。详见[系统语言](docs/language.md)。

## 创建与导入 Skill / Agent

点击对应分类的「新建」后，先选择「从零创建」或「导入已有」。导入结果先预览，再进入现有向导检查名称、描述、指引、附件与标签；只有点击保存才写入资源库，导入不会执行任何脚本。保存为独立副本，不回写或自动同步源文件。

- **本机文件**：选择当前浏览器所在电脑的 Markdown 文件、资源文件夹，或同类型 Gallery JSON 导出包。浏览器文件与 DSH 主机工作区相互独立。
- **服务器目录**：浏览运行 DSH 的服务器文件系统，不限于已登记工作区。默认从根目录开始，使用常见文件选择器操作：单击选中，双击文件夹进入，「上一级」返回父目录，「读取」读取选中的文件/文件夹（未选中时读取当前目录）。地址栏显示当前位置；支持键盘方向键选择和 Enter 打开。可选择资源文件夹或单个 Markdown / Gallery JSON 文件。目录符号链接可进入实际位置；资源附属目录内部的符号链接不跟随。读取权限由 DSH 的系统账号决定，不提升权限、不执行文件。默认仅显示目录和可导入的 Markdown/JSON 文件。若 DSH 运行在容器内，显示的是容器可见的目录和挂载位置。

不再提供 GitHub/Git 远程导入及其认证入口。需要导入仓库中的资源时，可自行克隆到服务器，再从「服务器目录」读取；已有导入资源保持为独立副本。

Skill 自动识别 `SKILL.md`，带入 `references/`、`scripts/`、`assets/`。Agent 支持 `AGENT.md` 或单独选择的 Markdown 文件，带入 `references/`、`assets/` 和可选 `config.json`；外部模型配置会忽略，沿用宿主模型。缺少描述或不符合要求的调用标识会提示在向导中补充确认。每次只导入一个资源，最多 100 个文件、总计 5 MiB；编辑现有资源直接进入向导。

## 其他插件接入

Gallery 提供 Skill/MCP 按需搜索、Skill 加载、MCP 工具查询与代理调用。消费插件为成员启用 `resourceMode: "discovery"` 后，仅提供少量固定入口，避免全量目录和工具定义占用上下文。旧接入方式保留；TeamFlow 尚需启用新模式。详见[按需访问接口](docs/resource-discovery.md)。

通过同宿主 `ctx.gallery` 使用 `listResources(query)`、`getResource(id)`、`resolveReference({id,digest?})` 和 `getSnapshot({id,digest?})`。引用包含 digest 时，资源变化会返回冲突；执行方可以保存快照保证本次运行内容一致。

宿主通过独立的存储适配器访问资源，可选择本地文件或 PostgreSQL 中心服务。原共享 HTTP/SQLite 实现及测试暂保留，不属于当前中心服务运行链路。详见 [接口说明](docs/integration.md) 和 [存储说明](docs/storage.md)。

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

内部存储固定读取 `gallery/resources.json`，不再创建额外内部库。存储设置可选择内部存储或 PostgreSQL 中心服务，连接检查通过后保存；切换不会迁移或覆盖另一侧资源。

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
