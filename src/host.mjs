import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join } from "node:path";
import { homedir } from "node:os";
import { LocalGalleryStore } from "./local-store.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx) {
    super(ctx, "gallery");
    this.store = new LocalGalleryStore(
      join(
        process.env.DSH_HOME ?? join(homedir(), ".dsh"),
        "gallery",
        "resources.json",
      ),
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
  async getResource(id) {
    return this.store.getResource(id);
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
      this.store.read();
      return { ready: true, mode: "local" };
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
}
