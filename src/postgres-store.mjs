import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
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
    return { ready: true, protocol: 2, storage: "postgres" };
  }
  async read(type = "") {
    const { rows } = await this.pool.query(
      "SELECT body FROM gallery_resources WHERE ($1 = '' OR body->>'type' = $1)",
      [type],
    );
    return { format: 1, resources: rows.map((r) => this.decode(r.body)) };
  }
  async getResource(id) {
    const { rows } = await this.pool.query(
      "SELECT body FROM gallery_resources WHERE id=$1",
      [id],
    );
    return new MemoryStore(rows.map((r) => this.decode(r.body))).getResource(
      id,
    );
  }
  async listResources(query = {}) {
    // Validate pagination/sort with exactly the same rules as the local adapter.
    const { limit, offset } = new MemoryStore().listResources(query);
    const q = String(query.q || "")
      .toLocaleLowerCase()
      .slice(0, 200);
    const params = [query.type || "", q];
    const where = `WHERE ($1 = '' OR body->>'type' = $1) AND ($2 = '' OR strpos(lower(concat_ws(' ', body->>'name', body->>'description', body->'creator'->>'username', (body->'tags')::text)), $2) > 0)`;
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
      FROM gallery_resources ${where} ORDER BY ${order} LIMIT $3 OFFSET $4`,
      [...params, limit, offset],
    );
    return {
      total: Number(count.rows[0].count),
      limit,
      offset,
      items: result.rows.map((r) => ({
        ...r.summary,
        usageCount: r.summary.usageCount ?? 0,
        canEdit: true,
        canDelete: true,
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
  async createResource(input, creator) {
    this.validate(input);
    const memory = new MemoryStore();
    const result = memory.createResource(input, creator);
    try {
      await this.pool.query(
        "INSERT INTO gallery_resources(id,body) VALUES ($1,$2)",
        [result.id, this.encode(memory.data.resources[0])],
      );
    } catch (error) {
      this.databaseError(error);
    }
    return result;
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
  async mutate(id, fn, remove = false) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT body FROM gallery_resources WHERE id=$1 FOR UPDATE",
        [id],
      );
      const memory = new MemoryStore(rows.map((r) => this.decode(r.body)));
      const result = fn(memory);
      if (remove)
        await client.query("DELETE FROM gallery_resources WHERE id=$1", [id]);
      else
        await client.query("UPDATE gallery_resources SET body=$2 WHERE id=$1", [
          id,
          this.encode(memory.data.resources[0]),
        ]);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      this.databaseError(error);
    } finally {
      client.release();
    }
  }
  updateResource(id, input, expectedRevision) {
    this.validate(input);
    return this.mutate(id, (m) =>
      m.updateResource(id, input, expectedRevision),
    );
  }
  deleteResource(id, expectedRevision) {
    return this.mutate(id, (m) => m.deleteResource(id, expectedRevision), true);
  }
  recordResourceUse(input) {
    return this.mutate(input.id, (m) => m.recordResourceUse(input));
  }
}
