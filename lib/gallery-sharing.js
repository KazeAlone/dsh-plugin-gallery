function bridge(ctx) {
    return ctx.get?.('gallery');
}
export function gallerySharingStatus(ctx) {
    const gallery = bridge(ctx);
    if (typeof gallery?.workflowSharingStatus !== 'function' || typeof gallery.uploadWorkflowTemplate !== 'function') {
        return { available: false, configured: false, reason: '请安装或升级 Gallery 到 0.32.0 以共享模板' };
    }
    try {
        const configured = gallery.workflowSharingStatus().configured === true;
        return {
            available: true, configured,
            reason: configured ? '' : '请先在 Gallery 存储设置中连接中心服务，再上传共享模板',
        };
    }
    catch {
        return { available: true, configured: false, reason: 'Gallery 存储配置不可用，请先检查存储设置' };
    }
}
/** Only called by authenticated human routes; the source template is read server-side. */
export async function uploadTemplateToGallery(ctx, template, language) {
    const status = gallerySharingStatus(ctx);
    if (!status.configured)
        throw new Error(status.reason);
    return bridge(ctx).uploadWorkflowTemplate(template, {
        id: template.id, version: template.version,
        ...(language ? { language } : {}),
    });
}
