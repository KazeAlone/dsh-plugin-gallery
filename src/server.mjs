#!/usr/bin/env node
import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SqliteGalleryStore } from "./store.mjs";
import { demand, GalleryError } from "./model.mjs";

async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    demand(size <= 8 * 1024 * 1024, 413, "TOO_LARGE", "请求超过 8 MiB");
    chunks.push(chunk);
  }
  let result;
  try {
    result = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    throw new GalleryError(400, "INVALID_JSON", "JSON 格式错误");
  }
  demand(
    result && typeof result === "object" && !Array.isArray(result),
    400,
    "INVALID_JSON",
    "请求体必须是 JSON 对象",
  );
  return result;
}
/** Dependency-injected storage, for SQLite today and another adapter later. */
export function createGalleryServer(store) {
  return createServer(async (req, res) => {
    const send = (status, value) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(value));
    };
    try {
      const url = new URL(req.url, "http://localhost"),
        path = url.pathname,
        method = req.method;
      if (path === "/health" && method === "GET")
        return send(200, { service: "dsh-gallery", apiVersion: 1 });
      const actor = await store.authenticate(
        req.headers.authorization?.match(/^Bearer (.+)$/)?.[1],
      );
      if (path === "/v1/me" && method === "GET") return send(200, actor);
      if (path === "/v1/members") {
        if (method === "GET")
          return send(200, { items: await store.listMembers(actor) });
        if (method === "POST")
          return send(201, await store.addMember(actor, await body(req)));
      }
      let m = path.match(/^\/v1\/members\/([^/]+)\/access$/);
      if (m && method === "POST") {
        const b = await body(req);
        return send(
          200,
          await store.rotateMember(
            actor,
            decodeURIComponent(m[1]),
            b.active ?? true,
          ),
        );
      }
      if (path === "/v1/resources") {
        if (method === "GET")
          return send(
            200,
            await store.list(actor, {
              type: url.searchParams.get("type") || "",
              q: url.searchParams.get("q") || "",
              scope: url.searchParams.get("scope") || "all",
              limit: Number(url.searchParams.get("limit") ?? 100),
              offset: Number(url.searchParams.get("offset") ?? 0),
            }),
          );
        if (method === "POST")
          return send(201, await store.create(actor, await body(req)));
      }
      m = path.match(
        /^\/v1\/resources\/([^/]+)(?:\/(draft|publish|rollback|versions)(?:\/(\d+))?)?$/,
      );
      if (m) {
        const id = decodeURIComponent(m[1]),
          action = m[2],
          version = m[3] ? Number(m[3]) : null;
        if (!action && method === "GET")
          return send(200, await store.get(actor, id));
        if (action === "draft" && method === "PUT") {
          const b = await body(req);
          return send(
            200,
            await store.update(actor, id, b.resource, b.expectedRevision),
          );
        }
        if (action === "publish" && method === "POST") {
          const b = await body(req);
          return send(
            201,
            await store.publish(actor, id, b.expectedRevision, b.note),
          );
        }
        if (action === "rollback" && method === "POST") {
          const b = await body(req);
          return send(
            200,
            await store.rollback(actor, id, b.version, b.expectedRevision),
          );
        }
        if (action === "versions" && method === "GET")
          return send(
            200,
            version
              ? await store.getVersion(actor, id, version)
              : { items: await store.versions(actor, id) },
          );
      }
      throw new GalleryError(404, "NOT_FOUND", "API 不存在");
    } catch (error) {
      send(error.status ?? 500, {
        error: {
          code: error.code ?? "INTERNAL",
          message: error.status ? error.message : "共享服务内部错误",
        },
      });
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const option = (name, fallback) => {
    const i = process.argv.indexOf(name);
    return i < 0 ? fallback : process.argv[i + 1];
  };
  const host = option("--host", "127.0.0.1"),
    port = Number(option("--port", "4318"));
  const db = resolve(
    option(
      "--database",
      process.env.GALLERY_DATABASE || ".data/gallery.sqlite",
    ),
  );
  const store = new SqliteGalleryStore(db),
    server = createGalleryServer(store);
  server.listen(port, host, () =>
    console.log(
      `Gallery API listening on http://${host}:${server.address().port} (v1)`,
    ),
  );
  server.on("error", (e) => {
    console.error(e.message);
    store.close();
    process.exitCode = 1;
  });
  let closing = false;
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      if (closing) return;
      closing = true;
      server.close(() => {
        store.close();
        process.exit(0);
      });
      server.closeIdleConnections();
    });
}
