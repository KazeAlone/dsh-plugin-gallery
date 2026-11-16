import type { TeamState } from './types.ts';
/** Install only generated paths. Existing identical exports are safe to retry. */
export declare function writeOpenCodeProject(workspace: string, team: TeamState): Promise<{
    name: string;
    workspace: string;
    readme: string;
}>;
