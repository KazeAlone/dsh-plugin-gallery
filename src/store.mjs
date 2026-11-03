import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import {
  demand,
  digest,
  normalizeResource,
  revision,
  text,
  tokenHash,
} from "./model.mjs";

/** Storage port: see docs/storage.md. HTTP and DSH never access SQL directly. */
export class SqliteGalleryStore {
  constructor(path) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    this.db
      .exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('member','admin')),token_hash TEXT UNIQUE NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS resources(id TEXT PRIMARY KEY,type TEXT NOT NULL,owner_id TEXT NOT NULL REFERENCES members(id),draft TEXT NOT NULL,revision INTEGER NOT NULL,published_revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS versions(resource_id TEXT NOT NULL REFERENCES resources(id),version INTEGER NOT NULL,snapshot TEXT NOT NULL,digest TEXT NOT NULL,note TEXT NOT NULL,actor_id TEXT NOT NULL REFERENCES members(id),created_at TEXT NOT NULL,PRIMARY KEY(resource_id,version));
      CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT NOT NULL,resource_id TEXT,action TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL);
      PRAGMA user_version=1;`);
  }
  close() {
    this.db.close();
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const x = fn();
      this.db.exec("COMMIT");
      return x;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  event(actor, id, action, detail = {}) {
    this.db
      .prepare(
        "INSERT INTO audit(actor_id,resource_id,action,detail,created_at) VALUES(?,?,?,?,?)",
      )
      .run(
        actor.id,
        id,
        action,
        JSON.stringify(detail),
        new Date().toISOString(),
      );
  }
  publicMember(m) {
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      active: Boolean(m.active),
      createdAt: m.created_at,
    };
  }
  authenticate(token) {
    demand(
      typeof token === "string" && token.length >= 20 && token.length < 300,
      401,
      "UNAUTHORIZED",
      "成员令牌无效",
    );
    const m = this.db
      .prepare("SELECT * FROM members WHERE token_hash=? AND active=1")
      .get(tokenHash(token));
    demand(m, 401, "UNAUTHORIZED", "成员令牌无效或已撤销");
    return this.publicMember(m);
  }
  bootstrap(name) {
    return this.transaction(() => {
      demand(
        !this.db.prepare("SELECT id FROM members LIMIT 1").get(),
        409,
        "ALREADY_INITIALIZED",
        "已有成员，不能重复初始化管理员",
      );
      return this.insertMember(name, "admin");
    });
  }
  insertMember(name, role) {
    name = text(name, "成员名称", 100);
    demand(
      ["member", "admin"].includes(role),
      400,
      "INVALID_ROLE",
      "角色必须为 member 或 admin",
    );
    const id = randomUUID(),
      token = `gal_${randomBytes(32).toString("base64url")}`,
      now = new Date().toISOString();
    this.db
      .prepare(
        "INSERT INTO members(id,name,role,token_hash,created_at) VALUES(?,?,?,?,?)",
      )
      .run(id, name, role, tokenHash(token), now);
    return { member: { id, name, role, active: true, createdAt: now }, token };
  }
  listMembers(actor) {
    this.admin(actor);
    return this.db
      .prepare("SELECT * FROM members ORDER BY created_at,id")
      .all()
      .map((m) => this.publicMember(m));
  }
  addMember(actor, input) {
    this.admin(actor);
    return this.transaction(() => {
      const x = this.insertMember(input.name, input.role ?? "member");
      this.event(actor, null, "member.create", {
        id: x.member.id,
        role: x.member.role,
      });
      return x;
    });
  }
  rotateMember(actor, id, active = true) {
    this.admin(actor);
    demand(
      typeof active === "boolean",
      400,
      "INVALID_INPUT",
      "active 必须为布尔值",
    );
    return this.transaction(() => {
      const m = this.db.prepare("SELECT * FROM members WHERE id=?").get(id);
      demand(m, 404, "NOT_FOUND", "成员不存在");
      demand(
        id !== actor.id || active,
        409,
        "SELF_REVOKE",
        "不能撤销当前管理员自身",
      );
      const token = `gal_${randomBytes(32).toString("base64url")}`;
      this.db
        .prepare("UPDATE members SET token_hash=?,active=? WHERE id=?")
        .run(tokenHash(token), active ? 1 : 0, id);
      this.event(actor, null, active ? "member.rotate" : "member.revoke", {
        id,
      });
      return {
        member: this.publicMember({ ...m, active: active ? 1 : 0 }),
        ...(active ? { token } : {}),
      };
    });
  }
  admin(actor) {
    demand(actor.role === "admin", 403, "FORBIDDEN", "仅管理员可管理成员");
  }
  row(id) {
    const r = this.db.prepare("SELECT * FROM resources WHERE id=?").get(id);
    demand(r, 404, "NOT_FOUND", "资源不存在");
    return r;
  }
  canEdit(actor, r) {
    return actor.role === "admin" || actor.id === r.owner_id;
  }
  editable(actor, r) {
    demand(
      this.canEdit(actor, r),
      403,
      "FORBIDDEN",
      "只有作者和管理员可以修改或发布",
    );
  }
  latest(id) {
    return this.db
      .prepare(
        "SELECT * FROM versions WHERE resource_id=? ORDER BY version DESC LIMIT 1",
      )
      .get(id);
  }
  summary(actor, r) {
    const latest = this.latest(r.id),
      canEdit = this.canEdit(actor, r);
    demand(canEdit || latest, 404, "NOT_FOUND", "资源不存在");
    const d = JSON.parse(canEdit ? r.draft : latest.snapshot);
    const owner = this.db
      .prepare("SELECT name FROM members WHERE id=?")
      .get(r.owner_id);
    return {
      id: r.id,
      type: r.type,
      name: d.name,
      description: d.description,
      tags: d.tags,
      ownerId: r.owner_id,
      ownerName: owner?.name ?? "",
      canEdit,
      revision: canEdit ? r.revision : null,
      hasDraft: canEdit ? r.revision !== r.published_revision : false,
      latestVersion: latest?.version ?? null,
      createdAt: r.created_at,
      updatedAt: canEdit ? r.updated_at : latest.created_at,
    };
  }
  list(
    actor,
    { type = "", q = "", scope = "all", limit = 100, offset = 0 } = {},
  ) {
    demand(
      ["all", "mine", "published"].includes(scope),
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
          (scope !== "mine" || r.owner_id === actor.id) &&
          (scope !== "published" || this.latest(r.id)) &&
          (this.canEdit(actor, r) || this.latest(r.id)),
      )
      .map((r) => this.summary(actor, r))
      .filter(
        (r) =>
          !query ||
          [r.name, r.description, r.ownerName, ...r.tags]
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
  create(actor, input) {
    const d = normalizeResource(input),
      id = randomUUID(),
      now = new Date().toISOString();
    return this.transaction(() => {
      this.db
        .prepare(
          "INSERT INTO resources(id,type,owner_id,draft,revision,created_at,updated_at) VALUES(?,?,?,?,1,?,?)",
        )
        .run(id, d.type, actor.id, JSON.stringify(d), now, now);
      this.event(actor, id, "resource.create");
      return this.get(actor, id);
    });
  }
  get(actor, id) {
    const r = this.row(id),
      s = this.summary(actor, r);
    return {
      ...s,
      draft: s.canEdit ? JSON.parse(r.draft) : null,
      published: this.latest(id)
        ? this.getVersion(actor, id, this.latest(id).version)
        : null,
    };
  }
  update(actor, id, input, expectedRevision) {
    const d = normalizeResource(input);
    revision(expectedRevision);
    return this.transaction(() => {
      const r = this.row(id);
      this.editable(actor, r);
      demand(
        r.revision === expectedRevision,
        409,
        "CONFLICT",
        "草稿已被其他成员修改，请刷新后再编辑",
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
      this.event(actor, id, "draft.update", { revision: r.revision + 1 });
      return this.get(actor, id);
    });
  }
  publish(actor, id, expectedRevision, note = "") {
    revision(expectedRevision);
    demand(
      typeof note === "string" && note.length <= 2000,
      400,
      "INVALID_NOTE",
      "版本说明不能超过 2000 字符",
    );
    return this.transaction(() => {
      const r = this.row(id);
      this.editable(actor, r);
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
      for (const ref of d.references)
        this.getVersion(actor, ref.id, ref.version);
      const version = (this.latest(id)?.version ?? 0) + 1,
        now = new Date().toISOString();
      this.db
        .prepare(
          "INSERT INTO versions(resource_id,version,snapshot,digest,note,actor_id,created_at) VALUES(?,?,?,?,?,?,?)",
        )
        .run(id, version, r.draft, digest(r.draft), note, actor.id, now);
      this.db
        .prepare(
          "UPDATE resources SET published_revision=revision,updated_at=? WHERE id=?",
        )
        .run(now, id);
      this.event(actor, id, "version.publish", {
        version,
        digest: digest(r.draft),
      });
      return this.getVersion(actor, id, version);
    });
  }
  versions(actor, id) {
    this.summary(actor, this.row(id));
    return this.db
      .prepare(
        "SELECT version,digest,note,actor_id,created_at FROM versions WHERE resource_id=? ORDER BY version DESC",
      )
      .all(id)
      .map((r) => ({
        version: r.version,
        digest: r.digest,
        note: r.note,
        actorId: r.actor_id,
        createdAt: r.created_at,
      }));
  }
  getVersion(actor, id, version) {
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
      actorId: r.actor_id,
      createdAt: r.created_at,
      resource: JSON.parse(r.snapshot),
    };
  }
  rollback(actor, id, version, expectedRevision) {
    this.editable(actor, this.row(id));
    const v = this.getVersion(actor, id, version);
    return this.update(actor, id, v.resource, expectedRevision);
  }
}
