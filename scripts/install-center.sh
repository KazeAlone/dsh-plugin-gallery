#!/usr/bin/env bash
# One-command intranet deployment; reuses existing PostgreSQL data and identities.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 sudo bash scripts/install-center.sh 执行。" >&2
  exit 1
fi
DIR=${GALLERY_INSTALL_DIR:-/opt/gallery-db}
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PUBLIC_HOST=''
PUBLIC_PORT=8088
BIND=0.0.0.0
REBUILD=false
if [ -f "$DIR/public.env" ]; then
  PUBLIC_HOST=$(sed -n 's/^GALLERY_PUBLIC_HOST=//p' "$DIR/public.env")
  PUBLIC_PORT=$(sed -n 's/^GALLERY_PUBLIC_PORT=//p' "$DIR/public.env")
fi
while [ "$#" -gt 0 ]; do
  case "$1" in
    --public-host) [ "$#" -ge 2 ] || exit 1; PUBLIC_HOST=$2; shift 2 ;;
    --public-port|--port) [ "$#" -ge 2 ] || exit 1; PUBLIC_PORT=$2; shift 2 ;;
    --local-only) BIND=127.0.0.1; PUBLIC_HOST=127.0.0.1; shift ;;
    --rebuild) REBUILD=true; shift ;;
    *) echo "用法：sudo bash scripts/install-center.sh [--port 8088] [--public-host IP或域名] [--local-only] [--rebuild]" >&2; exit 1 ;;
  esac
done
if [[ ! "$PUBLIC_PORT" =~ ^[0-9]{1,5}$ ]]; then echo "端口无效" >&2; exit 1; fi
PUBLIC_PORT=$((10#$PUBLIC_PORT))
if [ "$PUBLIC_PORT" -lt 1024 ] || [ "$PUBLIC_PORT" -gt 65535 ]; then
  echo "对外端口须为 1024–65535。" >&2; exit 1
fi
if [ -n "$PUBLIC_HOST" ] && { [[ ! "$PUBLIC_HOST" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || [ "${#PUBLIC_HOST}" -gt 253 ]; }; then
  echo "服务器地址仅支持 IPv4 或域名，不要填写协议和端口。" >&2; exit 1
fi
if [ ! -f "$REPO/deploy/center.Dockerfile" ]; then
  echo "请从完整的 Gallery Git 仓库执行此脚本。" >&2; exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "自动安装 Docker 仅支持 Ubuntu / Debian，请先安装 Docker 和 Compose 插件。" >&2; exit 1
  fi
  apt-get update
  apt-get install -y curl ca-certificates
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl -fsSL https://get.docker.com -o "$installer"
  sh "$installer"
fi
if ! docker info >/dev/null 2>&1; then systemctl enable --now docker; fi
if ! docker compose version >/dev/null 2>&1; then
  echo "缺少 Docker Compose 插件，请先安装后重新执行。" >&2; exit 1
fi

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"
cd "$DIR"
# Keep the same Compose project directory and volume key as the previous installer.
# Never remove a data volume or regenerate an existing database/encryption password.
if [ -f compose.yaml ] && [ ! -s .env ]; then
  echo "已有部署缺少 .env，请恢复原数据库密码后重试。" >&2; exit 1
fi
if [ -f center.compose.yaml ] && [ ! -s center.env ]; then
  echo "已有中心部署缺少 center.env，请恢复原加密密钥后重试。" >&2; exit 1
fi
BACKUP="backups/$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$BACKUP"
for file in compose.yaml center.compose.yaml .env center.env center-build.env public.env; do
  if [ -f "$file" ]; then cp -p "$file" "$BACKUP/"; fi
done
if [ ! -e .env ]; then
  PASSWORD=$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')
  printf 'POSTGRES_PASSWORD=%s\n' "$PASSWORD" > .env
fi
if ! grep -Eq '^POSTGRES_PASSWORD=.+$' .env; then
  echo ".env 缺少数据库密码，请恢复后重试。" >&2; exit 1
fi
if [ ! -e center.env ]; then
  ENCRYPTION_KEY=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
  printf 'GALLERY_ENCRYPTION_KEY=%s\n' "$ENCRYPTION_KEY" > center.env
fi
if ! grep -Eq '^GALLERY_ENCRYPTION_KEY=[a-fA-F0-9]{64}$' center.env; then
  echo "center.env 缺少原加密密钥，请恢复后重试，避免已有 MCP 认证无法解密。" >&2; exit 1
fi
# The shared enrollment key becomes optional; existing individual tokens stay valid.
sed -i '/^GALLERY_OPEN_ENROLLMENT=/d' center.env
printf 'GALLERY_OPEN_ENROLLMENT=true\n' >> center.env
chmod 600 .env center.env
printf 'GALLERY_BUILD_CONTEXT=%s\n' "$REPO" > center-build.env
if [ -z "$PUBLIC_HOST" ]; then
  PUBLIC_HOST=$(hostname -I 2>/dev/null | awk '{print $1}')
  PUBLIC_HOST=${PUBLIC_HOST:-127.0.0.1}
fi
printf 'GALLERY_PUBLIC_HOST=%s\nGALLERY_PUBLIC_PORT=%s\n' "$PUBLIC_HOST" "$PUBLIC_PORT" > public.env
cat > compose.yaml <<'YAML'
services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_DB: gallery
      POSTGRES_USER: gallery
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - gallery_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gallery -d gallery"]
      interval: 2s
      timeout: 3s
      retries: 30
      start_period: 5s
volumes:
  gallery_data:
YAML
cat > center.compose.yaml <<YAML
services:
  center:
    image: dsh-gallery-center:local
    build:
      context: \${GALLERY_BUILD_CONTEXT}
      dockerfile: deploy/center.Dockerfile
    restart: unless-stopped
    env_file:
      - center.env
    environment:
      DATABASE_URL: postgresql://gallery:\${POSTGRES_PASSWORD}@postgres:5432/gallery
    ports:
      - "${BIND}:${PUBLIC_PORT}:8090"
    depends_on:
      postgres:
        condition: service_healthy
YAML
compose() { docker compose --env-file .env --env-file center-build.env -f compose.yaml -f center.compose.yaml "$@"; }
# Skip even the image build when the center source is unchanged. Docker also caches
# the small pg-only dependency layer when source changes.
FINGERPRINT=$(cd "$REPO" && find src deploy/center scripts/center.mjs scripts/center-users.mjs deploy/center.Dockerfile -type f -not -path '*/node_modules/*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d ' ' -f 1)
if [ "$REBUILD" = true ] || [ "$(cat center-build.sha256 2>/dev/null || true)" != "$FINGERPRINT" ] || ! docker image inspect dsh-gallery-center:local >/dev/null 2>&1; then
  echo "正在准备中心服务镜像（首次需要下载 Node、PostgreSQL 镜像和依赖）…"
  compose build center
  printf '%s\n' "$FINGERPRINT" > center-build.sha256
else
  echo "中心服务代码未变，直接复用镜像。"
fi
compose up -d --remove-orphans postgres center
READY=false
for i in $(seq 1 30); do
  if compose exec -T center node -e "fetch('http://127.0.0.1:8090/v2/health',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    READY=true; break
  fi
  sleep 1
done
if [ "$READY" != true ]; then
  echo "中心服务尚未就绪，请查看日志：" >&2
  compose logs --tail=40 postgres center
  exit 1
fi
cat > gallery-center <<'SH'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
if [ "$#" -eq 0 ]; then set -- ps; fi
docker compose --env-file .env --env-file center-build.env -f compose.yaml -f center.compose.yaml "$@"
SH
chmod 700 gallery-center
echo "Gallery 中心服务部署成功"
echo "插件中只需填写：${PUBLIC_HOST}:${PUBLIC_PORT}"
echo "服务地址：http://${PUBLIC_HOST}:${PUBLIC_PORT}（公司内网 HTTP）"
echo "无需填写接入密钥、无需上传证书；每个 DSH 自动保存独立身份。"
echo "数据库仅在 Docker 内网使用，对外只开放 TCP ${PUBLIC_PORT}；请放行该端口。"
echo "以后重启：sudo $DIR/gallery-center up -d"
echo "查看日志：sudo $DIR/gallery-center logs --tail=50 center"
echo "旧配置备份：$DIR/$BACKUP；请另行备份数据库和 center.env。"
