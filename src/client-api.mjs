/** Public integration SDK. Only published, pinned versions should execute. */
export class GalleryApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function validateEndpoint(endpoint) {
  const u = new URL(endpoint);
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !["https:", "http:"].includes(u.protocol)
  )
    throw new Error("Gallery 地址须为不含凭据或查询参数的 HTTP(S) 地址");
  if (
    u.protocol === "http:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
  )
    throw new Error("远程 Gallery 必须使用 HTTPS；HTTP 只用于本机开发");
  return u.href.replace(/\/$/, "");
}
export class GalleryClient {
  constructor({ url, token, timeoutMs = 20000 }) {
    this.url = validateEndpoint(url);
    this.token = token;
    this.timeoutMs = timeoutMs;
  }
  async request(method, path, value, { signal } = {}) {
    if (typeof this.token !== "string" || this.token.length < 20)
      throw new GalleryApiError(401, "UNAUTHORIZED", "请设置有效成员令牌");
    const deadline = AbortSignal.timeout(this.timeoutMs);
    const response = await fetch(this.url + path, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: value === undefined ? undefined : JSON.stringify(value),
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      redirect: "error",
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new GalleryApiError(
        response.status,
        "INVALID_RESPONSE",
        "Gallery 返回非 JSON 响应",
      );
    }
    if (!response.ok)
      throw new GalleryApiError(
        response.status,
        result.error?.code ?? "HTTP_ERROR",
        result.error?.message ?? "Gallery 请求失败",
      );
    return result;
  }
  me() {
    return this.request("GET", "/v1/me");
  }
  listResources(query = {}, options = {}) {
    return this.request(
      "GET",
      "/v1/resources?" +
        new URLSearchParams(
          Object.entries(query).filter(
            ([, v]) => v !== undefined && v !== null,
          ),
        ).toString(),
      undefined,
      options,
    );
  }
  getResource(id, options = {}) {
    return this.request(
      "GET",
      `/v1/resources/${encodeURIComponent(id)}`,
      undefined,
      options,
    );
  }
  getVersion(id, version, options = {}) {
    if (!Number.isSafeInteger(version) || version < 1)
      throw new Error("必须固定正整数版本号");
    return this.request(
      "GET",
      `/v1/resources/${encodeURIComponent(id)}/versions/${version}`,
      undefined,
      options,
    );
  }
  listVersions(id) {
    return this.request(
      "GET",
      `/v1/resources/${encodeURIComponent(id)}/versions`,
    );
  }
  createResource(resource) {
    return this.request("POST", "/v1/resources", resource);
  }
  updateDraft(id, resource, expectedRevision) {
    return this.request(
      "PUT",
      `/v1/resources/${encodeURIComponent(id)}/draft`,
      { resource, expectedRevision },
    );
  }
  publish(id, expectedRevision, note = "") {
    return this.request(
      "POST",
      `/v1/resources/${encodeURIComponent(id)}/publish`,
      { expectedRevision, note },
    );
  }
  rollback(id, version, expectedRevision) {
    return this.request(
      "POST",
      `/v1/resources/${encodeURIComponent(id)}/rollback`,
      { version, expectedRevision },
    );
  }
  async resolveReference(ref, options = {}) {
    const result = await this.getVersion(ref.id, ref.version, options);
    if (ref.digest && ref.digest !== result.digest)
      throw new GalleryApiError(
        409,
        "DIGEST_MISMATCH",
        "资源摘要与编排中固定的版本不一致",
      );
    return result;
  }
}
