# 连接 PostgreSQL 中心存储

适用于已经使用 `scripts/install-postgres.sh` 部署数据库的服务器。中心服务只管理资源，不执行 Skill、Agent、MCP 或 Workflow；执行仍由各自 DSH 和 TeamFlow 负责。

## DSH 和数据库在同一台服务器

更新 Gallery 仓库后，在仓库根目录执行：

```bash
sudo bash scripts/install-center.sh
```

脚本会构建并启动中心服务，自动创建资源表。它复用 `/opt/gallery-db` 中的数据库和密码，通过 Docker 内网的 `postgres:5432` 连接，不修改现有数据库端口；宿主机端口改为 `8088` 也不受影响。服务只监听本机 `127.0.0.1:8090`。

查看插件所需的访问密钥（不要对外分享）：

```bash
sudo grep '^GALLERY_API_TOKEN=' /opt/gallery-db/center.env
```

更新安装的 Gallery 插件到 0.25.0 或以上，重启 DSH 并刷新浏览器。进入 Gallery 的「存储设置」：

1. 选择「中心服务」。
2. 服务地址填写 `http://127.0.0.1:8090`，访问密钥填写上述等号后面的值，不加 `Bearer`。
3. 点击「检查存储」，成功后点击「完成」。

这里填写中心服务端口 `8090`，不是 PostgreSQL 的 `8088`。该地址以 DSH 宿主为准；浏览器可以在另一台电脑使用。若 DSH 本身也运行在容器中，`127.0.0.1` 指 DSH 容器，需要另行配置网络和 HTTPS 服务地址。

## 资源行为

- 内部存储与中心存储独立。切换不会上传、删除、合并或覆盖已有数据；需要迁移的资源先导出 Gallery JSON，再切换并导入。
- 四类资源、文本和二进制附件均支持保存和读取，单个资源沿用 100 文件、5 MiB 限制。
- 第一版将完整资源包存入 PostgreSQL JSONB，每个资源独立一行。尚未拆分对象存储、保留历史版本或提供个人账号权限。
- 保存和删除使用 revision 检测冲突；累计调用次数使用数据库行锁和使用标识去重。
- 创建者取自当前 DSH 的 Gallery 用户名，是展示信息，不是服务端登录身份。
- 共用访问密钥的所有 DSH 都能读取、修改、删除资源，并使用中心保存的 MCP 认证；这是可信团队共用资源库，不是互相隔离的多租户服务。
- MCP 密钥在数据库中使用 AES-256-GCM 加密；普通详情和列表不返回明文，受认证的宿主运行接口在执行需要时读取。中心资源可以在所有持有访问密钥的宿主上使用这些认证。
- 中心 stdio MCP 默认不在 DSH 自动执行。需要使用时，在该 DSH 存储设置里明确勾选「允许中心 stdio MCP 在此 DSH 执行本机命令」。只对可信资源作者开启；HTTP MCP 沿用原有运行方式。
- 中心 MCP 变更最多约 30 秒在其他 DSH 刷新；Skill 目录也会定期失效并重读。页面可刷新查看其他宿主的更新。
- 连接失败会报错，不静默写回内部存储。可以打开存储设置切回内部存储。

## 运维

数据库继续使用原来的持久化卷。中心服务配置和加密密钥保存在 `/opt/gallery-db/center.env`，访问密钥与数据库密码不同。插件访问密钥只保存在宿主的 `gallery/storage.json`（0600），不会由设置接口回传到页面。

**数据库备份必须同时保留 `center.env`。丢失加密密钥会导致已有 MCP 认证无法解密。** 脚本重复执行保留既有密钥，不会重置资源。使用同一脚本可重新构建并更新服务。

查看中心服务日志：

```bash
cd /opt/gallery-db
sudo docker compose --env-file .env --env-file center-build.env \
  -f compose.yaml -f center.compose.yaml logs --tail=50 center
```

其他服务器接入时，在中心服务前配置 HTTPS 反向代理到 `127.0.0.1:8090`，并在插件填写 HTTPS 域名。不要开放数据库公网端口。当前 SDK 只允许远程 HTTPS，本机允许 HTTP。

## 开发验证

执行 `npm test` 可运行普通测试。真实 PostgreSQL 集成测试通过 `GALLERY_TEST_DATABASE_URL` 指定测试数据库后执行：

```bash
GALLERY_TEST_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/gallery_test \
  node --test test/center.test.mjs
```

测试创建独立随机 schema 并在结束后删除，不清空已有资源表。测试账号需要创建 schema 的权限。
