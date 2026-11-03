# DSH Team Gallery · 0.1.0

团队共享资源中心。每位成员在自己的 dsh 中安装插件，连接同一台独立 Gallery API 服务。

- 四类资源：Skill、Agent、MCP、Workflow。
- 创建、编辑、搜索、标签、文件/文件夹上传、JSON 资源包导入导出。
- 草稿仅作者与管理员可见；发布后团队成员可读。
- 作者与管理员可以编辑、发布。版本不可变，回滚恢复为新草稿后重新发布。
- 每位成员独立令牌；管理员可以创建成员、重置令牌、停用访问。
- 支持 `ctx.gallery` 和 HTTP SDK，供其他插件查询及获取固定版本。

当前针对 Node.js 24.9+、DSH **0.2.1-rc.5** 开发。客户端构建产物随安装包分发。资源定义作为文件保存，不执行上传的脚本或启动 MCP。

## 1. 启动一台共享服务

源码开发：

```sh
npm ci --legacy-peer-deps
npm run build
npm test
```

首次初始化管理员（只执行一次）：

```sh
node scripts/admin.mjs init --database /absolute/path/gallery.sqlite --name "团队管理员"
```

命令会输出管理员令牌，请妥善保存。数据库仅保存令牌 SHA-256，无法恢复原令牌。也可用 `--credentials /absolute/path/admin.credentials.json` 写入权限为 0600 的新文件；不要将凭据提交到仓库。

启动服务：

```sh
node src/server.mjs --database /absolute/path/gallery.sqlite --host 127.0.0.1 --port 4318
```

本机地址为 `http://127.0.0.1:4318`。**多成员跨电脑使用时，将服务部署到成员都能访问的机器，用 HTTPS 反向代理提供地址**，例如 `https://gallery.team.example`。所有成员连接这个相同地址，不能各自连接自己电脑的 localhost。健康检查为 `GET /health`。

SQLite 文件与附件内容保存在同一个数据库内，请持久化数据目录。单机 SQLite 不要放到跨机器共享文件系统中。服务/API 可在独立机器运行，不依赖 DSH。

部署示例和维护说明见 [团队部署](docs/deployment.md)。

## 2. 每位成员安装 dsh 插件

在能找到 dsh 的目录运行，可直接从 GitHub 安装：

```sh
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

仓库已提交 `dist/client.js`，安装时无需执行构建脚本。需要固定版本时，在 GitHub 地址后追加 `#<commit-sha>`。

也可以从本地源码或安装包安装：

```sh
npx dsh plugin --profile web add /absolute/path/dsh-plugin-gallery
# 或安装打包产物：
npx dsh plugin --profile web add /absolute/path/dsh-plugin-gallery-0.1.0.tgz
```

重启 dsh，刷新浏览器，左侧打开 **资源 Gallery**。填写共享服务地址及本人的成员令牌。管理员在“成员”界面创建其他成员，并通过团队可信渠道提供各自的令牌。

本机连接信息存入 `$DSH_HOME/gallery/connection.json`（默认 `~/.dsh/gallery/connection.json`），权限 0600。浏览器只取得连接状态、成员信息，不会读回已保存令牌。

也可以由部署配置提供：

```sh
export DSH_GALLERY_URL="https://gallery.team.example"
export DSH_GALLERY_TOKEN="本人的成员令牌"
npx dsh web
```

或在 profile 的 `cordis.patch.yml` 覆盖已有行（不重复插入）：

```yaml
- id: gallery-host
  name: dsh-plugin-gallery
  config:
    serverUrl: https://gallery.team.example
    tokenEnv: DSH_GALLERY_TOKEN
```

配置或环境变量管理的连接在 UI 中只读。所有资源写入权限由共享服务校验，客户端不能提交作者身份冒充其他成员。

## 3. 工作方式

1. 新建资源，选择 Skill、Agent、MCP 或 Workflow。
2. 上传已有文件或文件夹，也可直接新建并编辑文本文件。
3. 填写名称、描述、标签，保存草稿。
4. 检查后填写版本说明并发布，其他成员即可读取。
5. 更新时编辑草稿、发布下一版本。历史版本不改写。
6. “版本历史”可获取固定引用、查看历史内容、恢复旧版为草稿。恢复不会撤销已有发布版本。
7. 编排插件使用 `{id, version, digest}` 引用，是否升级由使用方决定。

文件路径为相对路径；支持 UTF-8 文本及 base64 二进制附件。每个资源最多 100 个文件、总量 5 MiB；API JSON 请求体最多 8 MiB。文本编辑适合描述、配置、脚本等文件；二进制附件可整体导出。JSON 导出格式为 `dsh-gallery-resource`，导入时创建当前成员的资源草稿。

`metadata` 可保存各类资源的扩展配置；`references` 为固定依赖数组：

```json
[{"id":"某个 Skill 的资源 ID","version":1}]
```

发布时检查依赖版本是否存在。Gallery 不把模板内容强制转成某个编排插件的内部格式；消费方解释文件与 metadata。MCP 资源建议保存环境变量名称和配置模板，使用方在运行环境提供凭据。

## 4. 其他插件接入

详见 [集成接口](docs/integration.md)。最小示例：

```js
export const inject = ['gallery']
export async function apply(ctx) {
  const result = await ctx.gallery.listResources({type:'skill',scope:'published'})
  const version = await ctx.gallery.resolveReference({id:'资源 ID',version:1})
  // version.resource.files 包含完整文件内容；运行由消费插件负责。
}
```

`ctx.gallery` 是可信同宿主插件接口，使用本机配置的团队成员身份。不要把此服务直接暴露给未授权分享用户。浏览器 RPC 额外校验当前 DSH Host owner；团队成员身份和资源写权限仍由共享服务令牌决定。

## 验证与打包

```sh
npm run build
npm run check
npm test
npm pack
```

纯内核/API 测试不调用模型、不需要 dsh 或真实令牌。真实 DSH 页面与 RPC 另行验证。构建使用 DSH 的浏览器模块包装协议，并复用宿主 React。

## 首版边界

单团队空间；管理员通过令牌管理成员。暂未包含 SSO、跨团队权限、资源删除、审核流程、自动安装到节点、自动启动 MCP、全文索引及大文件对象存储。远程托管位置和域名需要部署时指定。

存储由接口隔离，当前实现 SQLite。改用数据库或 GitHub 需要实现适配器并迁移资源、不可变版本和成员映射，页面及消费接口可保持不变，详见 [存储契约](docs/storage.md)。
