import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import { demand, digest, normalizeResource, revision, text } from "./model.mjs";
import { principal, sameOwner } from "./identity.mjs";
const secret = (prefix) => `${prefix}_${randomBytes(32).toString("base64url")}`;
const now = () => new Date().toISOString();
function resourceSchema() {
  return `CREATE TABLE resources(id TEXT PRIMARY KEY,type TEXT NOT NULL,payload TEXT NOT NULL,digest TEXT NOT NULL,revision INTEGER NOT NULL,tenant_id TEXT NOT NULL,owner_issuer TEXT,owner_subject TEXT,owner_name TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`;
}
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
        version <= 3,
        409,
        "SCHEMA_TOO_NEW",
        "数据库由更新版本创建，请升级插件",
      );
      if (
        version < 3 &&
        this.db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='resources'",
          )
          .get()
      )
        this.migrate(path);
      this.transaction(() => {
        if (
          !this.db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='resources'",
            )
            .get()
        )
          this.db.exec(resourceSchema());
        this.db
          .exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS identities(issuer TEXT NOT NULL,subject TEXT NOT NULL,tenant_id TEXT NOT NULL,display_name TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(issuer,subject,tenant_id));
          CREATE TABLE IF NOT EXISTS credentials(hash TEXT PRIMARY KEY,issuer TEXT NOT NULL,subject TEXT NOT NULL,tenant_id TEXT NOT NULL,created_at TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS enrollment_codes(hash TEXT PRIMARY KEY,subject TEXT NOT NULL,tenant_id TEXT NOT NULL,expires_at INTEGER NOT NULL,used_at TEXT);
          CREATE TABLE IF NOT EXISTS resource_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,resource_id TEXT,action TEXT NOT NULL,principal TEXT NOT NULL,created_at TEXT NOT NULL);
          PRAGMA user_version=3;`);
        this.db
          .prepare("INSERT OR IGNORE INTO settings VALUES('issuer',?)")
          .run(`gallery:${randomUUID()}`);
      });
      this.issuer = this.db
        .prepare("SELECT value FROM settings WHERE key='issuer'")
        .get().value;
    } catch (e) {
      this.db.close();
      throw e;
    }
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      this.db.exec("COMMIT");
      return value;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  close() {
    this.db.close();
  }
  migrate(path) {
    if (path !== ":memory:") {
      this.backupPath = `${path}.before-gallery-0.3-${Date.now()}-${randomUUID().slice(0, 8)}.sqlite`;
      this.db.exec(`VACUUM INTO '${this.backupPath.replaceAll("'", "''")}'`);
      chmodSync(this.backupPath, 0o600);
    }
    this.db.exec("PRAGMA foreign_keys=OFF");
    try {
      this.transaction(() => {
        const rows = this.db.prepare("SELECT * FROM resources").all();
        this.db.exec("ALTER TABLE resources RENAME TO legacy_resources");
        if (
          this.db
            .prepare("SELECT name FROM sqlite_master WHERE name='versions'")
            .get()
        )
          this.db.exec("ALTER TABLE versions RENAME TO legacy_versions");
        if (
          this.db
            .prepare("SELECT name FROM sqlite_master WHERE name='audit'")
            .get()
        )
          this.db.exec("ALTER TABLE audit RENAME TO legacy_audit");
        if (
          this.db
            .prepare("SELECT name FROM sqlite_master WHERE name='members'")
            .get()
        )
          this.db.exec("ALTER TABLE members RENAME TO legacy_members");
        this.db.exec(resourceSchema());
        for (const r of rows) {
          const raw = JSON.parse(r.draft),
            payload = JSON.stringify(
              normalizeResource({
                ...raw,
                references: (raw.references ?? []).map((x) => ({ id: x.id })),
              }),
            );
          this.db
            .prepare("INSERT INTO resources VALUES(?,?,?,?,?,?,?,?,?,?,?)")
            .run(
              r.id,
              r.type,
              payload,
              digest(payload),
              r.revision,
              "default",
              null,
              null,
              null,
              r.created_at,
              r.updated_at,
            );
        }
        this.db.exec("PRAGMA user_version=3");
      });
    } finally {
      this.db.exec("PRAGMA foreign_keys=ON");
    }
  }
  /** Local operator interface. Never exposed as a browser or HTTP operation. */
  issueCode({ tenantId = "default", subject, ttlSeconds = 86400 } = {}) {
    tenantId = text(tenantId, "空间标识", 200);
    demand(
      Number.isInteger(ttlSeconds) && ttlSeconds >= 60 && ttlSeconds <= 604800,
      400,
      "INVALID_EXPIRY",
      "接入码有效期应为 60 秒至 7 天",
    );
    if (subject)
      demand(
        this.db
          .prepare(
            "SELECT subject FROM identities WHERE issuer=? AND subject=? AND tenant_id=?",
          )
          .get(this.issuer, subject, tenantId),
        404,
        "IDENTITY_NOT_FOUND",
        "恢复身份必须指定已存在的 subject",
      );
    const code = secret("gx"),
      id = subject ?? randomUUID(),
      expiresAt = Date.now() + ttlSeconds * 1000;
    this.db
      .prepare("INSERT INTO enrollment_codes VALUES(?,?,?,?,NULL)")
      .run(digest(code), id, tenantId, expiresAt);
    return {
      code,
      issuer: this.issuer,
      subject: id,
      tenantId,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }
  redeemCode(code, displayName) {
    demand(
      typeof code === "string" && code.length >= 30 && code.length < 200,
      401,
      "INVALID_CODE",
      "接入码无效",
    );
    displayName = text(displayName, "姓名", 100);
    return this.transaction(() => {
      const row = this.db
        .prepare("SELECT * FROM enrollment_codes WHERE hash=?")
        .get(digest(code));
      demand(
        row && !row.used_at && row.expires_at > Date.now(),
        401,
        "INVALID_CODE",
        "接入码无效、已使用或已过期",
      );
      const identity = {
          issuer: this.issuer,
          subject: row.subject,
          tenantId: row.tenant_id,
          displayName,
        },
        credential = secret("gi");
      this.db
        .prepare(
          "INSERT INTO identities VALUES(?,?,?,?,?) ON CONFLICT(issuer,subject,tenant_id) DO UPDATE SET display_name=excluded.display_name",
        )
        .run(this.issuer, row.subject, row.tenant_id, displayName, now());
      this.db
        .prepare(
          "DELETE FROM credentials WHERE issuer=? AND subject=? AND tenant_id=?",
        )
        .run(this.issuer, row.subject, row.tenant_id);
      this.db
        .prepare("INSERT INTO credentials VALUES(?,?,?,?,?)")
        .run(
          digest(credential),
          this.issuer,
          row.subject,
          row.tenant_id,
          now(),
        );
      this.db
        .prepare(
          "UPDATE enrollment_codes SET used_at=? WHERE subject=? AND tenant_id=?",
        )
        .run(now(), row.subject, row.tenant_id);
      return { identity, credential };
    });
  }
  authenticate(credential) {
    demand(
      typeof credential === "string" &&
        credential.length >= 30 &&
        credential.length < 200,
      401,
      "UNAUTHORIZED",
      "请先填写并验证身份",
    );
    const row = this.db
      .prepare(
        "SELECT i.* FROM credentials c JOIN identities i ON i.issuer=c.issuer AND i.subject=c.subject AND i.tenant_id=c.tenant_id WHERE c.hash=?",
      )
      .get(digest(credential));
    demand(
      row,
      401,
      "UNAUTHORIZED",
      "身份凭证无效，请使用维护者提供的新接入码恢复身份",
    );
    return {
      issuer: row.issuer,
      subject: row.subject,
      tenantId: row.tenant_id,
      displayName: row.display_name,
    };
  }
  owner(row) {
    return row.owner_subject
      ? {
          issuer: row.owner_issuer,
          subject: row.owner_subject,
          tenantId: row.tenant_id,
          displayName: row.owner_name,
        }
      : null;
  }
  row(actor, id) {
    actor = principal(actor);
    const row = this.db
      .prepare("SELECT * FROM resources WHERE id=? AND tenant_id=?")
      .get(id, actor.tenantId);
    demand(row, 404, "NOT_FOUND", "资源不存在");
    return row;
  }
  detail(actor, row) {
    const resource = JSON.parse(row.payload);
    return {
      id: row.id,
      ...resource,
      digest: row.digest,
      revision: row.revision,
      owner: this.owner(row),
      canEdit: sameOwner(actor, this.owner(row)),
      fileCount: resource.files.length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  list(
    actor,
    { type = "", q = "", scope = "all", limit = 100, offset = 0 } = {},
  ) {
    actor = principal(actor);
    demand(
      ["all", "mine"].includes(scope),
      400,
      "INVALID_SCOPE",
      "筛选范围只能为 all 或 mine",
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
    const items = this.db
      .prepare(
        "SELECT * FROM resources WHERE tenant_id=? ORDER BY updated_at DESC,id",
      )
      .all(actor.tenantId)
      .filter(
        (row) =>
          (!type || row.type === type) &&
          (scope !== "mine" || sameOwner(actor, this.owner(row))),
      )
      .map((row) => {
        const { files, metadata, references, ...summary } = this.detail(
          actor,
          row,
        );
        return summary;
      })
      .filter(
        (r) =>
          !query ||
          [r.name, r.description, r.owner?.displayName ?? "", ...r.tags]
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
  get(actor, id) {
    return this.detail(principal(actor), this.row(actor, id));
  }
  create(actor, input) {
    actor = principal(actor);
    const resource = normalizeResource(input),
      payload = JSON.stringify(resource),
      id = randomUUID(),
      date = now();
    return this.transaction(() => {
      this.db
        .prepare("INSERT INTO resources VALUES(?,?,?,?,?,?,?,?,?,?,?)")
        .run(
          id,
          resource.type,
          payload,
          digest(payload),
          1,
          actor.tenantId,
          actor.issuer,
          actor.subject,
          actor.displayName,
          date,
          date,
        );
      this.event(actor, id, "resource.create");
      return this.get(actor, id);
    });
  }
  update(actor, id, input, expectedRevision) {
    actor = principal(actor);
    revision(expectedRevision);
    const resource = normalizeResource(input);
    return this.transaction(() => {
      const row = this.row(actor, id);
      demand(
        sameOwner(actor, this.owner(row)),
        403,
        "FORBIDDEN",
        "只能编辑自己上传的资源",
      );
      demand(
        row.revision === expectedRevision,
        409,
        "CONFLICT",
        "资源已更新，请刷新后再编辑",
      );
      demand(
        resource.type === row.type,
        400,
        "TYPE_IMMUTABLE",
        "资源创建后不可更改类型",
      );
      const payload = JSON.stringify(resource);
      this.db
        .prepare(
          "UPDATE resources SET payload=?,digest=?,revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(payload, digest(payload), now(), id);
      this.event(actor, id, "resource.update");
      return this.get(actor, id);
    });
  }
  event(actor, id, action) {
    this.db
      .prepare(
        "INSERT INTO resource_audit(resource_id,action,principal,created_at) VALUES(?,?,?,?)",
      )
      .run(
        id,
        action,
        JSON.stringify({
          issuer: actor.issuer,
          subject: actor.subject,
          tenantId: actor.tenantId,
        }),
        now(),
      );
  }
  /** Explicit operator mapping for legacy resources whose ownership cannot be proven. */
  assignUnowned(id, { subject, tenantId = "default" }) {
    const owner = this.db
      .prepare(
        "SELECT * FROM identities WHERE issuer=? AND subject=? AND tenant_id=?",
      )
      .get(this.issuer, subject, tenantId);
    demand(owner, 404, "IDENTITY_NOT_FOUND", "身份不存在，请先兑换接入码");
    return this.transaction(() => {
      const row = this.db
        .prepare("SELECT * FROM resources WHERE id=? AND tenant_id=?")
        .get(id, tenantId);
      demand(row, 404, "NOT_FOUND", "资源不存在");
      demand(
        !row.owner_subject,
        409,
        "ALREADY_OWNED",
        "资源已有归属，不能通过该命令重新分配",
      );
      this.db
        .prepare(
          "UPDATE resources SET owner_issuer=?,owner_subject=?,owner_name=? WHERE id=?",
        )
        .run(this.issuer, subject, owner.display_name, id);
      return { id, subject, tenantId };
    });
  }
}
