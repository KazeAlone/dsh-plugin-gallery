import {
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { digest, normalizeResource } from "./model.mjs";
import { readSkill } from "./client/skill-format.mjs";
export const GALLERY_SKILL_PROVIDER = "gallery";
export function gallerySkillName(id) {
  return `gskill-${digest(id).slice(0, 32)}`;
}
export function skillCandidate(resource) {
  if (
    resource.type !== "skill" ||
    !resource.files.some((f) => f.path === "SKILL.md" && f.encoding === "utf8")
  )
    return null;
  const parsed = readSkill(resource);
  const meta = parsed.frontmatter;
  if (parsed.error || !parsed.body.trim() || !parsed.description?.trim())
    return null;
  for (const key of ["user-invocable", "disable-model-invocation"]) {
    if (meta[key] !== undefined && typeof meta[key] !== "boolean") return null;
  }
  return {
    name: gallerySkillName(resource.id),
    description: `${resource.name}: ${parsed.description}`,
    invocation: {
      userInvocable: meta["user-invocable"] !== false,
      modelInvocable: meta["disable-model-invocation"] !== true,
    },
    source: "gallery",
    provider: GALLERY_SKILL_PROVIDER,
    rank: 600,
    locator: resource.id,
  };
}
/** Immutable per-revision bundles give scripts and references a real resource base. */
export function materializeSkill(directory, resource) {
  const normalized = normalizeResource(resource);
  const root = join(
    directory,
    "skill-runtime",
    digest(resource.id),
    digest(JSON.stringify(normalized)),
  );
  if (existsSync(root)) return root;
  mkdirSync(dirname(root), { recursive: true, mode: 0o700 });
  const temp = root + "." + randomUUID();
  mkdirSync(temp, { mode: 0o700 });
  try {
    for (const file of normalized.files) {
      const target = join(temp, file.path);
      mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
      writeFileSync(
        target,
        Buffer.from(
          file.content,
          file.encoding === "base64" ? "base64" : "utf8",
        ),
        { mode: 0o600, flag: "wx" },
      );
    }
    renameSync(temp, root);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
  return root;
}
export function skillContentWithAttachments(resource, directory) {
  const { body, files } = readSkill(resource);
  if (!files.length) return body;
  const entries = files.map(
    (file) =>
      `- ${file.path} → ${join(directory, file.path)} (${file.encoding === "utf8" ? "文本" : "二进制"})`,
  );
  return `${body.trimEnd()}\n\n## Gallery 附件\n以下文件与 SKILL.md 同属一个 Skill，按需读取；相对路径以本 Skill 的资源目录为基准。\n${entries.join("\n")}\n`;
}
export function createSkillProvider(store) {
  return {
    name: GALLERY_SKILL_PROVIDER,
    async list({ signal } = {}) {
      signal?.throwIfAborted();
      return store
        .adapter()
        .read()
        .resources.map(skillCandidate)
        .filter(Boolean);
    },
    async get(candidate, { signal } = {}) {
      signal?.throwIfAborted();
      const resource = store.getResource(candidate.locator);
      const current = skillCandidate(resource);
      if (!current || current.name !== candidate.name) return undefined;
      const path = materializeSkill(store.directory, resource);
      const { rank, locator, ...summary } = current;
      return {
        ...summary,
        content: skillContentWithAttachments(resource, path),
        resourceBase: { kind: "directory", path },
        path: join(path, "SKILL.md"),
      };
    },
  };
}
