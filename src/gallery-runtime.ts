import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { parseGalleryAccess, type GalleryAccess } from './gallery-access.ts'
import type { MemberToolFilter } from './tool-policies.ts'

const skillTools = ['gallery_skill_search', 'gallery_skill_load'] as const
const mcpTools = ['gallery_mcp_search', 'gallery_mcp_tools', 'gallery_mcp_call'] as const

interface GalleryBridge {
  resourceCapabilities?: () => { version?: number; mode?: string; tools?: readonly string[] }
  setMemberAccess?: (agent: Agent, access: GalleryAccess & { resourceMode?: 'discovery' }) => () => void
}

/** Bounded discovery is installed before a member's first request, including cold resumes. */
export function installMemberGalleryAccess(
  ctx: Context,
  child: Agent,
  input: GalleryAccess | undefined,
  filter?: MemberToolFilter,
): () => void {
  const access = parseGalleryAccess({ ...input })
  if (access.gallerySkill === undefined && access.galleryMcp === undefined) return () => undefined
  const enabled = access.gallerySkill === true || access.galleryMcp === true
  const gallery = (ctx as unknown as { get(name: string): unknown }).get('gallery') as GalleryBridge | undefined
  if (!gallery) {
    if (enabled) throw new Error('此成员已启用 Gallery，请先安装并启用 Gallery 0.30.0 或更新版本')
    return () => undefined
  }
  if (typeof gallery.setMemberAccess !== 'function') throw new Error('请先升级 Gallery，以应用成员的 Skill / MCP 开关')
  if (!enabled) return gallery.setMemberAccess(child, access)

  const capabilities = typeof gallery.resourceCapabilities === 'function' ? gallery.resourceCapabilities() : undefined
  const required = [
    ...access.gallerySkill === true ? skillTools : [],
    ...access.galleryMcp === true ? mcpTools : [],
  ]
  if (capabilities?.mode !== 'discovery' || !Number.isInteger(capabilities.version) || (capabilities.version ?? 0) < 1
    || !Array.isArray(capabilities.tools) || required.some(name => !capabilities.tools!.includes(name))) {
    throw new Error('Gallery 按需访问不可用，请将 Gallery 升级到 0.30.0 或更新版本并重启 DSH')
  }
  // Neither a member switch nor discovery may relax an administrator's policy.
  // The original MCP tool is checked again by DSH during nested execution.
  const blocked = required.filter(name => filter?.deny.includes(name)
    || (filter?.allow !== undefined && !filter.allow.includes(name)))
  if (blocked.length) throw new Error(`成员工具策略禁止 Gallery 按需入口：${blocked.join(', ')}；请由管理员调整工具策略`)
  return gallery.setMemberAccess(child, { ...access, resourceMode: 'discovery' })
}
