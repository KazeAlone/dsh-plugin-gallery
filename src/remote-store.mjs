import { demand } from "./model.mjs";
import { GalleryClient } from "./client-api.mjs";

/** Only the DSH host contacts the center; its token is never returned to the UI. */
export class RemoteGalleryStore {
  constructor({ url, token }) {
    this.client = new GalleryClient({
      url,
      credential: token,
      timeoutMs: 30000,
    });
  }
  read(type = "") {
    return this.client.request("/v2/runtime?" + new URLSearchParams({ type }));
  }
  async health() {
    const status = await this.client.request("/v2/health");
    demand(
      status.ready && status.protocol === 2 && status.storage === "postgres",
      400,
      "INVALID_CENTER",
      "服务地址不是兼容的 Gallery 中心服务",
    );
    return status;
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
  createResource(resource, creator) {
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
