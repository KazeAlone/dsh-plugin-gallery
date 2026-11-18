import { createServer } from "node:http";
import { timingSafeEqual, createHash } from "node:crypto";
import { demand } from "./model.mjs";

const hash = (value) => createHash("sha256").update(value).digest();
function validUsername(value) {
  demand(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.trim().length <= 80 &&
      !/[\x00-\x1f]/.test(value),
    400,
    "INVALID_USERNAME",
    "用户名须为 1–80 个字符",
  );
  return value.trim();
}
export function createCenterServer({
  store,
  token,
  openEnrollment = !token,
  logger = console,
}) {
  demand(
    (!token && openEnrollment) ||
      (typeof token === "string" && token.length >= 32 && !/\s/.test(token)),
    500,
    "INVALID_API_TOKEN",
    "中心服务访问密钥至少需要 32 位",
  );
  return createServer(
    { requestTimeout: 30000, headersTimeout: 15000 },
    async (req, res) => {
      const send = (status, value) => {
        res.writeHead(status, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(JSON.stringify(value));
      };
      try {
        const authorization = req.headers.authorization || "";
        const bootstrap =
          Boolean(token) &&
          timingSafeEqual(hash(authorization), hash("Bearer " + token));
        const credential = authorization.startsWith("Bearer ")
          ? authorization.slice(7)
          : "";
        const actor =
          !bootstrap && credential
            ? await store.authenticate(credential)
            : undefined;
        const url = new URL(req.url, "http://localhost");
        const enrollment =
          openEnrollment &&
          !authorization &&
          ((url.pathname === "/v2/health" && req.method === "GET") ||
            (url.pathname === "/v2/enroll" && req.method === "POST"));
        demand(
          bootstrap || actor || enrollment,
          401,
          "UNAUTHORIZED",
          "中心服务访问密钥无效",
        );
        const parts = url.pathname.split("/").filter(Boolean);
        let body = {};
        if (["POST", "PUT", "DELETE"].includes(req.method)) {
          demand(
            (req.headers["content-type"] || "").startsWith("application/json"),
            415,
            "INVALID_CONTENT_TYPE",
            "需要 JSON 请求",
          );
          let size = 0;
          const chunks = [];
          for await (const chunk of req) {
            size += chunk.length;
            demand(
              size <= 8 * 1024 * 1024,
              413,
              "BODY_TOO_LARGE",
              "请求内容过大",
            );
            chunks.push(chunk);
          }
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            demand(false, 400, "INVALID_JSON", "JSON 格式无效");
          }
          demand(
            body && typeof body === "object" && !Array.isArray(body),
            400,
            "INVALID_INPUT",
            "请求必须为对象",
          );
        }
        if (url.pathname === "/v2/health" && req.method === "GET")
          return send(200, {
            ...(await store.health()),
            identity: actor
              ? { kind: "member", user: actor }
              : { kind: "enrollment" },
          });
        if (url.pathname === "/v2/enroll" && req.method === "POST") {
          demand(
            bootstrap || enrollment,
            403,
            "ENROLLMENT_REQUIRED",
            "需要中心服务接入密钥",
          );
          return send(201, await store.enroll(validUsername(body.username)));
        }
        demand(
          actor,
          403,
          "USER_REQUIRED",
          "请更新 Gallery 插件并保存中心连接，以建立独立身份",
        );
        if (url.pathname === "/v2/me" && req.method === "PUT")
          return send(
            200,
            await store.updateProfile(actor, validUsername(body.username)),
          );
        if (url.pathname === "/v2/runtime" && req.method === "GET")
          return send(
            200,
            await store.read(url.searchParams.get("type") || ""),
          );
        if (url.pathname === "/v2/usage" && req.method === "POST")
          return send(200, await store.recordResourceUse(body));
        if (url.pathname === "/v2/resources") {
          if (req.method === "GET") {
            const query = Object.fromEntries(url.searchParams);
            for (const key of ["limit", "offset"])
              if (query[key] !== undefined) query[key] = Number(query[key]);
            return send(200, await store.listResources(query, actor));
          }
          if (req.method === "POST") {
            return send(201, await store.createResource(body.resource, actor));
          }
        }
        if (
          parts.length === 3 &&
          parts[0] === "v2" &&
          parts[1] === "resources"
        ) {
          const id = decodeURIComponent(parts[2]);
          if (req.method === "GET")
            return send(200, await store.getResource(id, actor));
          if (req.method === "PUT")
            return send(
              200,
              await store.updateResource(
                id,
                body.resource,
                body.expectedRevision,
                actor,
              ),
            );
          if (req.method === "DELETE")
            return send(
              200,
              await store.deleteResource(id, body.expectedRevision, actor),
            );
        }
        send(404, { error: { code: "NOT_FOUND", message: "接口不存在" } });
      } catch (error) {
        const status = Number.isInteger(error.status) ? error.status : 500;
        if (status >= 500)
          logger.error?.("Gallery center operation failed", {
            code: error.code || "INTERNAL_ERROR",
          });
        send(status, {
          error: {
            code: status >= 500 ? "CENTER_ERROR" : error.code,
            message:
              status >= 500
                ? "中心服务操作失败，请检查服务和数据库状态"
                : error.message,
          },
        });
      }
    },
  );
}
