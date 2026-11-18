import type { TeamTask } from '../types.ts';
export interface CanvasPoint {
    x: number;
    y: number;
}
type LayoutTask = Pick<TeamTask, 'id' | 'dependencies'>;
/** Historical review links are display-only and never enter the dependency graph. */
export declare function reviewHistoryEdges(tasks: readonly Pick<TeamTask, 'id' | 'dependencies' | 'checkpoint'>[]): {
    from: string;
    to: string;
}[];
export interface LayoutLoop {
    gateId: string;
    entryId: string;
    bodyIds?: readonly string[];
    rejectTaskIds?: readonly string[];
    rejectDag?: true;
}
/** Template configs carry entry/gate IDs; runtime loops also carry the derived body. */
export declare function loopBodyIds(tasks: readonly LayoutTask[], loop: LayoutLoop): string[];
/** Collapse each loop into a region before arranging the surrounding DAG. */
export declare function arrangeWorkflow(tasks: LayoutTask[], loops?: readonly LayoutLoop[]): Record<string, CanvasPoint>;
export declare function loopRegion(tasks: readonly LayoutTask[], loop: LayoutLoop, position: (id: string) => CanvasPoint, cardWidth?: number, cardHeight?: number): {
    x: number;
    y: number;
    width: number;
    height: number;
    bottom: number;
    returnPath: string;
    returnPaths: string[];
    label: {
        x: number;
        y: number;
    };
};
/** Fixed-height cards and generous gutters keep branches and long titles apart. */
export declare function arrangeTasks(tasks: Pick<TeamTask, 'id' | 'dependencies'>[]): Record<string, CanvasPoint>;
export declare const clampZoom: (value: number) => number;
export declare function fitGraph(width: number, height: number, graphWidth: number, graphHeight: number): number;
/** Give intersecting horizontal spans separate lanes, and reuse lanes for disjoint spans. */
export declare function createRejectLaneRouter(firstLane: number): {
    lane(from: CanvasPoint, to: CanvasPoint): number;
    offset(lane: number): number;
    readonly bottom: number;
};
export declare function loopReturnPaths(tasks: readonly LayoutTask[], loop: Omit<LayoutLoop, 'entryId'> & {
    entryId?: string;
}, position: (id: string) => CanvasPoint, lane: number | ((from: CanvasPoint, to: CanvasPoint) => number), laneOffset?: (lane: number) => number): string[];
export {};
