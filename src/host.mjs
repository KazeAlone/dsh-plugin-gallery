import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join } from "node:path";
import { homedir } from "node:os";
import { StorageManager } from "./storage-manager.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx) {
    super(ctx, "gallery");
    this.store = new StorageManager(
      join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "gallery"),
    );
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
  async listResources(query) {
    return this.store.listResources(query);
  }
  async getResource(id, options) {
    return this.store.getResource(id, options?.libraryId);
  }
  async resolveReference(ref) {
    return this.store.resolveReference(ref);
  }
  async getSnapshot(ref) {
    return this.store.getSnapshot(ref);
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
    return this.ownerCall(() => {
      this.store.adapter().read();
      return { ready: true, mode: "local", storage: this.store.settings() };
    });
  }
  uiList(payload) {
    return this.ownerCall(() => this.store.listResources(JSON.parse(payload)));
  }
  uiGet(id) {
    return this.ownerCall(() => this.store.getResource(id));
  }
  uiCreate(payload) {
    return this.ownerCall(() => this.store.createResource(JSON.parse(payload)));
  }
  uiUpdate(id, payload) {
    return this.ownerCall(() => {
      const p = JSON.parse(payload);
      return this.store.updateResource(id, p.resource, p.expectedRevision);
    });
  }
  uiStorageSettings() {
    return this.ownerCall(() => this.store.settings());
  }
  uiTestStorage(payload) {
    return this.ownerCall(() => this.store.testConnection(JSON.parse(payload)));
  }
  uiSwitchLibrary(payload) {
    return this.ownerCall(() => this.store.switchLibrary(JSON.parse(payload)));
  }
}
