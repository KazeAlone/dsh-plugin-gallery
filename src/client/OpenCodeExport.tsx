import { useState } from 'react'
import type { TeamState } from '../types.ts'
import { openCodeFiles } from '../opencode-export.ts'
import { downloadTextZip } from './export-zip.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import { workflowMessage } from './workflow-text.ts'

export function OpenCodeExport({ team, disabled, unsaved }: { team: TeamState; disabled: boolean; unsaved: boolean }) {
  const l = useWorkflowText(), [error, setError] = useState('')
  function download() {
    if (disabled || unsaved) return
    setError('')
    try {
      const { name, files } = openCodeFiles(team)
      downloadTextZip(name, files)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  return <span><button type="button" disabled={disabled || unsaved || !team.tasks.length} title={unsaved ? l('请先保存属性草稿') : l('下载 OpenCode 轻量执行包；解压到项目后按 README 启动，执行规则由 AI 遵循。')} onClick={download}>{l('导出 OpenCode')}</button>{error && <span role="alert">{workflowMessage(error, l)}</span>}</span>
}
