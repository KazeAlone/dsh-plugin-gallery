import type { Context } from '@deepseek-ai/cordis';
import type { TemplateVersion } from './templates.ts';
export declare function gallerySharingStatus(ctx: Context): {
    available: boolean;
    configured: boolean;
    reason: string;
};
/** Only called by authenticated human routes; the source template is read server-side. */
export declare function uploadTemplateToGallery(ctx: Context, template: TemplateVersion, language?: 'zh' | 'en'): Promise<{
    id: string;
    name: string;
    libraryId: string;
    sourceVersion: number;
    reused: boolean;
}>;
