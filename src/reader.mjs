import { demand } from "./model.mjs";

/** Read-only integration facade for a synchronous or asynchronous storage adapter. */
export class GalleryReader {
  constructor(store) {
    this.ready = Promise.resolve(store);
  }
  async invoke(method, args = [], { signal } = {}) {
    signal?.throwIfAborted();
    const store = await this.ready;
    signal?.throwIfAborted();
    return store[method](...args);
  }
  listResources(query, options) {
    return this.invoke("list", [query], options);
  }
  getResource(id, options) {
    return this.invoke("get", [id], options);
  }
  listVersions(id, options) {
    return this.invoke("versions", [id], options).then((items) => ({ items }));
  }
  getVersion(id, version, options) {
    return this.invoke("getVersion", [id, version], options);
  }
  async resolveReference(ref, options) {
    const version = await this.getVersion(ref.id, ref.version, options);
    demand(
      !ref.digest || version.digest === ref.digest,
      409,
      "DIGEST_MISMATCH",
      "资源摘要与固定版本引用不一致",
    );
    return version;
  }
}
