import { createServer } from "node:http";
import { EnrollmentIdentityProvider, principal } from "./identity.mjs";
import { demand } from "./model.mjs";
async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    demand(size <= 8 * 1024 * 1024, 413, "TOO_LARGE", "请求过大");
    chunks.push(chunk);
  }
  try {
    const p = JSON.parse(Buffer.concat(chunks).toString());
    demand(
      p && typeof p === "object" && !Array.isArray(p),
      400,
      "INVALID_INPUT",
      "请求必须为对象",
    );
    return p;
  } catch (e) {
    if (e.status) throw e;
    demand(false, 400, "INVALID_JSON", "JSON 格式无效");
  }
}
export function createGalleryServer({
  store,
  identityProvider = new EnrollmentIdentityProvider(store),
}) {
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    try {
      // This is a host-to-service API. Browser clients use authenticated DSH RPC.
      demand(
        !req.headers.origin,
        403,
        "BROWSER_ORIGIN",
        "请通过 DSH 插件访问共享服务",
      );
      const url = new URL(req.url, "http://gallery.local"),
        path = url.pathname;
      let result;
      if (req.method === "GET" && path === "/health")
        result = {
          service: "dsh-plugin-gallery",
          apiVersion: 2,
          authMode: identityProvider.authMode ?? "verified",
        };
      else if (req.method === "POST" && path === "/v1/identity/enroll") {
        demand(
          typeof identityProvider.enroll === "function",
          404,
          "NOT_FOUND",
          "当前身份服务不提供接入码兑换",
        );
        const p = await body(req);
        result = await identityProvider.enroll({
          code: p.code,
          displayName: p.displayName,
        });
      } else {
        const actor = principal(await identityProvider.authenticate(req));
        if (req.method === "GET" && path === "/v1/identity") result = actor;
        else if (req.method === "GET" && path === "/v1/resources") {
          const q = Object.fromEntries(url.searchParams);
          if (q.limit !== undefined) q.limit = Number(q.limit);
          if (q.offset !== undefined) q.offset = Number(q.offset);
          result = await store.list(actor, q);
        } else if (req.method === "POST" && path === "/v1/resources")
          result = await store.create(actor, await body(req));
        else {
          const match = path.match(/^\/v1\/resources\/([^/]+)$/);
          demand(match, 404, "NOT_FOUND", "接口不存在");
          const id = decodeURIComponent(match[1]);
          if (req.method === "GET") result = await store.get(actor, id);
          else if (req.method === "PUT") {
            const p = await body(req);
            result = await store.update(
              actor,
              id,
              p.resource,
              p.expectedRevision,
            );
          } else demand(false, 404, "NOT_FOUND", "接口不存在");
        }
      }
      res.end(JSON.stringify(result));
    } catch (e) {
      res.statusCode = e.status ?? 500;
      res.end(
        JSON.stringify({
          error: {
            code: e.code ?? "INTERNAL_ERROR",
            message: e.status ? e.message : "共享服务内部错误",
          },
        }),
      );
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
