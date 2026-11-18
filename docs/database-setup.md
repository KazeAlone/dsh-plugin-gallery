# 一键部署 PostgreSQL

**当前推荐直接使用[中心服务一键部署](center-storage.md)：`sudo bash scripts/install-center.sh --port 8088`，同时准备数据库和 Center，无需先执行本页脚本。** 以下仅保留独立数据库准备方式供旧部署参考。

适用于带有 systemd 的 Ubuntu / Debian 服务器，需要 sudo 权限和外网访问。脚本会在缺少 Docker 时使用 Docker 官方安装脚本安装，并启用 Docker 开机启动。

在下载的 Gallery 仓库根目录执行一次：

```bash
sudo bash scripts/install-postgres.sh
```

脚本自动启动 PostgreSQL 17，创建 `gallery` 数据库和同名用户，生成随机密码。数据库只监听 `127.0.0.1:5432`，不开放公网端口；如果该端口已被占用，启动会失败。

- 配置目录：`/opt/gallery-db`
- 密码文件：`/opt/gallery-db/.env`，仅 root 可读写，请勿提交到 Git。
- 数据目录：Docker 命名卷 `gallery-db_gallery_data`，容器重建后保留。

检测到已有配置时脚本停止，不覆盖密码或配置。如首次安装因网络中断失败，修复网络后可在 `/opt/gallery-db` 执行 `sudo docker compose up -d`；配置未完成时请先检查文件内容。

查看运行状态：

```bash
sudo docker compose --project-directory /opt/gallery-db ps
```

不要使用 `docker compose down -v`，它会删除数据库数据卷。正式存放资源前应配置定期备份并验证恢复；此脚本不包含自动备份或资源业务表结构。
