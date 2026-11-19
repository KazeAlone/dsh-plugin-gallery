import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { userInfo } from "node:os";
import { randomUUID, X509Certificate } from "node:crypto";
import { RemoteGalleryStore } from "./remote-store.mjs";
import { serviceUrl, sameCenterEndpoint } from "./client-api.mjs";
import { LocalGalleryStore } from "./local-store.mjs";
import { demand } from "./model.mjs";

export const STORAGE_PROVIDERS = [
  { type: "internal", name: "DSH 内部存储", available: true },
  { type: "service", name: "中心服务", available: true },
];

const mapResult = (value, fn) =>
  value instanceof Promise ? value.then(fn) : fn(value);

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
      ...(config.service ? { service: config.service } : {}),
      activeLibraryId:
        config.activeLibraryId === "center" && config.service
          ? "center"
          : "local",
      libraries: [
        { id: "local", type: "internal", name: "本地资源库" },
        ...(config.service
          ? [{ id: "center", type: "service", name: "中心资源库" }]
          : []),
      ],
    };
  }

  settings() {
    const { service, ...config } = this.read();
    return {
      ...config,
      ...(service
        ? {
            service: {
              url: service.url,
              hasToken: Boolean(service.token),
              allowStdio: Boolean(service.allowStdio),
              userId: service.userId,
              caCertificate: service.caCertificate || "",
            },
          }
        : {}),
      username: this.username(),
      providers: STORAGE_PROVIDERS,
      capabilities: {
        list: true,
        read: true,
        create: true,
        update: true,
        delete: true,
        history: false,
        sharing: config.activeLibraryId === "center",
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
    const save = () =>
      this.change((config) => {
        config.username = value.trim();
      });
    return save();
  }
  library(id = this.read().activeLibraryId) {
    const library = this.read().libraries.find((l) => l.id === id);
    demand(library, 404, "LIBRARY_NOT_FOUND", "资源库不存在");
    return library;
  }
  adapter(id) {
    const library = this.library(id);
    if (library.type === "service")
      return new RemoteGalleryStore(this.read().service);
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
  connection(input = {}) {
    const previous = this.read().service;
    const url = serviceUrl(input.url || previous?.url);
    const token =
      input.token ||
      (sameCenterEndpoint(url, previous?.url) ? previous?.token : undefined);
    demand(
      !token ||
        (typeof token === "string" &&
          token.length >= 16 &&
          token.length <= 512 &&
          !/\s/.test(token)),
      400,
      "INVALID_SERVICE_TOKEN",
      "请填写中心服务访问密钥（至少 16 位）",
    );
    const caCertificate =
      input.caCertificate === undefined
        ? url === previous?.url
          ? previous?.caCertificate || ""
          : ""
        : input.caCertificate;
    demand(
      typeof caCertificate === "string" && caCertificate.length <= 32768,
      400,
      "INVALID_CA",
      "服务器证书内容无效",
    );
    if (caCertificate) {
      let certificate;
      try {
        certificate = new X509Certificate(caCertificate);
      } catch {}
      demand(
        certificate?.ca &&
          caCertificate.includes("-----BEGIN CERTIFICATE-----"),
        400,
        "INVALID_CA",
        "请选择有效的 PEM 格式 CA 根证书",
      );
    }
    return {
      url,
      token,
      caCertificate,
      allowStdio:
        input.allowStdio === undefined
          ? Boolean(previous?.allowStdio)
          : input.allowStdio === true,
    };
  }
  testConnection(input = {}) {
    if (input.type === "service") {
      const adapter = new RemoteGalleryStore(this.connection(input));
      return adapter.health().then(() => ({ ready: true, type: "service" }));
    }
    demand(
      !input.type || input.type === "internal",
      400,
      "PROVIDER_UNAVAILABLE",
      "此存储方式尚未接入",
    );
    const adapter = input.libraryId
      ? this.adapter(input.libraryId)
      : new LocalGalleryStore(join(this.directory, "resources.json"));
    return mapResult(adapter.read(), () => ({ ready: true, type: "internal" }));
  }
  configure(input = {}) {
    demand(
      !input.type || ["internal", "service"].includes(input.type),
      400,
      "PROVIDER_UNAVAILABLE",
      "此存储方式尚未接入",
    );
    if (input.type === "service") {
      const connection = this.connection(input);
      return new RemoteGalleryStore(connection)
        .connect(this.username(), this.read().service)
        .then((identity) =>
          this.change((config) => {
            config.service = { ...connection, ...identity };
            config.activeLibraryId = "center";
          }),
        );
    }
    this.testConnection({ type: "internal" });
    return this.change((config) => {
      config.activeLibraryId = "local";
    });
  }
  listResources(query) {
    const libraryId = this.read().activeLibraryId;
    return mapResult(this.adapter(libraryId).listResources(query), (page) => ({
      ...page,
      libraryId,
      items: page.items.map((r) => ({ ...r, libraryId })),
    }));
  }
  getResource(id, libraryId) {
    const library = this.library(libraryId);
    return mapResult(this.adapter(library.id).getResource(id), (row) => ({
      ...row,
      libraryId: library.id,
    }));
  }
  createResource(input) {
    const libraryId = this.read().activeLibraryId;
    return mapResult(
      this.adapter(libraryId).createResource(input, {
        username: this.username(),
      }),
      (row) => ({ ...row, libraryId }),
    );
  }
  updateResource(id, input, expectedRevision) {
    const libraryId = this.read().activeLibraryId;
    return mapResult(
      this.adapter(libraryId).updateResource(id, input, expectedRevision),
      (row) => ({ ...row, libraryId }),
    );
  }
  deleteResource(id, expectedRevision) {
    return this.adapter().deleteResource(id, expectedRevision);
  }
  recordSkillUse({ libraryId, ...input } = {}) {
    const library = this.library(libraryId);
    return mapResult(this.adapter(library.id).recordSkillUse(input), (row) => ({
      ...row,
      libraryId: library.id,
    }));
  }
  resolveReference(ref) {
    const library = this.library(ref.libraryId);
    return mapResult(this.adapter(library.id).resolveReference(ref), (row) => ({
      ...row,
      libraryId: library.id,
    }));
  }
  getSnapshot(ref) {
    const library = this.library(ref.libraryId);
    return mapResult(this.adapter(library.id).getSnapshot(ref), (row) => ({
      ...row,
      libraryId: library.id,
    }));
  }
}
