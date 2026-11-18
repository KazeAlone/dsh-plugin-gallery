import { roundBodyIds } from "./workflow-loop-types.js";
import { resultDigest } from "./review-results.js";
/** The existing wire field binds the submitted results for this round. */
export function loopArtifactEvidence(_workspace, team, loop) {
    const active = new Set(roundBodyIds(loop));
    return resultDigest(team.tasks.filter(task => active.has(task.id)));
}
