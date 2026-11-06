import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { workflowFromResource } from './workflow-template.mjs';

export async function publishToTeamflow(resource, directory = join(homedir(), '.dsh-teamflow', 'templates')) {
  const definition = workflowFromResource(resource);
  const canvasPositions = resource.metadata?.workflowCanvas?.taskPositions;
  if (canvasPositions) {
    const entries = definition.tasks.flatMap(({ id }) => {
      const point = canvasPositions[id];
      return Number.isFinite(point?.x) && Number.isFinite(point?.y) ? [[id, point]] : [];
    });
    const left = Math.min(0, ...entries.map(([, p]) => p.x));
    const top = Math.min(0, ...entries.map(([, p]) => p.y));
    const span = Math.max(10000, ...entries.map(([, p]) => Math.max(p.x - left, p.y - top)));
    const scale = 10000 / span;
    for (const [id, point] of entries) {
      definition.positions[`task:${id}`] = {
        x: Math.min(10000, (point.x - left) * scale),
        y: Math.min(10000, (point.y - top) * scale),
      };
    }
  }
  if (definition.tasks.some(t => !t.general.requirements)) throw new Error('每个节点都需要填写通用任务要求');
  const root = resolve(directory), lock = join(root, '.write-lock');
  await mkdir(root, { recursive: true });
  const deadline = Date.now() + 5000;
  while (true) {
    try { await mkdir(lock); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() > deadline) throw new Error('TeamFlow 模板库正被其他进程写入');
      await new Promise(r => setTimeout(r, 50));
    }
  }
  try {
    let record;
    for (const file of (await readdir(root)).filter(f => /^[a-f0-9-]{36}\.json$/.test(f))) {
      try {
        const candidate = JSON.parse(await readFile(join(root, file), 'utf8'));
        if (!candidate.deleted && candidate.gallerySource === resource.id && Array.isArray(candidate.versions) && candidate.versions.length) { record = candidate; break; }
      } catch { /* TeamFlow will report damaged records; preserve them. */ }
    }
    record ??= { id: randomUUID(), gallerySource: resource.id, versions: [] };
    const latest = record.versions.at(-1), now = Date.now();
    const version = { ...definition, id: record.id, version: (latest?.version ?? 0) + 1, createdAt: latest?.createdAt ?? now, updatedAt: now };
    record.versions.push(version);
    const temp = join(root, `${record.id}.${randomUUID()}.tmp`);
    try { await writeFile(temp, JSON.stringify(record, null, 2), 'utf8'); await rename(temp, join(root, `${record.id}.json`)); }
    finally { await rm(temp, { force: true }); }
    return { id: record.id, version: version.version, name: version.name };
  } finally { await rm(lock, { recursive: true }); }
}
