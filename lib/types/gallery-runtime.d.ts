import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { type GalleryAccess } from './gallery-access.ts';
import type { MemberToolFilter } from './tool-policies.ts';
/** Bounded discovery is installed before a member's first request, including cold resumes. */
export declare function installMemberGalleryAccess(ctx: Context, child: Agent, input: GalleryAccess | undefined, filter?: MemberToolFilter): () => void;
