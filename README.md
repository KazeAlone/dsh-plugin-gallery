# DSH Resource Gallery

运行在 DSH 内的本地资源库，用于管理 **Skill、Agent 描述、MCP 配置和 Workflow 模板**。当前优先完善 Gallery 功能和 UI。

打开「资源 Gallery」即可使用，**无需填写姓名、接入码或 Gallery 身份凭证**。沿用 DSH 自身的宿主访问认证，不增加插件登录流程。

## 安装

要求 Node.js >=24.9、DSH 0.2.1-rc.5。

```bash
npx dsh plugin --profile web add github:KazeAlone/dsh-plugin-gallery --ignore-scripts
```

更新后重启 DSH 并刷新浏览器。仓库包含构建好的客户端。

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

Gallery 只保存和读取资源，不执行脚本、安装 Skill、启动 MCP 或执行 Workflow。当前不提供发布版本、历史回滚和远程同步。

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

首次打开可直接选择默认的「DSH 内部存储」。右上角「存储设置」可添加多个本地资源库、检查存储及切换当前资源库。关闭首次选择会保留并确认默认资源库，无需身份或接入码。

当前仅内部存储可用；GitHub 仓库与中心服务作为后续适配方向展示，暂不可配置或启用。切换只改变当前资源库，不会复制、合并或删除源数据。配置保存在 `gallery/storage.json`；原有 `gallery/resources.json` 自动对应默认库，新增本地库保存于 `gallery/libraries/<libraryId>/resources.json`。

引用增加 `libraryId`，切换当前库后仍可定位原资源。旧引用不含 libraryId 时仍按当前库解析，建议重新获取完整引用。资源迁移、GitHub 授权和中心服务凭据将在对应后端实现时提供。
