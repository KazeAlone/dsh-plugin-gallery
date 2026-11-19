import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";

function setup(t) {
  const root = mkdtempSync(join(tmpdir(), "gallery-installer-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, "bin"),
    dir = join(root, "deployment"),
    log = join(root, "docker.log");
  mkdirSync(bin);
  writeFileSync(join(bin, "id"), "#!/bin/sh\necho 0\n", { mode: 0o755 });
  writeFileSync(
    join(bin, "docker"),
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync(process.env.TEST_DOCKER_LOG, JSON.stringify(process.argv.slice(2))+'\\n');
`,
    { mode: 0o755 },
  );
  const run = (...args) =>
    spawnSync("bash", [resolve("scripts/install-center.sh"), ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: bin + ":" + process.env.PATH,
        GALLERY_INSTALL_DIR: dir,
        TEST_DOCKER_LOG: log,
      },
    });
  return { dir, log, run };
}

test("one-step installer: private DB, one HTTP port, persistent keys and cached restarts", (t) => {
  const { dir, log, run } = setup(t);
  const first = run("--public-host", "109.105.132.53", "--port", "8088");
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /109\.105\.132\.53:8088/);
  const db = parse(readFileSync(join(dir, "compose.yaml"), "utf8"));
  const api = parse(readFileSync(join(dir, "center.compose.yaml"), "utf8"));
  assert.equal(db.services.postgres.ports, undefined);
  assert.deepEqual(db.services.postgres.volumes, [
    "gallery_data:/var/lib/postgresql/data",
  ]);
  assert.deepEqual(api.services.center.ports, ["0.0.0.0:8088:8090"]);
  assert.equal(
    api.services.center.depends_on.postgres.condition,
    "service_healthy",
  );
  assert.equal(api.services.gateway, undefined);
  assert.match(
    readFileSync(join(dir, "center.env"), "utf8"),
    /GALLERY_OPEN_ENROLLMENT=true/,
  );
  assert.ok(existsSync(join(dir, "gallery-center")));
  const password = readFileSync(join(dir, ".env"), "utf8");
  const key = readFileSync(join(dir, "center.env"), "utf8");
  const again = run();
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /直接复用镜像/);
  assert.equal(readFileSync(join(dir, ".env"), "utf8"), password);
  assert.equal(readFileSync(join(dir, "center.env"), "utf8"), key);
  const commands = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(commands.filter((c) => c.includes("build")).length, 1);
  assert.equal(
    commands.some((c) => c.includes("down") || c.includes("--volumes")),
    false,
  );
  const forced = run("--rebuild");
  assert.equal(forced.status, 0, forced.stderr);
  assert.match(forced.stdout, /正在准备中心服务镜像/);
});

test("legacy deployment upgrade keeps passwords, encryption key, volume and old config backup", (t) => {
  const { dir, run } = setup(t);
  mkdirSync(dir);
  const password = "POSTGRES_PASSWORD=legacy-password\n";
  const center =
    "GALLERY_API_TOKEN=" +
    "b".repeat(64) +
    "\nGALLERY_ENCRYPTION_KEY=" +
    "a".repeat(64) +
    "\n";
  writeFileSync(join(dir, ".env"), password);
  writeFileSync(join(dir, "center.env"), center);
  writeFileSync(
    join(dir, "compose.yaml"),
    "services:\n  postgres:\n    ports: ['8088:5432']\n",
  );
  writeFileSync(
    join(dir, "center.compose.yaml"),
    "services:\n  gateway:\n    image: caddy:2\n",
  );
  writeFileSync(
    join(dir, "public.env"),
    "GALLERY_PUBLIC_HOST=109.105.132.53\nGALLERY_PUBLIC_PORT=8088\n",
  );
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(dir, ".env"), "utf8"), password);
  assert.equal(
    readFileSync(join(dir, "center.env"), "utf8"),
    center + "GALLERY_OPEN_ENROLLMENT=true\n",
  );
  const backup = join(dir, "backups", readdirSync(join(dir, "backups"))[0]);
  assert.equal(readFileSync(join(backup, "center.env"), "utf8"), center);
  assert.match(readFileSync(join(backup, "compose.yaml"), "utf8"), /8088:5432/);
  assert.deepEqual(
    parse(readFileSync(join(dir, "center.compose.yaml"), "utf8")).services
      .center.ports,
    ["0.0.0.0:8088:8090"],
  );
});

test("installer refuses invalid ports and missing legacy encryption keys", (t) => {
  const { dir, run } = setup(t);
  assert.notEqual(run("--port", "bad").status, 0);
  assert.equal(existsSync(dir), false);
  mkdirSync(dir);
  writeFileSync(join(dir, "compose.yaml"), "original compose");
  writeFileSync(join(dir, ".env"), "POSTGRES_PASSWORD=keep\n");
  writeFileSync(join(dir, "center.env"), "GALLERY_API_TOKEN=old\n");
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /原加密密钥/);
  assert.equal(
    readFileSync(join(dir, "compose.yaml"), "utf8"),
    "original compose",
  );
});
