# DSH Resource Gallery

运行在 DSH 内的团队共享资源库，管理 **Skill、Agent 描述、MCP 配置、Workflow 模板**。每位成员在自己的电脑运行 DSH，连接同一个 Gallery 服务；保存即共享，只有上传者能编辑。

v0.3 不提供成员管理界面、草稿、发布、版本历史或回滚。首次打开填写姓名与维护者发放的一次性可信接入码；姓名不是权限依据。身份接口为后续多租户平台接入保留。

## 安装与启动

要求 Node.js >=24.9、DSH 0.2.1-rc.5。共享服务仅需部署一份，各电脑安装插件。

```bash
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

目前通过 GitHub 或本地压缩包安装，尚未发布 npm 包。从源码安装时先 `npm ci && npm run build && npm pack`，然后把插件压缩包交给 DSH 的 `plugin --profile web add file:/绝对路径/包.tgz --ignore-scripts`。

维护者启动共享服务（可在插件源码目录运行）：

```bash
node scripts/gallery.mjs serve --database /srv/gallery/gallery.sqlite --host 127.0.0.1 --port 4318
```

本机预览可用 `http://127.0.0.1:4318`。团队使用时，通过 HTTPS 反向代理开放同一个服务地址；每个人的 localhost 指向自己的电脑，不能用它实现跨电脑共享。远程 HTTP 地址会被拒绝。数据库文件只放在服务端，不通过网络文件共享直接打开 SQLite。

维护者为每位成员生成不同的接入码，通过可信渠道分别交付：

```bash
node scripts/gallery.mjs issue-code --database /srv/gallery/gallery.sqlite --output /secure/alice-code.json
```

文件权限为 0600，不能覆盖已有文件；默认有效期 24 小时，可用 `--ttl` 指定 60 秒至 7 天。接入码只能兑换一次，服务端只保存码与身份凭证的摘要。每个接入码创建独立 subject；相同姓名也属于不同身份。

启动 `npx dsh web`，打开“资源 Gallery”，填写共享服务地址、姓名与接入码。之后身份保存在本机 `~/.dsh/gallery/access.json`（0600），界面不读取或显示身份凭证。可以用 DSH Host 配置的 `serverUrl` 或环境变量 `DSH_GALLERY_URL` 锁定服务地址。

丢失本机身份时，维护者核实身份后重新发放恢复码：

```bash
node scripts/gallery.mjs issue-code --database /srv/gallery/gallery.sqlite --subject EXISTING_SUBJECT --output /secure/recovery.json
```

恢复码保留原 subject，兑换后撤销原凭证。退出本机身份不会删除资源；再次接入应使用恢复码，否则新 subject 无法编辑原资源。接入码与凭证应作为秘密保管，不放入资源文件或 Git。

## 使用

选择四类资源之一，上传文件、文件夹或导出的 Gallery JSON 包；也可以直接创建文本文件。填写名称、描述、标签后“保存并共享”。所有已接入成员能查看、搜索、下载和引用；作者能编辑，服务端对每次写入校验归属与并发修改。

每个资源最多 100 个文件、总计 5 MiB，支持 UTF-8 和 base64。`metadata` 保存扩展配置，`references` 保存 `{id,digest?}` 引用。类型创建后不可更改。MCP 配置存放变量名称与模板，执行凭据由使用方配置。Gallery 只存储资源，不执行脚本、安装 Skill 或启动 MCP。

## 编排插件接入

同一个 DSH 宿主可调用 `ctx.gallery.listResources()`、`getResource(id)`、`resolveReference({id,digest?})`、`getSnapshot({id,digest?})`。独立进程使用 `dsh-plugin-gallery/sdk` 导出的 `GalleryClient`。见 [接口说明](docs/integration.md)。

没有历史版本服务：引用只含 ID 时读取当前内容；携带 digest 时若内容已变化返回 409。编排插件应在运行开始时保存 `getSnapshot()` 的内容，以保持本次运行一致。内部 revision 仅用于防止并发覆盖，不是可恢复的资源版本。

## 从 v0.2 升级

先备份并停止旧 Gallery 服务。在**尚未创建共享数据库**时导入原本地库：

```bash
node scripts/gallery.mjs import-local --from "$HOME/.dsh/gallery/gallery.sqlite" --database "$HOME/.dsh/gallery/shared/gallery.sqlite"
```

导入使用 SQLite backup，包含 WAL 中已提交的数据，拒绝覆盖已有目标。首次打开副本时先创建独立迁移备份，再迁移至 schema v3。资源 ID、当前内容与附件保留；旧资源和历史版本归档在 `legacy_*` 表，不再提供历史 API。原库不修改。

旧单用户库无法证明作者，迁移后的资源可共享读取但不可编辑。维护者核实作者并让其完成首次身份接入后，可以**仅对无主资源**执行：

```bash
node scripts/gallery.mjs assign-owner --database /srv/gallery/gallery.sqlite --resource RESOURCE_ID --subject VERIFIED_SUBJECT
```

这个命令不允许重新分配已有归属。不会把旧资源默认分给第一个接入者。旧 `connection.json` 与管理员凭据不会作为新身份凭证使用。v0.2 的 `GalleryReader`、版本接口和本地存储 API 已移除，消费插件需改用新接口。

## 开发

```bash
npm ci
npm run build
npm run check
npm test
npm pack
```

权限、共享 HTTP API、摘要变化、单次兑换、恢复撤销、租户隔离、旧库备份与迁移均有自动化测试。存储契约见 [存储说明](docs/storage.md)。当前实现使用单服务 SQLite；前端通过稳定 HTTP/SDK 契约访问，之后替换数据库主要影响服务端适配器与数据迁移。
