# Gallery

Gallery 是运行在 DSH 内的资源库，用来创建、整理、共享和调用 **Skill、Agent、MCP 和 Workflow**。默认使用 DSH 内部存储，无需部署数据库，也不增加插件登录或接入码；访问仍由 DSH 宿主认证控制。

当前版本 **0.33.2**。Workflow 对接 TeamFlow **0.2.15**：可将 Gallery 资源注册到 TeamFlow 模板库，也可从 TeamFlow 将模板上传到 Gallery 当前使用的内部库或中心库。

## 快速开始

要求 Node.js **>=24.9.0**，DSH **0.2.1-rc.3 或 0.2.1-rc.5**。开发依赖与运行验证以 rc.5 为主；rc.3 已完成核心接口静态对比，尚未完成完整运行验证。TeamFlow 的宿主兼容范围以其自身声明为准。

使用内部发布的安装包安装到实际使用的 DSH 配置，例如 `web`（替换为安装包的实际绝对路径）：

```bash
dsh plugin --profile web add /absolute/path/dsh-plugin-gallery-0.33.2.tgz --ignore-scripts
```

1. 重启对应的 DSH 实例并刷新浏览器，打开侧边栏 **Gallery**。
2. 保留默认的 **DSH 内部存储**，即可开始使用。
3. 进入 Skill、Agent、MCP 或 Workflow 分类，点击该分类的「新建」。
4. 保存后，在 Gallery 查看资源，或按下文说明在会话及 TeamFlow 中使用。

仓库包含构建好的前端，不需要在使用者电脑上编译。`--ignore-scripts` 跳过安装生命周期脚本，仍需安装运行依赖。

**使用本地源码目录安装时**，需先在该目录准备依赖；目录链接本身不会自动完成这一步：

```bash
cd /absolute/path/dsh-plugin-gallery
npm ci --ignore-scripts --legacy-peer-deps
npx @deepseek-ai/dsh@0.2.1-rc.5 plugin --profile web add /absolute/path/dsh-plugin-gallery --ignore-scripts
```

源码目录安装后应保留该目录；修改前端后需执行 `npm run build`，再重启 DSH、刷新浏览器。安装包分发、替换旧链接和缺依赖排查见[安装说明](docs/installation.md)。

## 浏览与管理

- 「全部」展示四类资源的累计调用榜；各分类提供资源浏览、名称/描述/标签搜索、编辑、删除及下载。
- 资源展示创建者；内部库资源可直接管理，中心库只允许创建者编辑、删除自己的资源。
- 创建和编辑使用相同的专用向导或 Workflow 画布；成功保存后关闭编辑窗口，并显示自动消失的悬浮通知。
- 每个资源最多 **100 个文件、文件内容总计 5 MiB**，支持文本和二进制附件。资源类型创建后固定。
- 内部库内置由 **ZelongWANG** 创建的四类参考示例。初始化时添加，修改或删除后不会在重启时恢复；中心库不会自动复制这些内部示例。

界面跟随 DSH 中英文开关，资源正文和未保存草稿保持原文。内部版主题按钮保留跟随系统、墨绿黄铜、暖纸、漫画印刷、鎏金星穹、原神 · 冒险手册六种外观。主题选择保存在当前浏览器，资源和调用接口共用同一套逻辑。详见[系统语言](docs/language.md)与[UI 设计说明](docs/ui-design.md)。

## 创建资源

Skill、Agent、MCP 的第一步统一填写「名称」「描述」，调用标识自动生成，可在高级设置修改。标签和封面在检查保存步骤设置。

| 资源 | 创建流程 | 保存内容与用途 |
| --- | --- | --- |
| Skill | 基本信息 → 编写指引 → 检查保存 | `SKILL.md` 与可选 `references/`、`scripts/`、`assets/`，作为一个资源整体保存、加载 |
| Agent | 基本信息 → 行为指引与附件 → 检查保存 | `AGENT.md`、可选 `references/`、`assets/` 及配置；用于委派子任务，沿用父会话模型 |
| MCP | 基本信息 → 连接配置与测试 → 检查保存 | 本地 stdio 或远程 Streamable HTTP 服务配置，连接成功后供 DSH 注册工具 |
| Workflow | 填写模板信息，在画布配置成员、节点与连线后保存 | TeamFlow 原生 `workflow.json` 与画布元数据；由 TeamFlow 应用、执行 |

### Skill

编写执行指引，在「附属文件与选项」中上传、拖入或新建附件。附件清单自动同步到指引，无需手动插入。名称、描述等文件头由向导生成，导入时已有的扩展字段会保留。

加载后，`SKILL.md` 与附件一起准备到 DSH 主机运行目录，并列出附件路径。附件正文按需读取，脚本不会因导入或加载而自动执行；读取或执行仍需要会话具备相应工具。

### Agent

编写行为指引和边界，可添加参考资料与素材。不需要填写模型名称，也不要求像 Skill 一样提供 `scripts/`。保存为 Gallery Agent 不会直接启动会话，需在会话中指定任务后调用。格式细节见 [Agent 资源说明](docs/agent-resource-design.md)。

### MCP 与认证

- **stdio**：填写命令、参数、可选工作目录及进程环境变量的实际值；程序需在运行 DSH 的服务器上可执行。
- **Streamable HTTP**：填写服务 URL；可选择无需认证、Bearer Token 或自定义请求头。
- 认证值直接在页面填写，无需启动 DSH 前设置密钥环境变量。Bearer Token 自动添加 `Bearer ` 前缀；自定义请求头按服务要求填写完整值。
- 在「连接配置与测试」这一步检查连接、查看工具，有错误可直接修改后重试。

编辑时已有密钥不回显，留空保留，填入新值替换；移除认证字段或切换为无需认证后保存，会移除相应旧值。常规资源下载、列表、详情和快照不包含认证值，导入其他主机后需重新填写。

内部库的认证私有字段保存在 DSH 主机的资源文件中，文件权限为 `0600`，不额外加密；中心数据库使用加密存储。共享 MCP 可由有权访问中心的成员 DSH 使用。中心 stdio MCP 需各 DSH 明确开启「允许中心 stdio MCP 在此 DSH 执行本机命令」：它会在该 DSH 所在服务器启动进程，而不是在中心服务器执行。

## 导入与导出

Skill、Agent、Workflow 分类的「新建」支持「从零创建」和「导入已有」。先预览，再进入向导或画布；**只有保存才写入资源库**。导入生成独立副本，不回写、不自动同步源文件，也不执行其中的脚本。

| 来源 | Skill / Agent | Workflow |
| --- | --- | --- |
| 本机文件 | 浏览器所在电脑的 Markdown、资源文件夹或同类型 Gallery JSON 资源包 | Gallery 导出的 Workflow `.gallery.json` 资源包（格式版本 1 或 2） |
| 服务器目录 | DSH 服务器上的资源文件夹、Markdown 或同类型 Gallery JSON 资源包 | 一个 `.gallery.json` 文件，或仅含一个该类文件的目录 |

Skill 自动识别 `SKILL.md`，带入三类附属目录。Agent 自动识别 `AGENT.md`，也可选择单个 Markdown，带入 `references/`、`assets/` 和可选 `config.json`；外部模型配置会忽略。缺少描述或调用标识不符合要求时，在向导中补充确认。

服务器目录使用常见文件选择器操作：单击选中、双击目录进入、「上一级」返回、「读取」读取选择项；未选中时读取当前目录。它浏览的是 **DSH 主机文件系统**，受 DSH 系统账号权限限制；容器部署只能看到容器内目录和挂载位置。目录符号链接可进入实际位置，资源附属目录内部的符号链接不跟随。

不提供 Git/GitHub 远程导入。需要仓库里的资源时，先在服务器克隆，再从服务器目录读取。

资源详情的「下载资源」生成 `.gallery.json`，包含资源文件及可移植配置。Workflow 导入保留成员快照、任务和连线，原资源库引用需要在当前库重新选择；它不直接导入单独的 TeamFlow 模板 JSON 或执行实例。

## 在 DSH 会话中使用

### Skill

在 Web 会话输入框输入 **`/gallery`**，选择 Skill，补充任务后发送。可输入 `/gallery/关键词` 搜索，支持上下键、Enter 选择和 Escape 取消。无效或禁止用户调用的 Skill 不显示。

使用提供原生 Skill 加载能力的预设，例如 **standard**。Gallery 注册原生 Skill 提供方，不需要手动复制到 `.dsh/skills`。

### Agent

用自然语言描述要委派的任务，例如「让 Gallery 里的会议纪要审阅员核对这份草稿」。模型可使用 `gallery_agent_list` 查找资源，再通过 `gallery_agent_run` 启动子 Agent 并回传结果。需要宿主启用 tools、subagents 和 spawn 提供方。

### MCP

保存有效 MCP 后，Gallery 通过 DSH 官方 MCP 客户端注册 `mcp__<serverName>__<tool>` 工具。在会话中描述要完成的操作，由模型选择可用工具和参数。连接检查成功表示服务可连接，不代表所有会话预设或工具策略都已允许调用。

### 在会话中创建、编辑和删除资源

从 0.33.0 起，模型可以使用统一的 `gallery_resource_*` 工具管理四类资源。例如：「把刚才的审阅流程保存为内部库的 Skill」「修改中心库里的某个 Agent」。需要宿主启用 tools，并允许这些工具；更新后重启 DSH、刷新界面，旧的“只有查询和调用工具”的回答不再适用。

| 工具 | 用途 |
| --- | --- |
| `gallery_resource_schema` | 获取指定资源类型的完整格式示例、当前库及限制 |
| `gallery_resource_list` / `gallery_resource_get` | 搜索四类资源、读取可编辑内容和 revision |
| `gallery_resource_validate` | 检查格式及目标库，返回问题或规范化内容，不保存 |
| `gallery_resource_create` | 新建并保存，返回 `saved: true`、资源 ID、目标库及 revision |
| `gallery_resource_update` | 完整更新资源，要求最新 revision 和创建者权限 |
| `gallery_resource_delete` | 按用户明确要求删除，要求最新 revision 和创建者权限 |

操作需明确 `libraryId: local`（内部）或 `center`（共享），不会悄悄切换存储；写入成功以返回 ID 为准。MCP 认证只能通过专用写入字段传入，不会在校验、读取或保存结果中回显。保存 MCP 会刷新连接，stdio 可能启动本机进程；保存 Workflow 不会自动注册到 TeamFlow 或启动流程。TeamFlow 成员的 Skill/MCP 开关只授予使用能力，不开放上述管理入口。完整参数与示例见[会话资源管理接口](docs/resource-authoring.md)。

### 累计调用次数

| 资源 | 计数时机 |
| --- | --- |
| Skill | 加入会话上下文或经工具成功加载 |
| Agent | 成功启动子会话 |
| MCP | 工具成功返回，计入所属服务 |
| Workflow | 已注册模板在 TeamFlow 中启动实例后同步计数，同一实例去重 |

浏览、搜索、选中建议、连接测试以及单纯保存资源不会增加调用次数。

## Workflow 与 TeamFlow

Gallery 负责编辑、保存和共享可复用模板，**TeamFlow 负责应用模板、适配本次需求和运行流程**。

### 在 Gallery 创建

1. 填写模板名称、适用说明、应用前需要提供的信息和标签。
2. 在成员栏添加 Gallery Agent，配置名称、职责概述、角色职责、通用执行指令 / PE，以及「允许使用 Gallery Skill / MCP」开关。可使用 DSH 默认模型从 `AGENT.md` 提取通用字段，再手动确认。
3. 在画布添加任务、门控、验收、归档节点，设置负责人和通用任务要求、交付物、验收要求。
4. 拖动端口连接依赖；门控可设置 PASS 后续和 REJECT 返工分支、审核方式、有限轮次与超时。
5. 保存到 Gallery。未完成配置可先保存草稿，注册到 TeamFlow 前需补全要求并满足模板结构检查。

成员与画布节点分开展示。画布支持左键框选及拖动、右键平移、滚轮以鼠标为中心缩放、全屏、右键菜单和 Delete 删除。具体字段、循环规则及草稿限制见 [Workflow 画布说明](docs/workflow-canvas.md)。

### 双向保存模板

- **Gallery → TeamFlow**：在 Workflow 详情点击「注册到 TeamFlow」，写入其个人模板库，再到 TeamFlow 应用到会话。Gallery 优先读取当前宿主中已启动 TeamFlow 的 `templateDirectory`，默认目录为 `~/.dsh-teamflow/templates`；未检测到插件时才回退 `DSH_TEAMFLOW_TEMPLATE_DIR` 或默认目录。注册后通过 TeamFlow 自身接口核对模板 ID 和版本，确认可读才显示成功；请重新打开模板库刷新列表。接口不可用或未找到时会明确显示文件写入目录，便于排查不同 DSH 实例或目录不一致。
- **TeamFlow → Gallery**：TeamFlow 0.2.15 模板详情的「上传至 Gallery」将所选内置或个人模板版本上传到 **Gallery 当前选中的库**。内部库存本机，中心库存共享服务器；可先在 Gallery 切换存储再上传。需要 Gallery 0.32.1+。

同一源版本向同一目标库重复上传会复用已有副本，保留 Gallery 中的编辑；新版本另建资源。同一版本内容发生变化时需先保存为新版本。上传不包含执行状态、结果或会话信息。Gallery 本身不提供资源历史回滚。

### 成员按需使用 Skill / MCP

TeamFlow 0.2.13+ 已接入 Gallery 的按需模式。为成员开启原有两个开关后，由 **Agent 自己搜索并加载需要的 Skill、查询并调用 MCP**，用户不必逐条选择，也不会把整个库及所有工具定义预先塞进每个成员的上下文。

搜索默认每页 5 条，可翻页；Skill/MCP 搜索每页最多 20 条，MCP 工具查询每页最多 10 条。它是名称、描述、标签、作者等关键词检索，不是语义搜索。相关任务会收到优先使用 Gallery 资源的指引；匹配不到时仍可补充外部检索。普通聊天的 `/gallery` 和直接 MCP 调用保留原方式。

## 内部存储与中心共享

在「存储设置」选择存储方式。**内部库固定一个**，不再额外创建；切换内部库与中心库不会迁移、合并或镜像资源。

| 项目 | DSH 内部存储 | 中心服务 |
| --- | --- | --- |
| 部署 | 随插件使用，无需数据库 | Linux 上部署 Center + PostgreSQL |
| 连接 | 默认即可使用 | 填写中心服务器 IP:端口 |
| 资源范围 | 当前 DSH 数据目录 | 多个 DSH 共享 |
| 修改权限 | 本机资源可编辑、删除 | 只有创建者可编辑、删除，其他成员可查看和使用 |
| 身份 | 使用本机配置 | 每个 DSH 自动注册、保存独立身份，显示名称相同也不共用权限 |

### 部署中心服务

在中心服务器的 Gallery 仓库根目录执行：

```bash
sudo bash scripts/install-center.sh --port 8088
```

脚本准备 Docker、PostgreSQL 和 Center，只需对客户端开放 TCP 8088，不必提前单独安装数据库。各 DSH 在存储设置填写 `中心服务器IP:8088`，检查通过后保存，无需手动分发共享密钥或证书。中心地址可配置，没有固定业务服务器 IP。中心连接默认使用独立 HTTP 客户端直连，避免打包启动器或宿主全局代理改变访问路径；确实需要代理时，在「连接选项」开启「使用宿主代理连接中心服务」。

中心只存资源；Agent、MCP、Workflow 在使用者的 DSH 主机运行。默认部署面向可信公司内网，HTTP 不加密，能访问端口的客户端可以注册读取资源；需要加密或接入控制时使用公司网关。完整操作见[中心服务部署与维护](docs/center-storage.md)。

```bash
# 状态、日志、停止、重启
sudo /opt/gallery-db/gallery-center ps
sudo /opt/gallery-db/gallery-center logs --tail=50 center
sudo /opt/gallery-db/gallery-center stop
sudo /opt/gallery-db/gallery-center restart
```

### 数据与备份

默认数据目录为 `$DSH_HOME/gallery/`，未设置 `DSH_HOME` 时为 `~/.dsh/gallery/`：

```text
resources.json          内部库资源与私有 MCP 认证
storage.json            存储选择、显示名称及中心身份凭证
workflow-uploads.json   TeamFlow 源版本与 Gallery 副本的对应记录
```

备份内部数据时保留这些文件；不要把 `storage.json` 分给其他用户，否则会共用中心身份。中心部署需另外备份 **PostgreSQL 数据和 `/opt/gallery-db/center.env`**，后者包含 MCP 认证加密密钥。部署配置备份不能代替数据库备份。

升级 Center：拉取代码后重新运行安装脚本，默认沿用原端口、数据卷与密钥。迁移到其他服务器还需迁移数据库、加密配置并安排用户身份迁移，不能只改 IP 就认为旧数据和归属已迁移。详见[存储格式](docs/storage.md)。

## 常见问题

- **安装后缺少 `@modelcontextprotocol/client` 等依赖**：若用本地目录链接，在该目录安装依赖；分发时可用 `npm pack --ignore-scripts` 生成安装包。不要把 `update` 当作 `web` 启动参数。详见[安装说明](docs/installation.md)。
- **更新后还是旧界面**：确认更新的是正在运行的同一个 profile 和插件目录；源码安装需重新构建前端，再重启 DSH、刷新浏览器。
- **会话提示工具不存在或不可用**：检查对应预设、宿主工具提供方、白名单和审批策略；资源保存成功不等于会话已获工具权限。
- **Skill 附件读不到**：确认会话具备文件读取工具，按加载后提供的运行目录和路径读取。
- **中心 stdio MCP 不能用**：先确认本机允许执行中心 stdio MCP，且命令、路径和依赖在该 DSH 主机存在。
- **切换资源库后找不到原来的资源**：两侧数据独立，切回原库查看；迁移使用资源包导入导出。

## 开发与插件接入

```bash
npm ci --legacy-peer-deps
npm run build
npm run check
npm test
```

开发 UI 使用正常的 DSH 宿主，默认无需另起 Gallery 服务。可选指定 `TEAMFLOW_SOURCE=/path/to/dsh-teamflow` 验证实际模板解析器兼容；指定 `GALLERY_TEST_DATABASE_URL` 验证真实 PostgreSQL。数据库测试使用独立临时 schema。

其他插件可通过同宿主 `ctx.gallery` 读取资源、解析引用或获取快照，也可为真实子 Agent 设置按需访问。带 digest 的引用在内容变化时会报告冲突。接口与权限约束见[集成接口](docs/integration.md)、[按需访问接口](docs/resource-discovery.md)。

## 内部分发

在源码目录安装依赖、构建并检查后，执行 `npm pack --ignore-scripts` 生成安装包；使用实际生成的文件名分发和安装。该分支不包含外部 Git 仓库安装地址及仓库元信息。npm 依赖下载地址和 Docker 安装地址仍保留，内部网络需准备相应软件源、镜像源或缓存；清除仓库链接不代表离线安装。

源码归档使用 `git archive --format=tar.gz --output=/tmp/gallery-source.tar.gz HEAD`，不包含 `.git` 和本机依赖目录。请勿将本机运行数据、中心身份或密钥一起分发。
