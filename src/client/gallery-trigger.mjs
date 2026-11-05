/** Native slash suggestions; choosing a row only inserts a skill token, never submits. */
export function createGalleryTrigger(remote, icon) {
  return {
    trigger: "/",
    name: "Gallery",
    order: 1,
    async candidates(session, { query, signal }) {
      const key = query.toLowerCase();
      if (key !== "gallery" && !key.startsWith("gallery/")) {
        return "gallery".startsWith(key)
          ? [
              {
                name: "gallery",
                label: "Gallery",
                description: "选择 Gallery Skill",
                icon,
                value: "open",
                drill: true,
              },
            ]
          : [];
      }
      const result = await remote.uiSkillCatalog();
      signal?.throwIfAborted();
      if (result?.ok === false)
        throw new Error(result.error?.message || "无法读取 Gallery Skill");
      const rows = result?.ok === true ? result.value : result;
      const search = key.startsWith("gallery/") ? key.slice(8) : "";
      return rows
        .filter((r) =>
          `${r.label} ${r.description}`.toLowerCase().includes(search),
        )
        .map((r) => ({
          name: r.label,
          description: r.description,
          icon,
          value: r.name,
        }));
    },
    header(session, { query }) {
      return query.toLowerCase().startsWith("gallery")
        ? [{ label: "Gallery Skills", value: "open", current: true }]
        : undefined;
    },
    onPick({ candidate }) {
      if (candidate.value === "open")
        return { text: "/gallery/", continue: true };
      if (!/^gskill-[a-f0-9]{32}$/.test(candidate.value || "")) return;
      return { text: `/${candidate.value} ` };
    },
    async matchEnter(session, line) {
      if (line === "/gallery" || line === "/gallery/")
        return { text: "/gallery/", continue: true };
    },
  };
}
