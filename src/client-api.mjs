import { Agent } from "undici";
import { demand, GalleryError } from "./model.mjs";
export function serviceUrl(value) {
  let url;
  try {
    const address = typeof value === "string" ? value.trim() : "";
    demand(address, 400, "INVALID_URL", "共享服务地址无效");
    url = new URL(address.includes("://") ? address : "http://" + address);
  } catch {
    demand(false, 400, "INVALID_URL", "共享服务地址无效");
  }
  demand(
    !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/",
    400,
    "INVALID_URL",
    "服务地址只能包含协议、主机与端口",
  );
  demand(
    ["https:", "http:"].includes(url.protocol),
    400,
    "INSECURE_URL",
    "中心服务地址仅支持 HTTP 或 HTTPS",
  );
  return url.origin;
}

/** A protocol change on the same endpoint must preserve the DSH's identity. */
export function sameCenterEndpoint(first, second) {
  if (!first || !second) return false;
  return new URL(serviceUrl(first)).host === new URL(serviceUrl(second)).host;
}
const certificateDispatchers = new Map();
function certificateDispatcher(ca) {
  if (!ca) return undefined;
  if (!certificateDispatchers.has(ca)) {
    if (certificateDispatchers.size >= 16) {
      const oldest = certificateDispatchers.keys().next().value;
      void certificateDispatchers
        .get(oldest)
        .close()
        .catch(() => {});
      certificateDispatchers.delete(oldest);
    }
    certificateDispatchers.set(ca, new Agent({ connect: { ca } }));
  }
  return certificateDispatchers.get(ca);
}
/** Host-side SDK. Credentials must never be sent to the browser UI. */
export class GalleryClient {
  constructor({ url, credential, timeoutMs = 15000, caCertificate = "" }) {
    this.url = serviceUrl(url);
    this.credential = credential;
    this.caCertificate = caCertificate;
    this.dispatcher = certificateDispatcher(caCertificate);
    this.timeoutMs = timeoutMs;
  }
  async request(
    path,
    { method = "GET", body, signal, anonymous = false } = {},
  ) {
    const response = await fetch(this.url + path, {
      method,
      ...(this.dispatcher ? { dispatcher: this.dispatcher } : {}),
      redirect: "error",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(this.timeoutMs)])
        : AbortSignal.timeout(this.timeoutMs),
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(!anonymous && this.credential
          ? { Authorization: `Bearer ${this.credential}` }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let value;
    try {
      value = await response.json();
    } catch {
      throw new GalleryError(
        response.ok ? 502 : response.status,
        "INVALID_SERVICE_RESPONSE",
        "中心服务未返回 JSON，请检查服务地址和 HTTPS 反向代理配置",
      );
    }
    if (!response.ok)
      throw new GalleryError(
        response.status,
        value.error?.code ?? "SERVICE_ERROR",
        value.error?.message ?? "共享服务请求失败",
      );
    return value;
  }
  enroll(input) {
    return this.request("/v1/identity/enroll", {
      method: "POST",
      body: input,
      anonymous: true,
    });
  }
  getHealth() {
    return this.request("/health", { anonymous: true });
  }
  getIdentity(options) {
    return this.request("/v1/identity", options);
  }
  listResources(query = {}, options) {
    return this.request(
      "/v1/resources?" +
        new URLSearchParams(
          Object.entries(query).filter(([, v]) => v !== undefined),
        ),
      options,
    );
  }
  getResource(id, options) {
    return this.request("/v1/resources/" + encodeURIComponent(id), options);
  }
  createResource(resource, options) {
    return this.request("/v1/resources", {
      ...options,
      method: "POST",
      body: resource,
    });
  }
  updateResource(id, resource, expectedRevision, options) {
    return this.request("/v1/resources/" + encodeURIComponent(id), {
      ...options,
      method: "PUT",
      body: { resource, expectedRevision },
    });
  }
  async resolveReference(ref, options) {
    const r = await this.getResource(ref.id, options);
    demand(
      !ref.digest || ref.digest === r.digest,
      409,
      "DIGEST_MISMATCH",
      "资源已更新，请重新选择资源或使用编排运行时保存的内容快照",
    );
    return r;
  }
  async getSnapshot(ref, options) {
    const r = await this.resolveReference(ref, options);
    return structuredClone({
      id: r.id,
      digest: r.digest,
      resource: {
        type: r.type,
        name: r.name,
        description: r.description,
        tags: r.tags,
        files: r.files,
        metadata: r.metadata,
        references: r.references,
      },
    });
  }
}
