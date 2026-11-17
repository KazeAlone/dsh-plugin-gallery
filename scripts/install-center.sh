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
# Keep the original database compose file and its host port mapping unchanged.
# Defaults to local access; use HTTPS reverse proxy for other hosts.
cd "$DIR"
umask 077
if [ ! -e center.env ]; then
  API_TOKEN=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
  ENCRYPTION_KEY=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
  printf 'GALLERY_API_TOKEN=%s\nGALLERY_ENCRYPTION_KEY=%s\n' "$API_TOKEN" "$ENCRYPTION_KEY" > center.env
fi
# Pass the build context through an env file so directory spaces remain valid YAML.
printf 'GALLERY_BUILD_CONTEXT=%s\n' "$REPO" > center-build.env
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

docker compose --env-file .env --env-file center-build.env -f compose.yaml -f center.compose.yaml up -d --build center
for i in $(seq 1 30); do
  if docker compose --env-file .env --env-file center-build.env -f compose.yaml -f center.compose.yaml exec -T center \
    node -e "fetch('http://127.0.0.1:8090/v2/health',{headers:{Authorization:'Bearer '+process.env.GALLERY_API_TOKEN},signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    echo ""
    echo "Gallery 中心服务安装成功"
    echo "插件服务地址：http://127.0.0.1:8090（DSH 与数据库在同一台服务器时）"
    echo "访问密钥保存在：$DIR/center.env 的 GALLERY_API_TOKEN"
    echo "请同时备份数据库和 center.env，加密密钥丢失将无法解密 MCP 认证。"
    exit 0
  fi
  sleep 2
done

echo "中心服务尚未就绪，请查看日志：" >&2
docker compose --env-file .env --env-file center-build.env -f compose.yaml -f center.compose.yaml logs --tail=40 center
exit 1
