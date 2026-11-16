import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { openCodeFiles } from "../opencode-export.js";
import { downloadTextZip } from "./export-zip.js";
import { useWorkflowText } from "./workflow-i18n.js";
import { workflowMessage } from "./workflow-text.js";
export function OpenCodeExport({ team, disabled, unsaved }) {
    const l = useWorkflowText(), [error, setError] = useState('');
    function download() {
        if (disabled || unsaved)
            return;
        setError('');
        try {
            const { name, files } = openCodeFiles(team);
            downloadTextZip(name, files);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }
    return _jsxs("span", { children: [_jsx("button", { type: "button", disabled: disabled || unsaved || !team.tasks.length, title: unsaved ? l('请先保存属性草稿') : l('下载 OpenCode 轻量执行包；解压到项目后按 README 启动，执行规则由 AI 遵循。'), onClick: download, children: l('导出 OpenCode') }), error && _jsx("span", { role: "alert", children: workflowMessage(error, l) })] });
}
