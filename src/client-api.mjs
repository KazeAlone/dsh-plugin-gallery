import { demand, GalleryError } from "./model.mjs";
export function serviceUrl(value) {
  let url;
  try {
    url = new URL(value);
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
    url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)),
    400,
    "INSECURE_URL",
    "远程共享服务必须使用 HTTPS，本机允许 HTTP",
  );
  return url.origin;
}
/** Host-side SDK. Credentials must never be sent to the browser UI. */
export class GalleryClient {
  constructor({ url, credential, timeoutMs = 15000 }) {
    this.url = serviceUrl(url);
    this.credential = credential;
    this.timeoutMs = timeoutMs;
  }
  async request(
    path,
    { method = "GET", body, signal, anonymous = false } = {},
  ) {
    const response = await fetch(this.url + path, {
      method,
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
    const value = await response.json();
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
