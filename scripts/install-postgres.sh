#!/usr/bin/env bash
# Database preparation; run install-center.sh next to connect Gallery.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 sudo bash scripts/install-postgres.sh 执行。" >&2
  exit 1
fi

DIR=/opt/gallery-db
if [ -e "$DIR/compose.yaml" ] || [ -e "$DIR/.env" ]; then
  echo "检测到已有配置：$DIR，停止操作，避免覆盖。" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "自动安装 Docker 仅支持 Ubuntu / Debian，请先手动安装 Docker 和 Compose 插件。" >&2
    exit 1
  fi
  apt-get update
  apt-get install -y curl ca-certificates
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl -fsSL https://get.docker.com -o "$installer"
  sh "$installer"
fi

systemctl enable --now docker
if ! docker compose version >/dev/null 2>&1; then
  echo "缺少 Docker Compose 插件，请先安装后重新执行。" >&2
  exit 1
fi

mkdir -p "$DIR"
chmod 700 "$DIR"
cd "$DIR"
umask 077
PASSWORD=$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')
printf 'POSTGRES_PASSWORD=%s\n' "$PASSWORD" > .env

cat > compose.yaml <<'YAML'
services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_DB: gallery
      POSTGRES_USER: gallery
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - gallery_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gallery -d gallery"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  gallery_data:
YAML

docker compose up -d
for i in $(seq 1 30); do
  if docker compose exec -T postgres psql -U gallery -d gallery \
    -c 'SELECT 1' >/dev/null 2>&1; then
    echo ""
    echo "数据库安装成功"
    echo "地址：127.0.0.1:5432（仅本机可连接）"
    echo "数据库：gallery"
    echo "用户名：gallery"
    echo "密码保存在：$DIR/.env"
    echo "数据保存在 Docker 持久化卷中，请定期备份。"
    exit 0
  fi
  sleep 2
done

echo "数据库尚未就绪，启动日志如下：" >&2
docker compose logs --tail=40 postgres
exit 1
