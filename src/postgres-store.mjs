import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  createHash,
} from "node:crypto";
import { LocalGalleryStore } from "./local-store.mjs";
import { demand, normalizeResource } from "./model.mjs";
import { workflowFromResource } from "./workflow-template.mjs";
import { validateMcpConfig } from "./mcp-config.mjs";

// Reuse resource validation and revision/usage rules without temporary files.
class MemoryStore extends LocalGalleryStore {
  constructor(rows = []) {
    super("");
    this.data = { format: 1, resources: rows };
  }
  read() {
    return this.data;
  }
  write(change) {
    return this.detail(change(this.data.resources, this.data));
  }
}

/** One JSONB row per resource, row locks for edits and deduplicated usage. */
export class PostgresGalleryStore {
  constructor(pool, encryptionKey) {
    demand(
      /^[a-f0-9]{64}$/i.test(encryptionKey || ""),
      500,
      "INVALID_ENCRYPTION_KEY",
      "中心服务需要 64 位十六进制加密密钥",
    );
    this.pool = pool;
    this.key = Buffer.from(encryptionKey, "hex");
  }
  async initialize() {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS gallery_users (
      id text PRIMARY KEY, username text NOT NULL, token_hash text UNIQUE NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS gallery_audit (
      id bigserial PRIMARY KEY, actor_id text NOT NULL REFERENCES gallery_users(id),
      resource_id text NOT NULL, action text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS gallery_resources (
      id text PRIMARY KEY,
      body jsonb NOT NULL,
      CHECK (body->>'id' = id)
    )`);
    await this.pool
      .query(`CREATE UNIQUE INDEX IF NOT EXISTS gallery_mcp_name ON gallery_resources
      ((body->'metadata'->'mcp'->>'serverName')) WHERE body->>'type' = 'mcp'`);
    await this.pool
      .query(`CREATE INDEX IF NOT EXISTS gallery_resource_type_updated ON gallery_resources
      ((body->>'type'), (body->>'updatedAt') DESC)`);
  }
  async enroll(username) {
    const id = randomUUID(),
      token = "guser_" + randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.pool.query(
      "INSERT INTO gallery_users(id,username,token_hash) VALUES ($1,$2,$3)",
      [id, username, tokenHash],
    );
    return { user: { id, username }, token };
  }
  async authenticate(token) {
    const hash = createHash("sha256").update(token).digest("hex");
    const { rows } = await this.pool.query(
      "SELECT id,username FROM gallery_users WHERE token_hash=$1",
      [hash],
    );
    return rows[0];
  }
  async updateProfile(actor, username) {
    const { rows } = await this.pool.query(
      "UPDATE gallery_users SET username=$2 WHERE id=$1 RETURNING id,username",
      [actor.id, username],
    );
    return rows[0];
  }
  present(row, actor) {
    const canEdit = Boolean(actor?.id && row.creator?.userId === actor.id);
    return { ...row, canEdit, canDelete: canEdit };
  }
  requireOwner(row, actor) {
    demand(row, 404, "NOT_FOUND", "资源不存在");
    demand(
      actor?.id && row.creator?.userId === actor.id,
      403,
      "RESOURCE_FORBIDDEN",
      "只能编辑或删除自己创建的资源",
    );
  }
  encode(row) {
    const { privateMcpCredentials, ...safe } = row;
    if (privateMcpCredentials && Object.keys(privateMcpCredentials).length) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", this.key, iv);
      const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(privateMcpCredentials), "utf8"),
        cipher.final(),
      ]);
      safe.encryptedCredentials = {
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
        content: ciphertext.toString("base64"),
      };
    }
    return safe;
  }
  decode(row) {
    const { encryptedCredentials, ...safe } = row;
    if (encryptedCredentials) {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.key,
        Buffer.from(encryptedCredentials.iv, "base64"),
      );
      decipher.setAuthTag(Buffer.from(encryptedCredentials.tag, "base64"));
      safe.privateMcpCredentials = JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(encryptedCredentials.content, "base64")),
          decipher.final(),
        ]).toString("utf8"),
      );
    }
    return safe;
  }
  async health() {
    await this.pool.query("SELECT 1");
    return { ready: true, protocol: 3, storage: "postgres", ownership: true };
  }
  async read(type = "") {
    const { rows } = await this.pool.query(
      "SELECT body FROM gallery_resources WHERE ($1 = '' OR body->>'type' = $1)",
      [type],
    );
    return { format: 1, resources: rows.map((r) => this.decode(r.body)) };
  }
  async getResource(id, actor) {
    const { rows } = await this.pool.query(
      "SELECT body FROM gallery_resources WHERE id=$1",
      [id],
    );
    return this.present(
      new MemoryStore(rows.map((r) => this.decode(r.body))).getResource(id),
      actor,
    );
  }
  async listResources(query = {}, actor) {
    // Validate pagination/sort with exactly the same rules as the local adapter.
    const { limit, offset } = new MemoryStore().listResources(query);
    const q = String(query.q || "")
      .toLocaleLowerCase()
      .slice(0, 200);
    const params = [
      query.type || "",
      q,
      query.scope === "mine" ? actor?.id || "unowned-not-a-user" : "",
    ];
    const where = `WHERE ($1 = '' OR body->>'type' = $1) AND ($2 = '' OR strpos(lower(concat_ws(' ', body->>'name', body->>'description', body->'creator'->>'username', (body->'tags')::text)), $2) > 0) AND ($3 = '' OR body->'creator'->>'userId' = $3)`;
    const order =
      query.sort === "usage"
        ? `COALESCE((body->>'usageCount')::bigint,0) DESC, body->>'name', id`
        : `body->>'updatedAt' DESC, id`;
    const count = await this.pool.query(
      "SELECT count(*) FROM gallery_resources " + where,
      params,
    );
    const result = await this.pool.query(
      `SELECT body - 'files' - 'metadata' - 'references' - 'encryptedCredentials' - 'usageEventIds' AS summary,
      jsonb_array_length(body->'files') AS file_count, body->'metadata'->>'cover' AS cover,
      body->'encryptedCredentials' IS NOT NULL AS has_credentials
      FROM gallery_resources ${where} ORDER BY ${order} LIMIT $4 OFFSET $5`,
      [...params, limit, offset],
    );
    return {
      total: Number(count.rows[0].count),
      limit,
      offset,
      items: result.rows.map((r) => ({
        ...r.summary,
        usageCount: r.summary.usageCount ?? 0,
        canEdit: Boolean(actor?.id && r.summary.creator?.userId === actor.id),
        canDelete: Boolean(actor?.id && r.summary.creator?.userId === actor.id),
        fileCount: r.file_count,
        ...(r.cover ? { cover: r.cover } : {}),
      })),
    };
  }
  validate(input) {
    normalizeResource(input);
    if (input.type === "mcp") validateMcpConfig(input.metadata?.mcp);
    if (input.type === "workflow") workflowFromResource(input);
  }
  async createResource(input, actor) {
    demand(actor?.id, 401, "USER_REQUIRED", "需要独立用户身份");
    this.validate(input);
    const memory = new MemoryStore();
    const result = memory.createResource(input, actor);
    const row = memory.data.resources[0];
    row.creator = { username: actor.username, userId: actor.id };
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO gallery_resources(id,body) VALUES ($1,$2)",
        [result.id, this.encode(row)],
      );
      await client.query(
        "INSERT INTO gallery_audit(actor_id,resource_id,action) VALUES ($1,$2,$3)",
        [actor.id, result.id, "create"],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      this.databaseError(error);
    } finally {
      client.release();
    }
    return this.present(memory.getResource(result.id), actor);
  }
  databaseError(error) {
    demand(
      error.code !== "23505",
      409,
      "DUPLICATE_MCP_NAME",
      "服务器名称已被其他 MCP 资源使用",
    );
    throw error;
  }
  async mutate(id, fn, { remove = false, actor, action } = {}) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT body FROM gallery_resources WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (action) this.requireOwner(rows[0]?.body, actor);
      const memory = new MemoryStore(rows.map((r) => this.decode(r.body)));
      const result = fn(memory);
      if (remove)
        await client.query("DELETE FROM gallery_resources WHERE id=$1", [id]);
      else
        await client.query("UPDATE gallery_resources SET body=$2 WHERE id=$1", [
          id,
          this.encode(memory.data.resources[0]),
        ]);
      if (action)
        await client.query(
          "INSERT INTO gallery_audit(actor_id,resource_id,action) VALUES ($1,$2,$3)",
          [actor.id, id, action],
        );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      this.databaseError(error);
    } finally {
      client.release();
    }
  }
  updateResource(id, input, expectedRevision, actor) {
    this.validate(input);
    return this.mutate(
      id,
      (m) => m.updateResource(id, input, expectedRevision),
      { actor, action: "update" },
    );
  }
  deleteResource(id, expectedRevision, actor) {
    return this.mutate(id, (m) => m.deleteResource(id, expectedRevision), {
      actor,
      action: "delete",
      remove: true,
    });
  }
  recordResourceUse(input) {
    return this.mutate(input.id, (m) => m.recordResourceUse(input));
  }
}
