import type { Context } from '@deepseek-ai/cordis'
import type { TemplateDefinition, TemplateVersion } from './templates.ts'

interface GallerySharing {
  workflowSharingStatus?: () => { configured: boolean; libraryId?: string }
  uploadWorkflowTemplate?: (
    definition: TemplateDefinition,
    source: { id: string; version: number; language?: 'zh' | 'en' },
  ) => Promise<{ id: string; name: string; libraryId: string; sourceVersion: number; reused: boolean }>
}

function bridge(ctx: Context): GallerySharing | undefined {
  return ctx.get?.('gallery') as GallerySharing | undefined
}

export function gallerySharingStatus(ctx: Context): { available: boolean; configured: boolean; reason: string } {
  const gallery = bridge(ctx)
  if (typeof gallery?.workflowSharingStatus !== 'function' || typeof gallery.uploadWorkflowTemplate !== 'function') {
    return { available: false, configured: false, reason: '请安装或升级 Gallery 到 0.32.1 以上版本以支持上传模板' }
  }
  try {
    const status = gallery.workflowSharingStatus()
    if (status.libraryId !== 'local' && status.libraryId !== 'center') {
      return { available: false, configured: false, reason: '请安装或升级 Gallery 到 0.32.1 以上版本以支持上传模板' }
    }
    const configured = status.configured === true
    return {
      available: true, configured,
      reason: configured ? '' : '请先在 Gallery 存储设置中重新连接中心服务',
    }
  } catch {
    return { available: true, configured: false, reason: 'Gallery 存储配置不可用，请先检查存储设置' }
  }
}

/** Only called by authenticated human routes; the source template is read server-side. */
export async function uploadTemplateToGallery(ctx: Context, template: TemplateVersion, language?: 'zh' | 'en') {
  const status = gallerySharingStatus(ctx)
  if (!status.configured) throw new Error(status.reason)
  return bridge(ctx)!.uploadWorkflowTemplate!(template, {
    id: template.id, version: template.version,
    ...(language ? { language } : {}),
  })
}
