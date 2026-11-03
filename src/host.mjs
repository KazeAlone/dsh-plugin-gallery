import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { GalleryClient } from "./client-api.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx, config = {}) {
    super(ctx, "gallery");
    const path =
      config.connectionFile ??
      join(
        process.env.DSH_HOME || join(homedir(), ".dsh"),
        "gallery",
        "connection.json",
      );
    let saved;
    try {
      saved = JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    const url = config.serverUrl ?? process.env.DSH_GALLERY_URL ?? saved?.url;
    const token =
      process.env[config.tokenEnv ?? "DSH_GALLERY_TOKEN"] ?? saved?.token;
    this.state = {
      path,
      connection: url && token ? { url, token } : null,
      locked: Boolean(
        config.serverUrl ||
          process.env.DSH_GALLERY_URL ||
          process.env[config.tokenEnv ?? "DSH_GALLERY_TOKEN"],
      ),
    };
    ctx.effect(() =>
      ctx.get("typert").register({
        package: "dsh-plugin-gallery",
        face: "host",
        schemas: [],
        model: { services: [], events: [], objects: [] },
        invocations: DESCRIPTORS,
      }),
    );
  }
  client() {
    if (!this.state.connection) throw new Error("请先连接团队 Gallery");
    return new GalleryClient(this.state.connection);
  }
  // Public Cordis service for trusted sibling plugins. No browser owner context required here.
  listResources(query, options) {
    return this.client().listResources(query, options);
  }
  listVersions(id) {
    return this.client().listVersions(id);
  }
  getResource(id, options) {
    return this.client().getResource(id, options);
  }
  getVersion(id, version, options) {
    return this.client().getVersion(id, version, options);
  }
  resolveReference(ref, options) {
    return this.client().resolveReference(ref, options);
  }
  async ownerCall(fn) {
    if (this.ctx.invocation?.peer?.principal?.kind !== "owner")
      throw new RemoteError(
        "gallery/forbidden",
        "Gallery UI requires the authenticated Host owner",
        {},
      );
    try {
      return await fn();
    } catch (e) {
      throw new RemoteError("gallery/error", e.message, {
        code: e.code ?? "GALLERY_ERROR",
        status: e.status ?? 500,
      });
    }
  }
  uiStatus() {
    return this.ownerCall(async () => {
      const url = this.state.connection?.url ?? "";
      if (!this.state.connection)
        return { connected: false, url, locked: this.state.locked };
      try {
        return {
          connected: true,
          url,
          locked: this.state.locked,
          member: await this.client().me(),
        };
      } catch (e) {
        return {
          connected: false,
          url,
          locked: this.state.locked,
          error: e.message,
        };
      }
    });
  }
  uiConnect(payload) {
    return this.ownerCall(async () => {
      if (this.state.locked)
        throw new Error("连接由宿主配置或环境变量管理，请修改宿主配置");
      const connection = JSON.parse(payload),
        client = new GalleryClient(connection),
        member = await client.me();
      const saved = { url: client.url, token: connection.token },
        path = this.state.path;
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
      writeFileSync(path + ".tmp", JSON.stringify(saved), { mode: 0o600 });
      chmodSync(path + ".tmp", 0o600);
      renameSync(path + ".tmp", path);
      this.state.connection = saved;
      return { connected: true, url: saved.url, member, locked: false };
    });
  }
  uiList(payload) {
    return this.ownerCall(() => this.listResources(JSON.parse(payload)));
  }
  uiGet(id) {
    return this.ownerCall(() => this.getResource(id));
  }
  uiCreate(payload) {
    return this.ownerCall(() =>
      this.client().createResource(JSON.parse(payload)),
    );
  }
  uiUpdate(id, payload) {
    return this.ownerCall(() => {
      const p = JSON.parse(payload);
      return this.client().updateDraft(id, p.resource, p.expectedRevision);
    });
  }
  uiPublish(id, payload) {
    return this.ownerCall(() => {
      const p = JSON.parse(payload);
      return this.client().publish(id, p.expectedRevision, p.note);
    });
  }
  uiVersions(id) {
    return this.ownerCall(() => this.client().listVersions(id));
  }
  uiReadVersion(id, payload) {
    return this.ownerCall(() =>
      this.getVersion(id, JSON.parse(payload).version),
    );
  }
  uiRollback(id, payload) {
    return this.ownerCall(() => {
      const p = JSON.parse(payload);
      return this.client().rollback(id, p.version, p.expectedRevision);
    });
  }
  uiMembers() {
    return this.ownerCall(() => this.client().request("GET", "/v1/members"));
  }
  uiAddMember(payload) {
    return this.ownerCall(() =>
      this.client().request("POST", "/v1/members", JSON.parse(payload)),
    );
  }
  uiMemberAccess(id, payload) {
    return this.ownerCall(() =>
      this.client().request(
        "POST",
        `/v1/members/${encodeURIComponent(id)}/access`,
        JSON.parse(payload),
      ),
    );
  }
}
