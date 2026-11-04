import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { demand, digest, normalizeResource, revision } from "./model.mjs";

/** Local file adapter; the host-facing resource API stays independent of storage. */
export class LocalGalleryStore {
  constructor(path) {
    this.path = path;
  }
  read() {
    let data;
    try {
      data = JSON.parse(readFileSync(this.path, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return { format: 1, resources: [] };
      throw e;
    }
    demand(
      data.format === 1 && Array.isArray(data.resources),
      500,
      "INVALID_STORAGE",
      "本地资源文件格式无效，请先备份检查",
    );
    return data;
  }
  detail(row) {
    return structuredClone({
      ...row,
      canEdit: true,
      fileCount: row.files.length,
    });
  }
  getResource(id) {
    const row = this.read().resources.find((r) => r.id === id);
    demand(row, 404, "NOT_FOUND", "资源不存在");
    return this.detail(row);
  }
  listResources({
    type = "",
    q = "",
    scope = "all",
    limit = 100,
    offset = 0,
  } = {}) {
    demand(
      ["all", "mine"].includes(scope),
      400,
      "INVALID_SCOPE",
      "无效筛选范围",
    );
    demand(
      Number.isInteger(limit) &&
        limit >= 1 &&
        limit <= 100 &&
        Number.isInteger(offset) &&
        offset >= 0,
      400,
      "INVALID_PAGE",
      "分页参数无效",
    );
    const query = String(q).toLocaleLowerCase().slice(0, 200);
    const rows = this.read()
      .resources.filter(
        (r) =>
          (!type || r.type === type) &&
          (!query ||
            [r.name, r.description, ...r.tags]
              .join(" ")
              .toLocaleLowerCase()
              .includes(query)),
      )
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
      );
    const items = rows.slice(offset, offset + limit).map((row) => {
      const { files, metadata, references, ...summary } = this.detail(row);
      return summary;
    });
    return { items, total: rows.length, limit, offset };
  }
  write(change) {
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
    const lock = this.path + ".lock";
    try {
      mkdirSync(lock);
    } catch (e) {
      if (e.code === "EEXIST")
        demand(false, 409, "CONFLICT", "资源库正在保存，请稍后重试");
      throw e;
    }
    const temp = this.path + "." + randomUUID();
    try {
      const data = this.read();
      const row = change(data.resources);
      writeFileSync(temp, JSON.stringify(data) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
      renameSync(temp, this.path);
      return this.detail(row);
    } finally {
      rmSync(temp, { force: true });
      rmSync(lock, { recursive: true, force: true });
    }
  }
  createResource(input) {
    const resource = normalizeResource(input);
    return this.write((rows) => {
      const now = new Date().toISOString();
      const row = {
        ...resource,
        id: randomUUID(),
        digest: digest(JSON.stringify(resource)),
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(row);
      return row;
    });
  }
  updateResource(id, input, expectedRevision) {
    revision(expectedRevision);
    const resource = normalizeResource(input);
    return this.write((rows) => {
      const index = rows.findIndex((r) => r.id === id);
      demand(index >= 0, 404, "NOT_FOUND", "资源不存在");
      const old = rows[index];
      demand(
        old.revision === expectedRevision,
        409,
        "CONFLICT",
        "资源已更新，请刷新后再编辑",
      );
      demand(
        old.type === resource.type,
        400,
        "TYPE_IMMUTABLE",
        "资源创建后不可更改类型",
      );
      return (rows[index] = {
        ...old,
        ...resource,
        digest: digest(JSON.stringify(resource)),
        revision: old.revision + 1,
        updatedAt: new Date().toISOString(),
      });
    });
  }
  resolveReference(ref) {
    const row = this.getResource(ref.id);
    demand(
      !ref.digest || ref.digest === row.digest,
      409,
      "DIGEST_MISMATCH",
      "资源已更新，请重新选择资源",
    );
    return row;
  }
  getSnapshot(ref) {
    const {
      id,
      digest: hash,
      type,
      name,
      description,
      tags,
      files,
      metadata,
      references,
    } = this.resolveReference(ref);
    return {
      id,
      digest: hash,
      resource: { type, name, description, tags, files, metadata, references },
    };
  }
}
