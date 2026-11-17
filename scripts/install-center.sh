#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 sudo bash scripts/install-center.sh 执行。" >&2
  exit 1
fi
DIR=/opt/gallery-db
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
if [ ! -f "$DIR/compose.yaml" ] || [ ! -f "$DIR/.env" ]; then
  echo "请先执行 scripts/install-postgres.sh 安装数据库。" >&2
  exit 1
fi
if [ ! -f "$REPO/deploy/center.Dockerfile" ]; then
  echo "请从完整的 Gallery Git 仓库执行此脚本。" >&2
  exit 1
fi
cd "$DIR"
umask 077
PUBLIC_HOST=''
PUBLIC_PORT=8088
if [ -f public.env ]; then
  PUBLIC_HOST=$(sed -n 's/^GALLERY_PUBLIC_HOST=//p' public.env)
  PUBLIC_PORT=$(sed -n 's/^GALLERY_PUBLIC_PORT=//p' public.env)
fi
while [ "$#" -gt 0 ]; do
  case "$1" in
    --public-host) [ "$#" -ge 2 ] || exit 1; PUBLIC_HOST=$2; shift 2 ;;
    --public-port) [ "$#" -ge 2 ] || exit 1; PUBLIC_PORT=$2; shift 2 ;;
    --local-only) PUBLIC_HOST=''; shift ;;
    *) echo "用法：sudo bash scripts/install-center.sh [--public-host IP或域名] [--public-port 8088] [--local-only]" >&2; exit 1 ;;
  esac
done
if [ -n "$PUBLIC_HOST" ]; then
  if [[ ! "$PUBLIC_HOST" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || [ "${#PUBLIC_HOST}" -gt 253 ]; then
    echo "服务器地址仅支持 IPv4 或域名，不要填写协议和端口。" >&2; exit 1
  fi
  if [[ ! "$PUBLIC_PORT" =~ ^[0-9]{1,5}$ ]]; then echo "端口无效" >&2; exit 1; fi
  PUBLIC_PORT=$((10#$PUBLIC_PORT))
  if [ "$PUBLIC_PORT" -lt 1024 ] || [ "$PUBLIC_PORT" -gt 65535 ] || [ "$PUBLIC_PORT" -eq 8090 ]; then
    echo "对外端口须为 1024–65535，且不能占用本机 API 的 8090。" >&2; exit 1
  fi
  # !reset prevents Docker Compose merging the old database port into the public API mapping.
  COMPOSE_VERSION=$(docker compose version --short | sed 's/^v//;s/-.*//')
  if [ "$(printf '%s\n' 2.24.4 "$COMPOSE_VERSION" | sort -V | head -n 1)" != '2.24.4' ]; then
    echo "对外部署需要 Docker Compose >= 2.24.4，请先升级 Compose 插件。" >&2; exit 1
  fi
fi
if [ ! -e center.env ]; then
  API_TOKEN=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
  ENCRYPTION_KEY=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
  printf 'GALLERY_API_TOKEN=%s\nGALLERY_ENCRYPTION_KEY=%s\n' "$API_TOKEN" "$ENCRYPTION_KEY" > center.env
fi
printf 'GALLERY_BUILD_CONTEXT=%s\n' "$REPO" > center-build.env
printf 'GALLERY_PUBLIC_HOST=%s\nGALLERY_PUBLIC_PORT=%s\n' "$PUBLIC_HOST" "$PUBLIC_PORT" > public.env
cat > center.compose.yaml <<'YAML'
services:
  center:
    build:
      context: ${GALLERY_BUILD_CONTEXT}
      dockerfile: deploy/center.Dockerfile
    restart: unless-stopped
    env_file:
      - center.env
    environment:
      DATABASE_URL: postgresql://gallery:${POSTGRES_PASSWORD}@postgres:5432/gallery
    ports:
      - "127.0.0.1:8090:8090"
    depends_on:
      - postgres
YAML
if [ -n "$PUBLIC_HOST" ]; then
  cat >> center.compose.yaml <<YAML
  postgres:
    ports: !reset []
  gateway:
    image: caddy:2
    restart: unless-stopped
    environment:
      NO_PROXY: center,postgres,localhost,127.0.0.1
      no_proxy: center,postgres,localhost,127.0.0.1
    ports:
      - "${PUBLIC_PORT}:${PUBLIC_PORT}"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - center_tls_data:/data
      - center_tls_config:/config
    depends_on:
      - center
volumes:
  center_tls_data:
  center_tls_config:
YAML
  cat > Caddyfile <<CADDY
{
  default_sni ${PUBLIC_HOST}
}
https://${PUBLIC_HOST}:${PUBLIC_PORT} {
  tls internal
  reverse_proxy center:8090
}
CADDY
fi
compose() { docker compose --env-file .env --env-file center-build.env -f compose.yaml -f center.compose.yaml "$@"; }
if [ -n "$PUBLIC_HOST" ]; then
  compose up -d --build --remove-orphans gateway
else
  compose up -d --build --remove-orphans center
fi
READY=false
for i in $(seq 1 30); do
  if compose exec -T center node -e "fetch('http://127.0.0.1:8090/v2/health',{headers:{Authorization:'Bearer '+process.env.GALLERY_API_TOKEN},signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    READY=true; break
  fi
  sleep 2
done
if [ "$READY" != true ]; then
  echo "中心服务尚未就绪，请查看日志：" >&2
  compose logs --tail=40 center
  exit 1
fi
if [ -n "$PUBLIC_HOST" ]; then
  CERT_READY=false
  for i in $(seq 1 30); do
    if compose exec -T gateway test -s "/data/caddy/certificates/local/${PUBLIC_HOST}/${PUBLIC_HOST}.crt" >/dev/null 2>&1 &&
      compose cp gateway:/data/caddy/pki/authorities/local/root.crt ./gallery-center-ca.crt >/dev/null 2>&1; then
      chmod 644 gallery-center-ca.crt
      CERT_READY=true; break
    fi
    sleep 2
  done
  if [ "$CERT_READY" != true ]; then echo "未能导出 HTTPS 证书" >&2; compose logs --tail=40 gateway; exit 1; fi
  echo "插件服务地址：https://${PUBLIC_HOST}:${PUBLIC_PORT}"
  echo "请将 $DIR/gallery-center-ca.crt 下载后，在每个 DSH 的 Gallery 存储设置上传。"
  echo "数据库不再映射宿主机端口，数据卷保持原样；防火墙只需允许所需客户端访问 TCP ${PUBLIC_PORT}。"
else
  echo "插件服务地址：http://127.0.0.1:8090（仅本机）"
fi
echo "Gallery 中心服务安装成功"
echo "首次接入密钥保存在：$DIR/center.env 的 GALLERY_API_TOKEN"
echo "首次连接后，每个 DSH 自动保存独立身份；请勿相互复制 gallery/storage.json。"
echo "请同时备份数据库、center.env 和 HTTPS 的 Docker 数据卷。"
