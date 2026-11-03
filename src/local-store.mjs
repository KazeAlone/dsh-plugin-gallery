import { DatabaseSync, backup } from "node:sqlite";
import {
  existsSync,
  mkdirSync,
  linkSync,
  unlinkSync,
  chmodSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { SqliteGalleryStore } from "./store.mjs";

/** Import the old service DB once, retaining the original and a consistent WAL snapshot. */
export async function openGalleryStore({ database, legacyDatabase }) {
  mkdirSync(dirname(database), { recursive: true, mode: 0o700 });
  if (!existsSync(database) && legacyDatabase && existsSync(legacyDatabase)) {
    const source = new DatabaseSync(legacyDatabase, { readOnly: true });
    const temp = `${database}.importing-${randomUUID()}`;
    try {
      await backup(source, temp);
      chmodSync(temp, 0o600);
      try {
        linkSync(temp, database);
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
      }
    } finally {
      source.close();
      if (existsSync(temp)) unlinkSync(temp);
    }
  }
  return new SqliteGalleryStore(database);
}
