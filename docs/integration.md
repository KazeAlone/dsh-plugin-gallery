# Gallery 本地集成契约

当前默认使用 DSH 宿主内的 `LocalGalleryStore` 文件适配器，不连接共享 HTTP 服务或数据库。

其他插件声明 `inject = ['gallery']`，然后调用：

- `ctx.gallery.listResources({type?,q?,limit?,offset?})`：返回 `{items,total,limit,offset}`，limit 为 1–100。
- `ctx.gallery.getResource(id)`：返回资源内容、`id`、`digest`、`revision`、时间与文件数。
- `ctx.gallery.resolveReference({id,digest?})`：获取当前资源，摘要变化时返回 `DIGEST_MISMATCH`。
- `ctx.gallery.getSnapshot({id,digest?})`：返回独立的 `{id,digest,resource}` 内容快照。

资源包含 `type,name,description,tags,files,metadata,references`。文件使用 utf8 或 base64 编码。所有本地资源 `canEdit: true`，无需 Gallery 身份；浏览器 RPC 仍要求 DSH 宿主 owner 身份。RPC 仅暴露状态、列表、获取、新建和更新，不暴露身份接入接口。

`revision` 用于防止多窗口覆盖，不是历史版本。Gallery 不执行资源内容；消费方自行管理转换与执行生命周期。

原 `GalleryClient` 及 HTTP 服务模块暂时保留供后续统一存储扩展，不用于默认宿主运行链路。

## 多资源库与适配边界

宿主经 `StorageManager` 将资源操作委托给具体适配器。当前仅注册内部文件适配器；中心服务尚不可启用。每个连接有独立 `id,type,name`，配置有 `activeLibraryId`。配置跟随 DSH 实例，切换不会迁移数据。

资源详情和列表项增加 `libraryId`。`resolveReference` 与 `getSnapshot` 接受 `{libraryId?,id,digest?}`，指定库时不会退回当前库；`getResource(id,{libraryId})` 也可读取指定库。未指定库的旧调用仍使用当前库。metadata 中的业务引用格式由消费插件解释；标准 references 数组现在保留 libraryId。

浏览器通过 owner RPC 调用：

- `uiStorageSettings()`：读取连接列表、当前库、后端可用性和能力。
- `uiTestStorage(payload)`：检查指定本地库文件格式；这是读取检查，不保证后续写入权限或磁盘空间。
- `uiAddLibrary(payload)`：添加内部库配置，不自动切换。
- `uiSwitchLibrary(payload)`：检查目标后切换当前库，原资源保留。

当前支持读取、新建、编辑，不支持历史、共享和自动迁移。后续后端必须遵循同一资源数据结构及 revision 冲突语义；中心服务凭据不得返回浏览器或写入普通连接配置。
