import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { openGalleryStore } from "./local-store.mjs";
import { GalleryReader } from "./reader.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx, config = {}) {
    super(ctx, "gallery");
    const home = process.env.DSH_HOME || join(homedir(), ".dsh");
    const database = resolve(
      config.database ?? join(home, "gallery", "gallery.sqlite"),
    );
    this.state = {
      ready: openGalleryStore({
        database,
        legacyDatabase: config.database
          ? undefined
          : join(home, "gallery", "service", "gallery.sqlite"),
      }),
    };
    this.state.reader = new GalleryReader(this.state.ready);
    ctx.effect(async () => {
      const store = await this.state.ready;
      return () => store.close();
    });
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
  listResources(query, options) {
    return this.state.reader.listResources(query, options);
  }
  getResource(id, options) {
    return this.state.reader.getResource(id, options);
  }
  listVersions(id, options) {
    return this.state.reader.listVersions(id, options);
  }
  getVersion(id, version, options) {
    return this.state.reader.getVersion(id, version, options);
  }
  resolveReference(ref, options) {
    return this.state.reader.resolveReference(ref, options);
  }
  async ownerCall(fn) {
    if (this.ctx.invocation?.peer?.principal?.kind !== "owner")
      throw new RemoteError(
        "gallery/forbidden",
        "Gallery UI requires the authenticated Host owner",
        {},
      );
    try {
      return await fn(await this.state.ready);
    } catch (e) {
      throw new RemoteError("gallery/error", e.message, {
        code: e.code ?? "GALLERY_ERROR",
        status: e.status ?? 500,
      });
    }
  }
  uiStatus() {
    return this.ownerCall(() => ({ ready: true, mode: "local" }));
  }
  uiList(payload) {
    return this.ownerCall((store) => store.list(JSON.parse(payload)));
  }
  uiGet(id) {
    return this.ownerCall((store) => store.get(id));
  }
  uiCreate(payload) {
    return this.ownerCall((store) => store.create(JSON.parse(payload)));
  }
  uiUpdate(id, payload) {
    return this.ownerCall((store) => {
      const p = JSON.parse(payload);
      return store.update(id, p.resource, p.expectedRevision);
    });
  }
  uiPublish(id, payload) {
    return this.ownerCall((store) => {
      const p = JSON.parse(payload);
      return store.publish(id, p.expectedRevision, p.note);
    });
  }
  uiVersions(id) {
    return this.ownerCall(async (store) => ({
      items: await store.versions(id),
    }));
  }
  uiReadVersion(id, payload) {
    return this.ownerCall((store) =>
      store.getVersion(id, JSON.parse(payload).version),
    );
  }
  uiRollback(id, payload) {
    return this.ownerCall((store) => {
      const p = JSON.parse(payload);
      return store.rollback(id, p.version, p.expectedRevision);
    });
  }
}
