#!/usr/bin/env node
import { parseArgs } from "node:util";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { writeFileSync, chmodSync } from "node:fs";
import { SqliteGalleryStore } from "../src/store.mjs";
import { importLocalDatabase } from "../src/import-local.mjs";
import { createGalleryServer } from "../src/server.mjs";
import { DevelopmentIdentityProvider } from "../src/identity.mjs";
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    database: { type: "string" },
    from: { type: "string" },
    host: { type: "string", default: "127.0.0.1" },
    port: { type: "string", default: "4318" },
    tenant: { type: "string", default: "default" },
    subject: { type: "string" },
    ttl: { type: "string", default: "86400" },
    output: { type: "string" },
    resource: { type: "string" },
    "dev-auth": { type: "boolean", default: false },
  },
});
const command = positionals[0];
if (
  !["serve", "issue-code", "assign-owner", "import-local"].includes(command)
) {
  console.log(
    "Usage: dsh-gallery import-local --from OLD_DB | serve [--dev-auth] | issue-code --output /secure/code.json | assign-owner --resource ID --subject SUBJECT\nOptions: --database PATH --host HOST --port PORT --tenant default --ttl 86400",
  );
  process.exit(command ? 1 : 0);
}
const database = resolve(
  values.database ??
    join(
      process.env.DSH_HOME ?? join(homedir(), ".dsh"),
      "gallery/shared/gallery.sqlite",
    ),
);
if (command === "import-local") {
  if (!values.from) throw new Error("需要 --from 原数据库路径");
  await importLocalDatabase(resolve(values.from), database);
  console.log(
    "已复制原数据库的一致快照；原文件保留，共享库将在首次打开时迁移。",
  );
  process.exit(0);
}
const store = new SqliteGalleryStore(database);
try {
  if (command === "serve") {
    const server = createGalleryServer({
      store,
      ...(values["dev-auth"]
        ? { identityProvider: new DevelopmentIdentityProvider(store) }
        : {}),
    });
    if (values["dev-auth"])
      console.warn("Gallery 开发认证已启用：无需接入码，请仅用于开发环境。");
    server.listen(Number(values.port), values.host, () =>
      console.log(
        `Gallery service listening on ${values.host}:${server.address().port}`,
      ),
    );
    for (const event of ["SIGINT", "SIGTERM"])
      process.once(event, () =>
        server.close(() => {
          store.close();
          process.exit(0);
        }),
      );
    server.on("error", (e) => {
      console.error(e.message);
      store.close();
      process.exitCode = 1;
    });
  } else if (command === "issue-code") {
    if (!values.output)
      throw new Error(
        "请使用 --output 指定安全的接入码文件；文件应仅交给对应成员",
      );
    const result = store.issueCode({
      tenantId: values.tenant,
      subject: values.subject,
      ttlSeconds: Number(values.ttl),
    });
    writeFileSync(
      resolve(values.output),
      JSON.stringify(result, null, 2) + "\n",
      { mode: 0o600, flag: "wx" },
    );
    chmodSync(resolve(values.output), 0o600);
    store.close();
    console.log(
      "接入码已写入指定文件（权限 0600），请通过可信渠道交给对应成员。",
    );
  } else {
    console.log(
      JSON.stringify(
        store.assignUnowned(values.resource, {
          subject: values.subject,
          tenantId: values.tenant,
        }),
      ),
    );
    store.close();
  }
} catch (e) {
  console.error(e.message);
  try {
    store.close();
  } catch {}
  process.exitCode = 1;
}
