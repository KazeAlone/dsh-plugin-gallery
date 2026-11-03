import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join } from "node:path";
import { homedir } from "node:os";
import { readFile, writeFile, mkdir, rename, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { GalleryClient, serviceUrl } from "./client-api.mjs";
import { demand } from "./model.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";
export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx, config = {}) {
    super(ctx, "gallery");
    this.state = {
      directory: join(
        process.env.DSH_HOME ?? join(homedir(), ".dsh"),
        "gallery",
      ),
      fixedUrl: config.serverUrl ?? process.env.DSH_GALLERY_URL,
      client: null,
    };
    this.state.ready = this.restore();
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
  async restore() {
    let saved;
    try {
      saved = JSON.parse(
        await readFile(join(this.state.directory, "access.json"), "utf8"),
      );
    } catch (e) {
      if (e.code !== "ENOENT")
        this.state.restoreError = "本地身份配置无法读取，请重新接入";
    }
    this.state.url = serviceUrl(
      this.state.fixedUrl ?? saved?.url ?? "http://127.0.0.1:4318",
    );
    if (
      saved?.credential &&
      (!this.state.fixedUrl || serviceUrl(saved.url) === this.state.url)
    )
      this.state.client = new GalleryClient({
        url: this.state.url,
        credential: saved.credential,
      });
  }
  async client() {
    await this.state.ready;
    demand(this.state.client, 401, "UNAUTHORIZED", "请先填写并验证身份");
    return this.state.client;
  }
  async getIdentity() {
    return (await this.client()).getIdentity();
  }
  /** Trusted host/platform integration: always verify the credential with the shared service. */
  async setIdentity({ credential, serverUrl }) {
    await this.state.ready;
    const url = serviceUrl(this.state.fixedUrl ?? serverUrl ?? this.state.url),
      client = new GalleryClient({ url, credential });
    const identity = await client.getIdentity();
    await mkdir(this.state.directory, { recursive: true, mode: 0o700 });
    const target = join(this.state.directory, "access.json"),
      temp = target + "." + randomUUID();
    try {
      await writeFile(temp, JSON.stringify({ url, credential }) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
      await rename(temp, target);
    } finally {
      await unlink(temp).catch(() => {});
    }
    this.state.client = client;
    this.state.url = url;
    return { ready: true, identity, url, serverLocked: !!this.state.fixedUrl };
  }
  async listResources(query, options) {
    return (await this.client()).listResources(query, options);
  }
  async getResource(id, options) {
    return (await this.client()).getResource(id, options);
  }
  async resolveReference(ref, options) {
    return (await this.client()).resolveReference(ref, options);
  }
  async getSnapshot(ref, options) {
    return (await this.client()).getSnapshot(ref, options);
  }
  async ownerCall(fn) {
    if (this.ctx.invocation?.peer?.principal?.kind !== "owner")
      throw new RemoteError(
        "gallery/forbidden",
        "Gallery UI requires the authenticated Host owner",
        {},
      );
    try {
      await this.state.ready;
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
      const base = { url: this.state.url, serverLocked: !!this.state.fixedUrl };
      if (!this.state.client)
        return { ...base, ready: false, error: this.state.restoreError };
      try {
        return {
          ...base,
          ready: true,
          identity: await this.state.client.getIdentity(),
        };
      } catch (e) {
        return {
          ...base,
          ready: false,
          error:
            e.status === 401
              ? e.message
              : "无法连接共享 Gallery，请检查服务地址与网络",
        };
      }
    });
  }
  uiEnroll(payload) {
    return this.ownerCall(async () => {
      const p = JSON.parse(payload),
        url = serviceUrl(this.state.fixedUrl ?? p.serverUrl ?? this.state.url);
      const result = await new GalleryClient({ url }).enroll({
        code: p.code,
        displayName: p.displayName,
      });
      return this.setIdentity({
        serverUrl: url,
        credential: result.credential,
      });
    });
  }
  uiClearIdentity() {
    return this.ownerCall(async () => {
      await unlink(join(this.state.directory, "access.json")).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
      this.state.client = null;
      return {
        ready: false,
        url: this.state.url,
        serverLocked: !!this.state.fixedUrl,
      };
    });
  }
  uiList(payload) {
    return this.ownerCall(async () =>
      (await this.client()).listResources(JSON.parse(payload)),
    );
  }
  uiGet(id) {
    return this.ownerCall(async () => (await this.client()).getResource(id));
  }
  uiCreate(payload) {
    return this.ownerCall(async () =>
      (await this.client()).createResource(JSON.parse(payload)),
    );
  }
  uiUpdate(id, payload) {
    return this.ownerCall(async () => {
      const p = JSON.parse(payload);
      return (await this.client()).updateResource(
        id,
        p.resource,
        p.expectedRevision,
      );
    });
  }
}
