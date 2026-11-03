#!/usr/bin/env node
import { resolve } from "node:path";
import { writeFileSync, existsSync } from "node:fs";
import { SqliteGalleryStore } from "../src/store.mjs";
const option = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1];
};
if (process.argv[2] !== "init") {
  console.error(
    "Usage: dsh-gallery-admin init --database PATH --name NAME [--credentials FILE]",
  );
  process.exit(1);
}
const credentialsFile = option("--credentials", null);
if (credentialsFile && existsSync(credentialsFile)) {
  console.error("凭据文件已存在，请选择新路径；尚未创建管理员。");
  process.exit(1);
}
const store = new SqliteGalleryStore(
  resolve(option("--database", ".data/gallery.sqlite")),
);
try {
  const result = store.bootstrap(option("--name", "管理员"));
  const file = option("--credentials", null);
  if (file) {
    writeFileSync(file, JSON.stringify(result, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    console.log(`管理员已创建，凭据写入 ${file}`);
  } else console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  store.close();
}
