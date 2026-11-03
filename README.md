# DSH Resource Gallery · 0.2.0

一个运行在 dsh 内的**单用户本地资源库**，集中管理 Skill、Agent 描述、MCP 配置与 Workflow 模板。

- 创建、编辑、搜索、标签、文件/文件夹上传、JSON 资源包导入导出。
- 草稿、不可变发布版本、更新和回滚；多窗口编辑使用 revision 检查冲突。
- 为其他编排插件提供 `ctx.gallery` 只读接口，按资源 ID、版本和摘要获取完整文件。
- 直接使用 dsh 本地 SQLite，无需成员账户、管理员初始化、令牌或独立服务。

要求 Node.js **24.9+**、DSH **0.2.1-rc.5**。资源文件只用于保存与读取，不会因上传而自动执行或启动 MCP。

## 安装

在安装了 dsh 的目录运行：

```sh
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

仓库已包含 `dist/client.js`，安装时无需运行构建脚本。也可以安装源码目录或 `.tgz`：

```sh
npx dsh plugin --profile web add /absolute/path/dsh-plugin-gallery
npx dsh plugin --profile web add /absolute/path/dsh-plugin-gallery-0.2.0.tgz
```

重启 dsh 并刷新浏览器，从左侧 **资源 Gallery** 打开即可使用。

## 使用

1. 新建资源，选择 Skill、Agent、MCP 或 Workflow。
2. 上传已有文件、文件夹或 Gallery JSON 资源包；也可直接创建和编辑文本文件。
3. 填写名称、描述、标签，保存草稿。
4. 检查后填写版本说明，发布为固定版本。
5. 更新时编辑草稿再发布，历史版本保留。
6. 在版本历史查看原始内容，或恢复旧版为新草稿，再发布新版本。
7. 用“获取引用”取得 `{id, version, digest}`，供编排插件固定引用。

每个资源最多 100 个文件，总量不超过 5 MiB。支持 UTF-8 文本和 base64 二进制附件；导出格式为 `dsh-gallery-resource` JSON。资源类型在创建后固定。

`metadata` 保存资源扩展配置；`references` 保存固定版本依赖：

```json
[{"id":"另一个资源的 ID","version":1}]
```

发布时检查引用版本是否存在。Gallery 不强制规定编排插件的节点格式，由消费方解释文件与 metadata。MCP 配置保存环境变量名称和模板，运行凭据由使用方提供。

## 数据位置与升级

默认数据库：`$DSH_HOME/gallery/gallery.sqlite`，未指定 home 时为 `~/.dsh/gallery/gallery.sqlite`。可通过 profile patch 覆盖已有插件行：

```yaml
- id: gallery-host
  name: dsh-plugin-gallery
  config:
    database: /absolute/path/gallery.sqlite
```

从 **0.1.0 多用户版本**升级时：

- 默认本地库尚不存在时，从原 `~/.dsh/gallery/service/gallery.sqlite` 复制一致的 SQLite 快照。
- 新库迁移为单用户结构，保留所有资源、草稿、发布版本、摘要及资源变更记录；移除成员表及资源归属字段。
- 原数据库不改写；迁移前另保存 `.before-single-user-*.sqlite` 备份。
- 新库已存在时不会重新导入旧库。自定义 `database` 路径中的旧格式数据库也会先备份再迁移。
- 原成员令牌、连接配置不再使用。旧版独立服务应停止，后续资源直接由 dsh 本地管理。

升级移除了 HTTP SDK 和成员管理 API；同宿主 `ctx.gallery` 的读取方法保持不变。所有本地草稿都可查看和编辑。浏览器操作继续使用 dsh 自身的 Host owner 认证。

## 其他插件接入

```js
export const inject = ['gallery']
export async function apply(ctx) {
  const page = await ctx.gallery.listResources({type:'skill',scope:'published'})
  if (!page.items.length) return
  const resource = page.items[0]
  const snapshot = await ctx.gallery.resolveReference({
    id: resource.id, version: resource.latestVersion,
  })
  // snapshot.resource.files 包含固定版本的完整文件。
}
```

接口说明见 [集成契约](docs/integration.md)，数据结构及迁移见 [存储契约](docs/storage.md)。

## 开发与打包

```sh
npm ci --legacy-peer-deps
npm run build
npm run check
npm test
npm pack
```

测试涵盖资源 CRUD、发布不可变、回滚、多窗口冲突、旧库迁移与备份、WAL 快照导入和消费接口。客户端复用宿主 React，并使用 DSH 浏览器模块包装格式。

## 当前范围

本地单用户资源管理。尚未实现自动安装到编排节点、自动启动 MCP、远程同步、大文件对象存储或全文索引。资源执行及运行权限由消费插件负责。
