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

**当前仓库不包含 DSH 的 Skill 执行器，也没有执行事件订阅。此版本只提供统计存储、展示和上述接入接口，执行端需要在真实使用处接入后才会增长，不能据此声称已自动统计 DSH 使用。**


## /gallery 会话入口（0.6.0）

浏览器依赖原生 ui-input-trigger，注册 Gallery 斜杠建议来源。输入 `/gallery` 展示列表，或从 `/` 菜单选择 Gallery 进入 `/gallery/`；继续输入关键词过滤名称和描述。选中项插入稳定的 `/gskill-<资源 ID 摘要>`，用户补充任务后发送，原生 dsh-tool-skill 注入指引。不会自动发送、清空整份草稿或在选择时计数。此入口是 Web 会话输入建议，不是终端命令。

Gallery 宿主在 skills 服务可用时注册 `gallery` provider。uiSkillCatalog 只向 owner 返回有效且 userInvocable 的本地 Skill；新建与更新会使注册目录失效。支持标准 user-invocable 和 disable-model-invocation 布尔字段。不合格或没有 SKILL.md 的资源不出现在目录。稳定别名避免同名 Skill 互相覆盖，重命名也保持调用身份。

实际加载时将完整文件集合物化到 `$DSH_HOME/gallery/skill-runtime/<资源摘要>/<内容摘要>/`，并返回原生 directory resourceBase。旧副本保留，以免正在进行的任务引用失效；脚本只写入，不自动执行，执行方式与权限仍由 DSH 决定。Gallery 编辑仍以 resources.json 为准，不同步运行副本上的修改。

已验证真实 Cordis 与 DSH 0.2.1-rc.5 SkillRegistry 的注册、目录更新、加载和附件路径。需要启用原生技能加载工具的预设（如 standard）；minimal 不提供此能力。没有运行完整 DSH 会话与模型端到端测试。提供方 get 不等于确认执行，因此此接入仍不会自动增加累计调用次数；准确计数仍需在执行消费方调用 recordSkillUse。


## 创建者与删除（0.6.1）

StorageManager 在创建时写入 `creator: {username}`，取自 storage.json 的 username，缺省使用宿主 OS 用户名。该名字是单用户 Gallery 的显示署名，不是多用户登录身份。资源输入不能覆盖署名，编辑保留原署名；旧资源不补造创建者。`uiSetUsername(payload)` 仅允许 owner 修改后续署名。

`uiDelete(id, JSON.stringify({expectedRevision}))` 仅允许 owner 调用，校验当前修订号后原子删除资源及累计调用去重数据，并使 Skill 目录失效。已物化的只读用途运行副本保留，以免破坏进行中的任务；删除不是运行副本擦除，也不支持恢复。

列表 sort 支持 updated（默认）或 usage（累计调用降序）；同分按名称、ID 稳定排序，搜索包含创建者用户名。四类榜单共用 usageCount，未接入执行上报的资源显示 0；当前 recordSkillUse 仍仅支持 Skill。


### 附件加载（0.7.2）

原生 Skill 加载结果现在在正文后列出附件相对路径和物化后的绝对路径，并保留 directory resourceBase。`skill` 工具只负责加载指引，附件由具备文件读取能力的 DSH 会话在需要时读取；加载工具本身不直接展开或执行附件。二进制附件可在目录中找到，但使用方式取决于会话可用工具。


## MCP 配置向导（0.9.0）

Gallery MCP 资源保存 `mcp.json` 和 metadata.mcp，字段 transport 仅允许 stdio、streamable-http。stdio 配置为 serverName、command、args、cwd、envRefs；HTTP 配置为 serverName、url、envRefs。envRefs 将服务端字段名映射到 DSH 宿主环境变量名称，检查连接时从进程环境读取值，资源文件不含值。HTTP Authorization 需要环境变量本身提供完整请求头值（如 `Bearer ...`）。

`uiCheckMcp(payload)` 只允许 owner 调用，按需启动或连接服务，列出工具名称与描述后关闭连接；超时 12 秒。保存不要求连接成功；同一资源库内服务器名称不能重复。该向导只是配置管理，不自动把 MCP 服务启用为 DSH 工具；启用仍需将配置转为 dsh-mcp-client 插件项。
