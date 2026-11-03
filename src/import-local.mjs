import { DatabaseSync, backup } from "node:sqlite";
import { mkdir, link, unlink, chmod } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
/** Consistent WAL-aware copy; never replace an existing shared database. */
export async function importLocalDatabase(source, target) {
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  const temporary = target + ".import-" + randomUUID();
  let db;
  try {
    db = new DatabaseSync(source, { readOnly: true });
    await backup(db, temporary);
    await chmod(temporary, 0o600);
    await link(temporary, target);
  } finally {
    db?.close();
    await unlink(temporary).catch(() => {});
  }
}
