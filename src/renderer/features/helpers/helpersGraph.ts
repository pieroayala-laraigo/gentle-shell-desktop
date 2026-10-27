import type { HelperTask } from "@shared/bridge-types";

/**
 * Pure layout for the Helpers pane's Graph view (odd/tasks/desktop-helpers-graph.md
 * S3/S4). Deterministic on purpose: the main agent on the left, this chat's
 * helpers in one column ordered by start time, so the graph also reads as
 * a timeline. Edges are main agent -> helper delegations only — the
 * activity payload carries no fields for message, reply or result edges.
 */

export const MAIN_AGENT_NODE_ID = "main-agent";

const HELPER_COLUMN_X = 320;
const HELPER_ROW_GAP = 96;

export interface GraphPosition {
  readonly x: number;
  readonly y: number;
}

export interface MainAgentGraphNode {
  readonly id: typeof MAIN_AGENT_NODE_ID;
  readonly position: GraphPosition;
}

export interface HelperGraphNode {
  readonly id: string;
  readonly position: GraphPosition;
  readonly task: HelperTask;
}

export interface HelperGraphEdge {
  readonly id: string;
  readonly source: typeof MAIN_AGENT_NODE_ID;
  readonly target: string;
}

export interface HelpersGraphLayout {
  readonly mainNode: MainAgentGraphNode;
  readonly helperNodes: readonly HelperGraphNode[];
  readonly edges: readonly HelperGraphEdge[];
}

/** `startedAt`, else `createdAt` (queued helpers have not started); unparseable times sort last. */
function startTimeMs(task: HelperTask): number {
  const ms = Date.parse(task.startedAt ?? task.createdAt);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

/** Helpers by start time, ties keeping their incoming order. Never mutates `tasks`. */
export function orderHelpersByStart(tasks: readonly HelperTask[]): readonly HelperTask[] {
  return tasks
    .map((task, index) => ({ task, index, start: startTimeMs(task) }))
    .sort((a, b) => (a.start === b.start ? a.index - b.index : a.start < b.start ? -1 : 1))
    .map(({ task }) => task);
}

export function layoutHelpersGraph(tasks: readonly HelperTask[]): HelpersGraphLayout {
  const ordered = orderHelpersByStart(tasks);
  const helperNodes = ordered.map((task, index): HelperGraphNode => ({
    id: task.id,
    position: { x: HELPER_COLUMN_X, y: index * HELPER_ROW_GAP },
    task,
  }));
  // Vertically centered on the helper column.
  const mainNode: MainAgentGraphNode = {
    id: MAIN_AGENT_NODE_ID,
    position: { x: 0, y: (Math.max(ordered.length, 1) - 1) * HELPER_ROW_GAP * 0.5 },
  };
  const edges = ordered.map((task): HelperGraphEdge => ({ id: `${MAIN_AGENT_NODE_ID}->${task.id}`, source: MAIN_AGENT_NODE_ID, target: task.id }));

  return { mainNode, helperNodes, edges };
}
