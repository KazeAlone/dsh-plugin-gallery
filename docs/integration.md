# Gallery 集成契约 · 0.2

## 同宿主 Cordis 服务

声明 `inject = ['gallery']`，通过 `ctx.gallery` 获取资源：

```ts
listResources(query?: {type?: 'skill'|'agent'|'mcp'|'workflow'; q?: string; scope?: 'all'|'drafts'|'published'; limit?: number; offset?: number}, options?: {signal?: AbortSignal}): Promise<{items: Summary[]; total: number; limit: number; offset: number}>
getResource(id: string, options?: {signal?: AbortSignal}): Promise<ResourceDetail>
listVersions(id: string, options?: {signal?: AbortSignal}): Promise<{items: VersionSummary[]}>
getVersion(id: string, version: number, options?: {signal?: AbortSignal}): Promise<PublishedVersion>
resolveReference(ref: {id: string; version: number; digest?: string}, options?: {signal?: AbortSignal}): Promise<PublishedVersion>
```

资源 ID 与版本号在升级中保留。消费方保存 `{id,version,digest?}`，运行时获取固定版本，不隐式跟随 latest。更新资源不会改变已发布版本。

`getResource` 包含当前草稿和最新发布内容；用于执行的节点应使用 `getVersion` / `resolveReference`。`listResources` 默认每页 100 条，limit 范围 1–100。

摘要结构：`{id,type,name,description,tags,revision,hasDraft,latestVersion,fileCount,createdAt,updatedAt}`。

发布结构：`{id,version,digest,note,createdAt,resource}`。

```json
{
  "type":"skill",
  "name":"Code review",
  "description":"Review a patch",
  "tags":["engineering"],
  "files":[{"path":"SKILL.md","encoding":"utf8","content":"# Review","bytes":8}],
  "metadata":{},
  "references":[{"id":"other-resource-id","version":1}]
}
```

`digest` 为保存的规范 JSON 快照的 SHA-256。版本号是资源内递增正整数；草稿 revision 是独立的并发控制值。

## 编排插件如何使用

1. 节点编辑器查询 `listResources({type:'skill',scope:'published'})`。
2. 展示名称、描述、标签及版本列表。
3. 用户选择资源后，把固定版本引用存入节点配置。
4. 执行前解析引用并检查摘要，再按自身 Agent 格式使用文件。

Gallery 返回文件内容，不自动写入项目、启动进程或改变运行权限。路径约束、资源格式转换和执行生命周期由消费方负责。

## 独立读取适配器

`dsh-plugin-gallery/sdk` 导出 `GalleryReader`，可包装本地存储或兼容的异步适配器：

```js
import { GalleryReader } from 'dsh-plugin-gallery/sdk'
import { SqliteGalleryStore } from 'dsh-plugin-gallery/storage'
const store = new SqliteGalleryStore('/absolute/path/gallery.sqlite')
try {
  const reader = new GalleryReader(store)
  const result = await reader.listResources({scope:'published'})
} finally {
  store.close()
}
```

同一 dsh 内优先使用已加载的 `ctx.gallery`，避免重复连接。`GalleryReader` 不管理传入存储的生命周期，可接收存储实例或 Promise。读取操作支持取消信号。

## 从 0.1 升级

移除了成员管理、作者/管理员权限、HTTP API、`GalleryClient`、URL/token 配置，以及摘要中的 owner/canEdit 字段。筛选 `mine` 改为 `drafts`。同宿主五个读取方法的名称和参数保持不变。

浏览器 RPC 仍通过当前 DSH Host owner 上下文认证。不要把本地资源服务直接转发给未授权分享用户。
