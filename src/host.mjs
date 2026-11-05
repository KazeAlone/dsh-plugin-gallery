import {
  TypertRemoteService,
  RemoteError,
} from "@deepseek-ai/dsh-typert-protocol";
import { join } from "node:path";
import { homedir } from "node:os";
import { StorageManager } from "./storage-manager.mjs";
import { createSkillProvider } from "./skill-provider.mjs";
import { DESCRIPTORS } from "./descriptors.mjs";

export default class GalleryService extends TypertRemoteService {
  static inject = ["typert"];
  constructor(ctx) {
    super(ctx, "gallery");
    this.store = new StorageManager(
      join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "gallery"),
    );
    this.skillProvider = createSkillProvider(this.store);
    this.invalidateSkills = () => {};
    ctx.inject(["skills"], (scope) => {
      scope.effect(() =>
        scope.skills.registerProvider((control) => {
          this.invalidateSkills = control.invalidate;
          return this.skillProvider;
        }),
      );
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
  async listResources(query) {
    return this.store.listResources(query);
  }
  async getResource(id, options) {
    return this.store.getResource(id, options?.libraryId);
  }
  async resolveReference(ref) {
    return this.store.resolveReference(ref);
  }
  // Host consumer reports actual activation; never called from read or UI paths.
  async recordSkillUse(input) {
    return this.store.recordSkillUse(input);
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
    return this.ownerCall(() => {
      const r = this.store.createResource(JSON.parse(payload));
      this.invalidateSkills();
      return r;
    });
  }
  uiSkillCatalog() {
    return this.ownerCall(async () => {
      if (!this.ctx.get("skills"))
        throw new Error("DSH Skill 服务未启用，请使用支持 Skill 的预设。");
      const candidates = await this.skillProvider.list();
      return candidates
        .filter((c) => c.invocation.userInvocable)
        .map((c) => ({
          name: c.name,
          label: this.store.getResource(c.locator).name,
          description: c.description,
        }));
    });
  }
  uiUpdate(id, payload) {
    return this.ownerCall(() => {
      const p = JSON.parse(payload);
      const r = this.store.updateResource(id, p.resource, p.expectedRevision);
      this.invalidateSkills();
      return r;
    });
  }
  uiStorageSettings() {
    return this.ownerCall(() => this.store.settings());
  }
  uiTestStorage(payload) {
    return this.ownerCall(() => this.store.testConnection(JSON.parse(payload)));
  }
  uiConfigureStorage() {
    return this.ownerCall(() => this.store.configure());
  }
}
