import type { TeamState } from '../types.ts';
export declare function OpenCodeExport({ team, disabled, unsaved, sessionId, base, archived }: {
    team: TeamState;
    disabled: boolean;
    unsaved: boolean;
    sessionId?: string;
    base?: string;
    archived?: boolean;
}): import("react").JSX.Element;
