#!/usr/bin/env node
import pg from "pg";
import { PostgresGalleryStore } from "../src/postgres-store.mjs";
import { createCenterServer } from "../src/center-server.mjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
});
pool.on("error", (error) =>
  console.error("Gallery database pool error:", error.code || "DATABASE_ERROR"),
);
const store = new PostgresGalleryStore(
  pool,
  process.env.GALLERY_ENCRYPTION_KEY,
);
await store.initialize();
const server = createCenterServer({
  store,
  token: process.env.GALLERY_API_TOKEN,
  openEnrollment:
    process.env.GALLERY_OPEN_ENROLLMENT === "true" ||
    !process.env.GALLERY_API_TOKEN,
});
server.listen(
  Number(process.env.PORT || 8090),
  process.env.HOST || "127.0.0.1",
  () => console.log("Gallery center ready"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
