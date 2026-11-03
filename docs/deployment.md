# 团队部署

当前本机验证地址是 `http://127.0.0.1:4318`。这只是本机开发入口；团队跨电脑共享需要一台成员都能访问的服务器及 HTTPS 地址。

## Docker 示例

```sh
docker build -t dsh-gallery:0.1.0 .
docker volume create dsh-gallery-data
docker run -d --name dsh-gallery --restart unless-stopped \
  -p 127.0.0.1:4318:4318 \
  -v dsh-gallery-data:/data dsh-gallery:0.1.0
docker exec dsh-gallery node scripts/admin.mjs init --database /data/gallery.sqlite --name "团队管理员"
```

Dockerfile 只需要 Node 内置模块，不需下载 npm 运行依赖。若使用 Docker 方式初始化，请将 scripts 目录复制进镜像（本仓库 Dockerfile 已包含）。初始化命令只执行一次，其输出包含管理员令牌。

## HTTPS 反向代理

例如在同一台服务器安装 Caddy，将下面的示例域名替换为实际域名并配置 DNS：

```caddyfile
gallery.team.example {
    reverse_proxy 127.0.0.1:4318
}
```

也可以使用已有 Nginx / 网关终止 TLS。远程地址使用 HTTPS，避免令牌明文传输。浏览器通过各自本机 dsh 代理 Gallery API，不需要开放跨域 CORS。

## 成员接入

1. 管理员的本机 dsh 安装插件，连接 `https://实际域名` 并使用初始化令牌。
2. 在 Gallery 的“成员”页添加成员，使用团队可信渠道发放各自令牌。
3. 每位成员在自己的 dsh 安装同一插件，填写相同 URL 和本人的令牌。
4. 作者保存草稿并发布后，其他成员可以检索和获取该版本。

如没有服务器，也可以先在团队内部网络的一台常开机器上部署 API，并由内部 HTTPS 网关提供访问。不要把各成员各自的 SQLite 当作同一共享库。

## 维护

- 保留 SQLite 数据卷。备份时使用 SQLite backup 机制，或停止服务后复制数据库；不要在写入中只复制主文件而忽略 WAL。
- 重置或停用成员令牌后，旧令牌立即无法访问服务。已发布资源仍保留作者身份和版本历史。
- 更新前备份数据，并运行测试与安装验收。当前数据格式版本为 1。
- Docker / 远程 TLS 部署文件为交付模板，本次只验证本机 Node 服务与两个独立成员客户端，未在远程服务器执行部署。
