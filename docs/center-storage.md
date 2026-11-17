# PostgreSQL 中心资源库（0.26.0）

中心服务只存储资源，执行仍在各自 DSH / TeamFlow。所有成员可查看、导出和使用资源；只有创建者的独立身份可以编辑、删除自己的资源。检查同时发生在列表/详情权限标记与服务端写入事务内。

## 服务器：开放 HTTPS 8088

已执行过 `scripts/install-postgres.sh` 的服务器，在更新后的 Gallery 仓库根目录执行：

```bash
git pull
sudo bash scripts/install-center.sh --public-host 109.105.132.53 --public-port 8088
```

需要 Docker Compose >= 2.24.4。脚本保留数据库数据卷和密码，在 Docker 内网连接 `postgres:5432`；不修改原来的 `compose.yaml`，通过覆盖配置移除数据库的宿主机端口映射，再由 HTTPS 网关使用 8088。因此 8088 从 PostgreSQL 入口变为 Gallery 服务入口，不需要对外开放数据库权限。其他端口配置（例如 DSH 网页）保持原样。

脚本自动生成和保存 HTTPS CA，导出公开根证书 `/opt/gallery-db/gallery-center-ca.crt`。此证书不是密钥，可以分发给成员；不要分发 CA 私钥或 Docker TLS 数据卷。防火墙/云安全组需允许所需客户端访问 TCP 8088，脚本不会修改防火墙。

接入密钥仍位于 `/opt/gallery-db/center.env` 的 `GALLERY_API_TOKEN`。查询：

```bash
sudo grep '^GALLERY_API_TOKEN=' /opt/gallery-db/center.env
```

重复执行会保留接入密钥、加密密钥、证书及资源数据。对外地址保存在 `public.env`，以后不带参数执行也沿用此地址。`--local-only` 明确切回本机 API，并移除网关容器（保留证书卷）。仅本机连接时可继续使用 `http://127.0.0.1:8090`。

## 每个用户的 DSH

双方都更新插件到 **0.26.0** 并重启 DSH，在 Gallery「存储设置」中：

1. 填写自己的显示用户名。
2. 选择中心服务，地址填 **`https://109.105.132.53:8088`**。
3. 首次填写共享接入密钥。
4. 将管理员提供的 `gallery-center-ca.crt` 下载到浏览器所在电脑，在「服务器证书」上传。
5. 点击「检查存储」，成功后点击「完成」。

证书上传后仅由当前中心连接使用，不关闭 HTTPS 校验，也不需要修改系统证书或 Node 启动环境变量。证书必须与服务器实际提供的证书匹配。若已有受信任的公司 HTTPS 反向代理，可填写其 HTTPS 地址，证书上传留空。

页面可以在另一台电脑打开；真正连接中心服务的是 DSH 宿主。

## 身份和权限

- 共享接入密钥仅用于接入检查和首次注册，不再能直接读写资源，也不是管理员万能密钥。
- 首次保存连接时，中心为该 DSH 生成随机 userId 和独立用户凭证。中心数据库只存用户凭证的 SHA-256 哈希；明文凭证只保存在该 DSH 的 `gallery/storage.json`（0600），不由设置接口回传页面。
- `gallery_users` 保存用户 ID、显示名称、凭证哈希、创建时间。资源由服务端写入 `creator.userId`，不信任客户端传入的创建者 ID。用户名相同或修改显示名称，都不会改变资源归属。
- A、B 可读取和使用彼此四类资源，包括保存的 MCP 认证；A 不能编辑/删除 B 的资源，B 也不能编辑/删除 A 的资源。直接调用 HTTP 接口同样返回 403。
- `scope=mine` 按稳定用户 ID 筛选；普通列表和详情的 canEdit/canDelete 由服务器按当前身份计算。
- `gallery_audit` 事务性记录创建、修改、删除的操作者 ID、资源 ID、动作和时间。调用次数继续使用 usageId 去重，不授予任何编辑权限。
- 重启 DSH、切换到内部存储再切回、重新填写同一服务的接入密钥，都会保留原有独立身份。

**当前身份对应独立的 DSH 数据目录，不是公司 SSO 账号。** 两人应使用各自的 DSH / DSH_HOME，不要互相复制 `gallery/storage.json`；复制文件等同于共享身份。请备份自己的身份文件，丢失后不能仅凭同名用户名找回归属。

## 从 0.25.0 升级

插件与中心服务需一起升级。旧客户端只有共用密钥，升级后不能继续直接读写中心资源；需更新插件并重新保存中心连接，自动建立独立身份。

旧资源没有可信的 userId，升级后保留、可查看和使用，但默认只读。不会按用户名自动认领，以免同名用户接管他人的数据。管理员可在服务器终端查看身份列表，并将**全部未归属旧资源**明确分配给指定身份：

```bash
cd /opt/gallery-db
sudo docker compose --env-file .env --env-file center-build.env \
  -f compose.yaml -f center.compose.yaml exec center node scripts/center-users.mjs list
```

确认目标 userId 后，将末尾命令改为 `node scripts/center-users.mjs assign-legacy <userId>`。只影响没有归属的旧资源，不转移已有归属；会增加 revision 并写入审计记录。这是服务器管理员操作，不开放给共享接入密钥持有人。

## 存储和运维

- 内部与中心库独立，切换不自动迁移或合并资源；可使用 Gallery JSON 导入导出。
- 第一版每个完整资源包存为一个 PostgreSQL JSONB 行，沿用 100 文件、5 MiB 限制；暂不保存历史版本或拆分对象存储。
- 编辑/删除使用 revision 和行锁，防止并发覆盖；断线报错，不静默写回内部存储。
- MCP 认证以 AES-256-GCM 加密保存，普通详情和列表不返回明文。成员宿主运行接口可读取并使用这些认证，不提供每用户 MCP 密钥隔离。
- 中心 stdio MCP 默认不自动执行，仍需在各自 DSH 的存储设置明确允许；HTTP MCP 沿用原有运行方式。
- 中心 MCP 变更最多约 30 秒在其他 DSH 刷新，Skill 目录定期失效；页面刷新可读取其他人的更新。
- 数据库备份需同时保存 `center.env`，丢失加密密钥会无法解密 MCP 认证。对外部署还需备份 TLS 数据卷；成员需分别备份自己的 DSH 身份文件。

查看服务日志：

```bash
cd /opt/gallery-db
sudo docker compose --env-file .env --env-file center-build.env \
  -f compose.yaml -f center.compose.yaml logs --tail=50 center gateway
```

开发验证使用 `GALLERY_TEST_DATABASE_URL` 执行 `node --test test/center.test.mjs`。测试创建独立随机 schema 并清理，不清空已有资源表；测试账号需有创建 schema 权限。
