import type { TeamState } from './types.ts';
/** Export configuration by allowlist: never serialize the live team/session. */
export declare function openCodeFiles(team: TeamState): {
    name: string;
    files: Record<string, string>;
    definition: {
        schemaVersion: number;
        target: string;
        name: string;
        description: string | undefined;
        execution: string;
        members: {
            name: string;
            agent: string;
            summary: string | undefined;
            role: string | undefined;
            executionPrompt: string | undefined;
            specificPrompt: string | undefined;
        }[];
        tasks: {
            id: string;
            subject: string;
            description: string | undefined;
            assignee: string | undefined;
            dependencies: string[];
            kind: import("./types.ts").TaskKind;
            objective: string | undefined;
            inScope: string[] | undefined;
            outOfScope: string[] | undefined;
            acceptance: string[] | undefined;
            verify: string[] | undefined;
            checkpoint: {
                kind: string;
                mode: "human" | "ai";
            } | undefined;
            archive: {
                copyFiles: boolean;
                paths: string[];
            } | undefined;
        }[];
        loops: {
            bodyIds: string[];
            gateId: string;
            entryId: string;
            mode: "human" | "ai";
            reviewer?: string;
            rejectToEntry?: boolean;
            maxRounds: number;
            timeoutMinutes: number;
        }[];
    };
};
