import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import { demand, digest, normalizeResource, revision } from "./model.mjs";

function schema(prefix = "") {
  return `CREATE TABLE ${prefix}resources(id TEXT PRIMARY KEY,type TEXT NOT NULL,draft TEXT NOT NULL,revision INTEGER NOT NULL,published_revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE ${prefix}versions(resource_id TEXT NOT NULL REFERENCES ${prefix}resources(id),version INTEGER NOT NULL,snapshot TEXT NOT NULL,digest TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(resource_id,version));
    CREATE TABLE ${prefix}audit(id INTEGER PRIMARY KEY AUTOINCREMENT,resource_id TEXT,action TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL);`;
}

/** Single-user storage. Existing multi-user databases are backed up and migrated atomically. */
export class SqliteGalleryStore {
  constructor(path) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    try {
      if (path !== ":memory:") chmodSync(path, 0o600);
      this.db.exec(
        "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
      );
      const version = this.db.prepare("PRAGMA user_version").get().user_version;
      demand(
        version <= 2,
        409,
        "SCHEMA_TOO_NEW",
        "数据库由更新版本创建，请升级插件",
      );
      const legacy = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='members'",
        )
        .get();
      if (legacy) this.migrate(path);
      else if (
        !this.db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='resources'",
          )
          .get()
      ) {
        this.transaction(() => {
          this.db.exec(schema());
          this.db.exec("PRAGMA user_version=2");
        });
      }
    } catch (e) {
      this.db.close();
      throw e;
    }
  }
  migrate(path) {
    if (path !== ":memory:") {
      this.backupPath = `${path}.before-single-user-${Date.now()}-${randomUUID().slice(0, 8)}.sqlite`;
      this.db.exec(`VACUUM INTO '${this.backupPath.replaceAll("'", "''")}'`);
      chmodSync(this.backupPath, 0o600);
    }
    this.db.exec("PRAGMA foreign_keys=OFF");
    try {
      this.transaction(() => {
        if (
          !this.db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='members'",
            )
            .get()
        )
          return;
        this.db.exec(schema("single_"));
        this.db
          .exec(`INSERT INTO single_resources SELECT id,type,draft,revision,published_revision,created_at,updated_at FROM resources;
          INSERT INTO single_versions SELECT resource_id,version,snapshot,digest,note,created_at FROM versions;
          INSERT INTO single_audit SELECT id,resource_id,action,detail,created_at FROM audit WHERE resource_id IS NOT NULL;
          DROP TABLE versions; DROP TABLE resources; DROP TABLE audit; DROP TABLE members;
          ALTER TABLE single_resources RENAME TO resources;
          ALTER TABLE single_versions RENAME TO versions;
          ALTER TABLE single_audit RENAME TO audit;
          PRAGMA user_version=2;`);
      });
    } finally {
      this.db.exec("PRAGMA foreign_keys=ON");
    }
  }
  close() {
    this.db.close();
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const r = fn();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  event(id, action, detail = {}) {
    this.db
      .prepare(
        "INSERT INTO audit(resource_id,action,detail,created_at) VALUES(?,?,?,?)",
      )
      .run(id, action, JSON.stringify(detail), new Date().toISOString());
  }
  row(id) {
    const r = this.db.prepare("SELECT * FROM resources WHERE id=?").get(id);
    demand(r, 404, "NOT_FOUND", "资源不存在");
    return r;
  }
  latest(id) {
    return this.db
      .prepare(
        "SELECT * FROM versions WHERE resource_id=? ORDER BY version DESC LIMIT 1",
      )
      .get(id);
  }
  summary(r) {
    const latest = this.latest(r.id),
      d = JSON.parse(r.draft);
    return {
      id: r.id,
      type: r.type,
      name: d.name,
      description: d.description,
      tags: d.tags,
      revision: r.revision,
      hasDraft: r.revision !== r.published_revision,
      latestVersion: latest?.version ?? null,
      fileCount: d.files.length,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
  list({ type = "", q = "", scope = "all", limit = 100, offset = 0 } = {}) {
    demand(
      ["all", "drafts", "published"].includes(scope),
      400,
      "INVALID_SCOPE",
      "无效筛选范围",
    );
    demand(
      Number.isInteger(limit) &&
        limit >= 1 &&
        limit <= 100 &&
        Number.isInteger(offset) &&
        offset >= 0,
      400,
      "INVALID_PAGE",
      "分页参数无效",
    );
    const query = String(q).toLocaleLowerCase().slice(0, 200);
    const rows = this.db
      .prepare("SELECT * FROM resources ORDER BY updated_at DESC,id")
      .all();
    const items = rows
      .filter(
        (r) =>
          (!type || r.type === type) &&
          (scope !== "drafts" || r.revision !== r.published_revision) &&
          (scope !== "published" || this.latest(r.id)),
      )
      .map((r) => this.summary(r))
      .filter(
        (r) =>
          !query ||
          [r.name, r.description, ...r.tags]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query),
      );
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    };
  }
  create(input) {
    const d = normalizeResource(input),
      id = randomUUID(),
      now = new Date().toISOString();
    return this.transaction(() => {
      this.db
        .prepare(
          "INSERT INTO resources(id,type,draft,revision,created_at,updated_at) VALUES(?,?,?,1,?,?)",
        )
        .run(id, d.type, JSON.stringify(d), now, now);
      this.event(id, "resource.create");
      return this.get(id);
    });
  }
  get(id) {
    const r = this.row(id),
      s = this.summary(r);
    return {
      ...s,
      draft: JSON.parse(r.draft),
      published: this.latest(id)
        ? this.getVersion(id, this.latest(id).version)
        : null,
    };
  }
  update(id, input, expectedRevision) {
    const d = normalizeResource(input);
    revision(expectedRevision);
    return this.transaction(() => {
      const r = this.row(id);
      demand(
        r.revision === expectedRevision,
        409,
        "CONFLICT",
        "草稿已被其他窗口修改，请刷新后再编辑",
      );
      demand(
        d.type === r.type,
        400,
        "TYPE_IMMUTABLE",
        "资源创建后不可更改类型",
      );
      this.db
        .prepare(
          "UPDATE resources SET draft=?,revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(JSON.stringify(d), new Date().toISOString(), id);
      this.event(id, "draft.update", { revision: r.revision + 1 });
      return this.get(id);
    });
  }
  publish(id, expectedRevision, note = "") {
    revision(expectedRevision);
    demand(
      typeof note === "string" && note.length <= 2000,
      400,
      "INVALID_NOTE",
      "版本说明不能超过 2000 字符",
    );
    return this.transaction(() => {
      const r = this.row(id);
      demand(
        r.revision === expectedRevision,
        409,
        "CONFLICT",
        "草稿已变更，请重新检查后发布",
      );
      demand(
        r.revision !== r.published_revision,
        409,
        "NO_CHANGES",
        "当前草稿已经发布",
      );
      const d = JSON.parse(r.draft);
      demand(
        d.files.length > 0,
        400,
        "EMPTY_RESOURCE",
        "请至少上传一个资源文件再发布",
      );
      for (const ref of d.references) this.getVersion(ref.id, ref.version);
      const version = (this.latest(id)?.version ?? 0) + 1,
        now = new Date().toISOString();
      this.db
        .prepare(
          "INSERT INTO versions(resource_id,version,snapshot,digest,note,created_at) VALUES(?,?,?,?,?,?)",
        )
        .run(id, version, r.draft, digest(r.draft), note, now);
      this.db
        .prepare(
          "UPDATE resources SET published_revision=revision,updated_at=? WHERE id=?",
        )
        .run(now, id);
      this.event(id, "version.publish", {
        version,
        digest: digest(r.draft),
      });
      return this.getVersion(id, version);
    });
  }
  versions(id) {
    this.summary(this.row(id));
    return this.db
      .prepare(
        "SELECT version,digest,note,created_at FROM versions WHERE resource_id=? ORDER BY version DESC",
      )
      .all(id)
      .map((r) => ({
        version: r.version,
        digest: r.digest,
        note: r.note,
        createdAt: r.created_at,
      }));
  }
  getVersion(id, version) {
    revision(version);
    const r = this.db
      .prepare("SELECT * FROM versions WHERE resource_id=? AND version=?")
      .get(id, version);
    demand(r, 404, "VERSION_NOT_FOUND", "已发布资源版本不存在");
    return {
      id,
      version: r.version,
      digest: r.digest,
      note: r.note,
      createdAt: r.created_at,
      resource: JSON.parse(r.snapshot),
    };
  }
  rollback(id, version, expectedRevision) {
    const v = this.getVersion(id, version);
    return this.update(id, v.resource, expectedRevision);
  }
}
