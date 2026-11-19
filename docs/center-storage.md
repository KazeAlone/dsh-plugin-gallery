# 公司内网中心资源库

中心只存储资源，不运行 Agent、MCP 或 Workflow。所有成员可查看和使用资源；每个 DSH 自动保存独立身份，只有创建者可以编辑、删除自己的资源。

## 服务器一键部署

在 Linux 服务器上的 Gallery 仓库根目录执行：

```bash
git pull --ff-only origin main
sudo bash scripts/install-center.sh --port 8088
```

**不需要先运行数据库安装脚本。** 这条命令负责准备 Docker（Ubuntu / Debian 可自动安装）、PostgreSQL 和 Center，默认对公司内网开放 HTTP 8088。数据库只在 Docker 网络中使用，不映射宿主机端口；不再部署 Caddy，也不需要分发密钥或证书。防火墙/安全组只需放行客户端到服务器的 TCP 8088。

脚本会显示一个本机 IP；有多个网卡或需要指定显示地址时，可加 `--public-host 109.105.132.53`。该参数用于显示接入地址，不影响默认监听全部网卡。首次需要下载容器镜像和少量依赖，耗时取决于服务器网络；以后代码未变时直接复用镜像，不再构建。Center 只安装 PostgreSQL 驱动，等待数据库健康后才启动。

本方案面向公司可信内网，HTTP 不加密传输，能够访问该端口的客户端可注册并读取共享资源。公网访问或需要加密时，应在前面配置公司 HTTPS 网关。插件仍支持 HTTPS，并保留已有连接的证书配置。

## 每个用户的 DSH

更新 Gallery 到最新 main（免密接入要求 0.29.0+）并重启 DSH，在「存储设置」选择中心服务，填写：

```text
109.105.132.53:8088
```

点击「检查存储」，成功后点击「完成」。无需填写共享接入密钥、无需上传证书。用户名默认使用当前 DSH 服务器系统用户名，可以自行修改显示名称；即使重名，也不会共用编辑权限。真正连接中心的是 DSH 宿主，不是浏览器。

第一次保存时自动注册独立身份。以后重启、切换存储、再次保存同一地址都会沿用原身份。检查连接不会提前创建用户。内部库和中心库独立，切换不自动迁移资源，可使用 Gallery JSON 导入导出。

## 从原来的两步部署升级

在**原服务器**运行上面同一个脚本即可。继续使用 `/opt/gallery-db` 和原 Compose 项目、`gallery_data` 数据卷；数据库密码、MCP 加密密钥、用户凭证和已有资源全部保留。旧配置在 `/opt/gallery-db/backups/` 下自动备份。旧 HTTPS 网关容器会被移除，原证书卷保留。

客户端将原地址 `https://109.105.132.53:8088` 改为 `109.105.132.53:8088`，同一主机和端口上的协议切换会保留原身份及资源归属。不要删除或互相复制 DSH 的 `gallery/storage.json`。如果同时换了主机或端口，应先备份身份文件，并单独安排身份迁移，避免建立新身份。

新插件与中心需一起升级。若旧中心仍要求密钥，新插件会提示在服务器运行新版部署脚本。

## 日常操作

脚本会创建一个管理入口，不必再拼接两个 Compose 配置文件：

```bash
# 查看状态
sudo /opt/gallery-db/gallery-center ps

# 查看日志
sudo /opt/gallery-db/gallery-center logs --tail=50 center

# 停止、重启
sudo /opt/gallery-db/gallery-center stop
sudo /opt/gallery-db/gallery-center restart

# 服务器重启后容器会自动启动；也可以手动启动
sudo /opt/gallery-db/gallery-center up -d
```

升级 Center 时，在源码仓库 `git pull --ff-only origin main` 后重新执行 `sudo bash scripts/install-center.sh`；沿用已保存的端口。需要重新构建镜像时加 `--rebuild`。仅本机使用时加 `--local-only`。这些操作都不删除数据库卷。

需要备份数据库和 `/opt/gallery-db/center.env`；后者包含 MCP 认证的加密密钥，丢失后无法解密已有认证。每个用户还需备份自己的 DSH `gallery/storage.json` 身份文件。配置备份不是数据库备份。

## 身份和权限

- 免共享接入密钥不等于共用身份。Center 为每个 DSH 生成随机 userId 和用户凭证，自动保存在该 DSH 的 `gallery/storage.json`（0600），不回传到浏览器。数据库只存凭证哈希。
- 未注册的客户端只能检查服务和注册身份，不能直接读写资源。无效的旧身份不会被悄悄替换成新身份。
- 资源归属由服务端按凭证写入，不信任客户端提供的用户名或 userId。A、B 不能修改或删除彼此资源；改成相同用户名也不会获得权限。
- 资源更新/删除保留 revision 并发检查、事务及审计记录。调用次数使用 usageId 去重。
- 当前身份对应独立的 DSH 数据目录，尚未接公司 SSO。身份文件丢失后，不能仅凭同名用户名找回归属。
- MCP 认证在数据库中使用 AES-256-GCM 加密；成员 DSH 可读取并使用共享 MCP 认证。中心 stdio MCP 仍需在各 DSH 设置中明确允许。

原来没有可信 userId 的旧资源不会按用户名自动认领。管理员可在服务器查看身份，再明确分配全部未归属旧资源：

```bash
sudo /opt/gallery-db/gallery-center exec center node scripts/center-users.mjs list
sudo /opt/gallery-db/gallery-center exec center node scripts/center-users.mjs assign-legacy <userId>
```

此操作不转移已有归属，并写入审计记录。

自建部署仍支持 `GALLERY_API_TOKEN` 加共享注册密钥的旧方式；一键脚本通过 `GALLERY_OPEN_ENROLLMENT=true` 开启免密注册。插件设置页已简化，旧连接保存在宿主上的凭证和证书仍可继续使用。

## 开发验证

`GALLERY_TEST_DATABASE_URL=... node --test test/center.test.mjs` 在随机独立 schema 中验证真实 PostgreSQL、跨用户权限、MCP 加密和免密接入，测试后清理，不清空应用数据。`node --test test/center-installer.test.mjs` 验证新装、旧部署升级、镜像复用及配置保留。
