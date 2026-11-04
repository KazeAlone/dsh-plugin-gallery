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
