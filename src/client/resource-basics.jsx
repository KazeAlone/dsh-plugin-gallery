import { useGalleryText } from "./i18n.jsx";
import React from 'react';

/** Shared first step keeps resource identity fields in the same position. */
export function ResourceBasics({ name, onName, description, onDescription, identifier, onIdentifier, identifierMax = 64, busy = false }) {
  const l = useGalleryText();
  return <div className="gal-skill-fields gal-resource-basics">
    <label>{l("名称")}<input aria-label={l("名称")} maxLength={160} value={name} disabled={busy} placeholder={l("为资源起一个便于识别的名称")} onChange={e => onName(e.target.value)} />
    </label>
    <label>{l("描述")}<textarea aria-label={l("描述")} rows={4} maxLength={1024} value={description} disabled={busy} placeholder={l("说明它能做什么，以及什么时候使用")} onChange={e => onDescription(e.target.value)} />
    </label>
    <p>{l("名称用于展示，描述用于帮助用户和 Agent 判断何时使用。")}</p>
    <details>
      <summary>{l("高级设置")}</summary>
      <label>{l("调用标识")}<input aria-label={l("调用标识")} maxLength={identifierMax} value={identifier} disabled={busy} onChange={e => onIdentifier(e.target.value)} />
      </label>
      <p>{l("用于系统调用，已自动生成，一般无需修改。")}</p>
    </details>
  </div>;
}
