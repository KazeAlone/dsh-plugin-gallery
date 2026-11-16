import { useRef, useState } from 'react'
import type { TeamState } from '../types.ts'
import { openCodeFiles } from '../opencode-export.ts'
import { downloadTextZip } from './export-zip.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import { workflowMessage } from './workflow-text.ts'
import { workflowRequest } from './workflow-request.ts'
import css from './OpenCodeExport.module.css'

export function OpenCodeExport({ team, disabled, unsaved, sessionId, base, archived }: { team: TeamState; disabled: boolean; unsaved: boolean; sessionId?: string; base?: string; archived?: boolean }) {
  const l = useWorkflowText(), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ name: string; workspace?: string; readme: string }>()
  const dialog = useRef<HTMLDialogElement>(null)
  const label = (zh: string, en: string) => l.language === 'en' ? en : zh
  async function generate(project: boolean) {
    if (disabled || unsaved || busy) return
    setBusy(true); setError(''); setResult(undefined)
    try {
      if (project) {
        setResult(await workflowRequest({ action: 'opencode_project', sessionId, teamId: team.id, base, archived }))
      } else {
        const { name, files } = openCodeFiles(team)
        downloadTextZip(name, files)
        setResult({ name, readme: `teamflow/${name}/README.md` })
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }
  return <span><button type="button" disabled={disabled || unsaved || !team.tasks.length} title={unsaved ? l('请先保存属性草稿') : l('下载 OpenCode 轻量执行包；解压到项目后按 README 启动，执行规则由 AI 遵循。')} onClick={() => { setResult(undefined); setError(''); dialog.current?.showModal() }}>{l('导出 OpenCode')}</button>
    <dialog ref={dialog} className={css.dialog} aria-label={l('导出 OpenCode')} onCancel={event => { if (busy) event.preventDefault() }}>
      <h2>{result ? label('导出已生成', 'Export generated') : l('导出 OpenCode')}</h2>
      <p>{label('两种方式使用相同的执行包和 README 使用说明。只导出已保存的流程配置，从头执行，不迁移旧结果或审批。', 'Both options use the same package and README. Export saved configuration for a fresh run, without previous results or approvals.')}</p>
      {result ? <>
        <p>{result.workspace ? label('已生成到项目：', 'Generated in project: ') + result.workspace : label('已发起 ZIP 下载；请将 .opencode/ 和 teamflow/ 解压合并到目标项目根目录。', 'ZIP download started. Extract .opencode/ and teamflow/ into the target project root.')}</p>
        <ol><li>{label('在目标项目目录打开 OpenCode，使用已配置的模型。', 'Open OpenCode in the target project using your configured model.')}</li><li>{label('输入以下命令启动：', 'Run this command: ')}<code>/{result.name}</code></li><li>{label('遇到人工验收，在对话中明确回复通过或退回。', 'At human checkpoints, explicitly approve or reject in the conversation.')}</li></ol>
        <p>{label('完整说明：', 'Full instructions: ')}<code>{result.readme}</code></p>
      </> : <p>{label('生成到当前项目会写入该流程所属项目的 .opencode/ 和 teamflow/ 目录；相同内容可重复生成，已有不同内容不会覆盖。', 'Generate into this workflow’s project under .opencode/ and teamflow/. Identical files can be reused; different existing contents are never overwritten.')}</p>}
      {error && <p role="alert">{workflowMessage(error, l)}</p>}
      <div className={css.actions}>
        {!result && <><button type="button" disabled={busy || disabled || unsaved || !sessionId || !base} onClick={() => void generate(true)}>{busy ? label('正在生成…', 'Generating…') : label('生成到当前项目', 'Generate in project')}</button><button type="button" disabled={busy || disabled || unsaved} onClick={() => void generate(false)}>{label('下载 ZIP', 'Download ZIP')}</button></>}
        <button type="button" disabled={busy} onClick={() => dialog.current?.close()}>{label('关闭', 'Close')}</button>
      </div>
    </dialog>
  </span>
}
