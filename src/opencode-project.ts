import { lstat, mkdir, open, readFile, realpath, unlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { openCodeFiles } from './opencode-export.ts'
import type { TeamState } from './types.ts'

/** Install only generated paths. Existing identical exports are safe to retry. */
export async function writeOpenCodeProject(workspace: string, team: TeamState) {
  const root = await realpath(workspace)
  const { name, files } = openCodeFiles(team)
  const missing: string[] = [], created: string[] = []
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/')
    let target = root
    for (let i = 0; i < parts.length; i++) {
      target = join(target, parts[i]!)
      const stat = await lstat(target).catch(error => { if (error.code === 'ENOENT') return undefined; throw error })
      if (stat?.isSymbolicLink() || stat && (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new Error('导出路径包含链接或非普通文件，请先检查项目目录')
      if (i === parts.length - 1) {
        if (!stat) missing.push(path)
        else if (await readFile(target, 'utf8') !== content) throw new Error('已有同名导出文件且内容不同，请先备份或移走后再生成')
      }
    }
  }
  try {
    for (const path of missing) {
      const target = resolve(root, path)
      await mkdir(dirname(target), { recursive: true })
      const handle = await open(target, 'wx')
      created.push(target)
      try { await handle.writeFile(files[path]!, 'utf8') } finally { await handle.close() }
    }
  } catch (error) {
    await Promise.all(created.map(path => unlink(path).catch(() => {})))
    throw error
  }
  return { name, workspace: root, readme: `teamflow/${name}/README.md` }
}
