import type { TeamState, TeamTask } from '../types.ts';
export declare function LoopPanel({ team, task, sessionId, base, archived, busy, perform, modeSelect, onSelectTask }: {
    team: TeamState;
    task: TeamTask;
    sessionId: string;
    base: string;
    archived: boolean;
    busy: boolean;
    modeSelect: import('react').ReactNode;
    onSelectTask: (id: string) => void;
    perform: (action: string, fields: Record<string, unknown>) => Promise<unknown>;
}): import("react").JSX.Element | null;
