import { demand } from "./model.mjs";
import { GalleryClient, sameCenterEndpoint } from "./client-api.mjs";

/** Only the DSH host contacts the center; its token is never returned to the UI. */
export class RemoteGalleryStore {
  constructor({ url, token, caCertificate, useHostProxy }) {
    this.client = new GalleryClient({
      url,
      credential: token,
      caCertificate,
      useHostProxy,
      timeoutMs: 30000,
    });
  }
  read(type = "") {
    return this.client.request("/v2/runtime?" + new URLSearchParams({ type }));
  }
  async health() {
    let status;
    try {
      status = await this.client.request("/v2/health");
    } catch (error) {
      demand(
        error.status !== 401 || Boolean(this.client.credential),
        400,
        "CENTER_UPGRADE_REQUIRED",
        "中心服务尚未开启免密接入，请在服务器运行新版部署脚本",
      );
      throw error;
    }
    demand(
      status.ready &&
        status.protocol === 3 &&
        status.ownership === true &&
        status.storage === "postgres",
      400,
      "INVALID_CENTER",
      "请将 Gallery 插件和中心服务更新到支持独立身份的版本",
    );
    return status;
  }
  async connect(username, previous) {
    const status = await this.health();
    if (status.identity?.kind === "member")
      return { token: this.client.credential, userId: status.identity.user.id };
    demand(
      status.identity?.kind === "enrollment",
      400,
      "INVALID_IDENTITY",
      "中心服务身份响应无效",
    );
    // Re-entering the shared enrollment key must not replace an existing identity.
    if (previous?.userId && sameCenterEndpoint(previous.url, this.client.url)) {
      return new RemoteGalleryStore({
        ...previous,
        url: this.client.url,
        caCertificate: this.client.caCertificate,
        useHostProxy: this.client.useHostProxy,
      }).connect(username);
    }
    const result = await this.client.request("/v2/enroll", {
      method: "POST",
      body: { username },
    });
    demand(
      result.user?.id && typeof result.token === "string",
      500,
      "INVALID_IDENTITY",
      "中心服务未返回有效身份",
    );
    return { token: result.token, userId: result.user.id };
  }
  updateProfile(username) {
    return this.client.request("/v2/me", { method: "PUT", body: { username } });
  }
  listResources(query = {}) {
    return this.client.request(
      "/v2/resources?" +
        new URLSearchParams(
          Object.entries(query).filter(([, v]) => v !== undefined),
        ),
    );
  }
  getResource(id) {
    return this.client.request("/v2/resources/" + encodeURIComponent(id));
  }
  async createResource(resource, creator) {
    if (creator?.username) await this.updateProfile(creator.username);
    return this.client.request("/v2/resources", {
      method: "POST",
      body: { resource, creator },
    });
  }
  updateResource(id, resource, expectedRevision) {
    return this.client.request("/v2/resources/" + encodeURIComponent(id), {
      method: "PUT",
      body: { resource, expectedRevision },
    });
  }
  deleteResource(id, expectedRevision) {
    return this.client.request("/v2/resources/" + encodeURIComponent(id), {
      method: "DELETE",
      body: { expectedRevision },
    });
  }
  recordResourceUse(input) {
    return this.client.request("/v2/usage", { method: "POST", body: input });
  }
  recordSkillUse(input) {
    return this.recordResourceUse({ ...input, type: "skill" });
  }
  async resolveReference(ref) {
    const row = await this.getResource(ref.id);
    demand(
      !ref.digest || ref.digest === row.digest,
      409,
      "DIGEST_MISMATCH",
      "资源已更新，请重新选择资源",
    );
    return row;
  }
  async getSnapshot(ref) {
    const {
      id,
      digest,
      type,
      name,
      description,
      tags,
      files,
      metadata,
      references,
    } = await this.resolveReference(ref);
    return {
      id,
      digest,
      resource: { type, name, description, tags, files, metadata, references },
    };
  }
}
