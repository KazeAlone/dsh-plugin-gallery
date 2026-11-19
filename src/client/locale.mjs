import { english } from "./messages-en.mjs";
export const normalizeLanguage = (value) =>
  /^en(?:[-_]|$)/i.test(value || "") ? "en" : "zh";
const format = (text, values) =>
  text.replace(/\{(\d+)\}/g, (token, index) =>
    Number(index) < values.length ? String(values[Number(index)] ?? "") : token,
  );
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const reverse = new Map(
  Object.entries(english).map(([source, value]) => [value, source]),
);
const patterns = Object.entries(english)
  .filter(([source]) => /\{\d+\}/.test(source))
  .flatMap(([source, value]) =>
    [source, value].map((pattern) => {
      const order = [];
      const regex = pattern
        .split(/(\{\d+\})/g)
        .map((part) =>
          /^\{\d+\}$/.test(part)
            ? (order.push(Number(part.slice(1, -1))), "(.*?)")
            : escape(part),
        )
        .join("");
      return { source, regex: new RegExp("^" + regex + "$", "s"), order };
    }),
  );
/** Only call on plugin-owned interface text and feedback, never resource contents. */
export function createGalleryText(code = "zh") {
  const language = normalizeLanguage(code);
  const translate = (source, ...values) => {
    if (typeof source !== "string") return source;
    if (["Gallery", "Skill", "Agent", "MCP", "Workflow"].includes(source))
      return source;
    let key = Object.hasOwn(english, source) ? source : reverse.get(source);
    if (!key && !values.length)
      for (const pattern of patterns) {
        const match = pattern.regex.exec(source);
        if (!match) continue;
        key = pattern.source;
        pattern.order.forEach((index, i) => {
          values[index] = match[i + 1];
        });
        break;
      }
    if (
      [
        "{0} 必须为 1–{1} 字符",
        "{0} 不能为空或超过 {1} 字符",
        "{0} 格式无效",
        "{0} 格式无效或过长",
        "{0} 必须是布尔值",
      ].includes(key || source)
    ) {
      const labelKey = Object.hasOwn(english, values[0] || "")
        ? values[0]
        : reverse.get(values[0]);
      if (labelKey)
        values[0] = language === "en" ? english[labelKey] : labelKey;
    }
    return format(
      language === "en" ? (english[key || source] ?? source) : key || source,
      values,
    );
  };
  return Object.assign(translate, { language });
}
