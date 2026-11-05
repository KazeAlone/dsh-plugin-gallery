import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { userInfo } from "node:os";
import { randomUUID } from "node:crypto";
import { LocalGalleryStore } from "./local-store.mjs";
import { demand } from "./model.mjs";

export const STORAGE_PROVIDERS = [
  { type: "internal", name: "DSH 内部存储", available: true },
  { type: "service", name: "中心服务", available: false },
];

/** Connection registry; resource operations are delegated to storage adapters. */
export class StorageManager {
  constructor(directory) {
    this.directory = directory;
    this.path = join(directory, "storage.json");
  }
  read() {
    let config;
    try {
      config = JSON.parse(readFileSync(this.path, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT")
        return {
          format: 1,
          configured: false,
          activeLibraryId: "local",
          libraries: [{ id: "local", type: "internal", name: "本地资源库" }],
        };
      throw e;
    }
    demand(
      config.format === 1 && typeof config.configured === "boolean",
      500,
      "INVALID_STORAGE_CONFIG",
      "存储配置无效，请先备份检查",
    );
    return {
      format: 1,
      configured: config.configured,
      ...(typeof config.username === "string" && config.username.trim()
        ? { username: config.username }
        : {}),
      activeLibraryId: "local",
      libraries: [{ id: "local", type: "internal", name: "本地资源库" }],
    };
  }

  settings() {
    return {
      ...this.read(),
      username: this.username(),
      providers: STORAGE_PROVIDERS,
      capabilities: {
        list: true,
        read: true,
        create: true,
        update: true,
        delete: true,
        history: false,
        sharing: false,
        migration: false,
      },
    };
  }
  username() {
    const configured = this.read().username;
    if (configured) return configured;
    try {
      return userInfo().username || "owner";
    } catch {
      return "owner";
    }
  }
  setUsername(value) {
    demand(
      typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= 80 &&
        !/[\x00-\x1f]/.test(value),
      400,
      "INVALID_USERNAME",
      "用户名须为 1–80 个字符",
    );
    return this.change((config) => {
      config.username = value.trim();
    });
  }
  library(id = this.read().activeLibraryId) {
    const library = this.read().libraries.find((l) => l.id === id);
    demand(library, 404, "LIBRARY_NOT_FOUND", "资源库不存在");
    return library;
  }
  adapter(id) {
    this.library(id);
    return new LocalGalleryStore(join(this.directory, "resources.json"));
  }

  change(update) {
    mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const lock = this.path + ".lock";
    try {
      mkdirSync(lock);
    } catch (e) {
      if (e.code === "EEXIST")
        demand(false, 409, "CONFLICT", "存储配置正在更新，请重试");
      throw e;
    }
    const temp = this.path + "." + randomUUID();
    try {
      const config = this.read();
      update(config);
      config.configured = true;
      writeFileSync(temp, JSON.stringify(config) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
      renameSync(temp, this.path);
      return this.settings();
    } finally {
      rmSync(temp, { force: true });
      rmSync(lock, { recursive: true, force: true });
    }
  }
  testConnection({ libraryId, type = "internal" } = {}) {
    demand(
      type === "internal",
      400,
      "PROVIDER_UNAVAILABLE",
      "此存储方式尚未接入",
    );
    const library = this.library(libraryId);
    this.adapter(library.id).read();
    return { ready: true, libraryId: library.id, type: library.type };
  }
  configure() {
    this.testConnection();
    return this.change(() => {});
  }
  listResources(query) {
    const libraryId = this.read().activeLibraryId;
    const page = this.adapter(libraryId).listResources(query);
    return {
      ...page,
      libraryId,
      items: page.items.map((r) => ({ ...r, libraryId })),
    };
  }
  getResource(id, libraryId) {
    const library = this.library(libraryId);
    return {
      ...this.adapter(library.id).getResource(id),
      libraryId: library.id,
    };
  }
  createResource(input) {
    const libraryId = this.read().activeLibraryId;
    return {
      ...this.adapter(libraryId).createResource(input, {
        username: this.username(),
      }),
      libraryId,
    };
  }
  updateResource(id, input, expectedRevision) {
    const libraryId = this.read().activeLibraryId;
    return {
      ...this.adapter(libraryId).updateResource(id, input, expectedRevision),
      libraryId,
    };
  }
  deleteResource(id, expectedRevision) {
    return this.adapter().deleteResource(id, expectedRevision);
  }
  recordSkillUse({ libraryId, ...input } = {}) {
    const library = this.library(libraryId);
    return {
      ...this.adapter(library.id).recordSkillUse(input),
      libraryId: library.id,
    };
  }
  resolveReference(ref) {
    const library = this.library(ref.libraryId);
    return {
      ...this.adapter(library.id).resolveReference(ref),
      libraryId: library.id,
    };
  }
  getSnapshot(ref) {
    const library = this.library(ref.libraryId);
    return {
      ...this.adapter(library.id).getSnapshot(ref),
      libraryId: library.id,
    };
  }
}
