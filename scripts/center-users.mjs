#!/usr/bin/env node
import pg from "pg";
import { randomBytes, createHash } from "node:crypto";
import { demand } from "../src/model.mjs";
const [command, userId] = process.argv.slice(2);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (command === "list") {
    const result = await pool.query(
      `SELECT u.id, u.username, u.created_at, (SELECT count(*) FROM gallery_resources r WHERE r.body->'creator'->>'userId'=u.id) AS resource_count FROM gallery_users u WHERE u.id NOT LIKE 'system:%' ORDER BY created_at`,
    );
    console.table(result.rows);
    const unowned = await pool.query(
      `SELECT count(*) FROM gallery_resources WHERE body->'creator'->>'userId' IS NULL`,
    );
    console.log("未归属的旧资源：", unowned.rows[0].count);
  } else if (command === "assign-legacy") {
    demand(userId, 400, "USER_REQUIRED", "请提供明确的用户 ID");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const user = (
        await client.query(
          "SELECT id,username FROM gallery_users WHERE id=$1",
          [userId],
        )
      ).rows[0];
      demand(
        user && !user.id.startsWith("system:"),
        404,
        "USER_NOT_FOUND",
        "用户不存在",
      );
      const changed = await client.query(
        `UPDATE gallery_resources SET body=jsonb_set(jsonb_set(body,'{creator}',jsonb_build_object('userId',$1::text,'username',$2::text)),'{revision}',to_jsonb((body->>'revision')::int+1)) WHERE body->'creator'->>'userId' IS NULL RETURNING id`,
        [user.id, user.username],
      );
      if (changed.rowCount) {
        const adminId = "system:server-admin";
        const hash = createHash("sha256").update(randomBytes(32)).digest("hex");
        await client.query(
          "INSERT INTO gallery_users(id,username,token_hash) VALUES ($1,$2,$3) ON CONFLICT(id) DO NOTHING",
          [adminId, "Server administrator", hash],
        );
        for (const row of changed.rows)
          await client.query(
            "INSERT INTO gallery_audit(actor_id,resource_id,action) VALUES ($1,$2,$3)",
            [adminId, row.id, "admin-assign-legacy:" + user.id],
          );
      }
      await client.query("COMMIT");
      console.log("已明确归属旧资源数量：", changed.rowCount);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } else
    throw new Error(
      "用法：node scripts/center-users.mjs list | assign-legacy <userId>",
    );
} finally {
  await pool.end();
}
