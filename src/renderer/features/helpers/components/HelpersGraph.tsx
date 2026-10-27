import { useCallback, useMemo } from "react";
import { Background, Controls, Handle, type Edge, type Node, type NodeMouseHandler, type NodeProps, Position, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { HelperTask } from "@shared/bridge-types";
import { formatElapsed, statusLabel } from "../format";
import { MAIN_AGENT_NODE_ID, layoutHelpersGraph } from "../helpersGraph";
import "./HelpersGraph.css";

export interface HelpersGraphProps {
  readonly tasks: readonly HelperTask[];
  readonly selectedTaskId?: string;
  readonly onSelect: (task: HelperTask) => void;
}

type MainAgentNodeType = Node<Record<string, never>, "mainAgent">;
type HelperNodeType = Node<{ task: HelperTask; selected: boolean; onSelect: (task: HelperTask) => void }, "helper">;

function MainAgentNode(_props: NodeProps<MainAgentNodeType>) {
  return (
    <div className="gc-helpers-graph__node gc-helpers-graph__node--main">
      <span className="gc-helpers-graph__title">Main agent</span>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

// A <button> inside the node (not React Flow's own node selection) so a
// graph node selects exactly like a HelperList row: keyboard-reachable,
// same onSelect, same aria-current.
function HelperNode({ data }: NodeProps<HelperNodeType>) {
  const { task, selected, onSelect } = data;
  const title = task.label || task.agent;
  const status = statusLabel(task.status);
  const elapsed = formatElapsed(task);
  const classes = ["gc-helpers-graph__node", selected && "gc-helpers-graph__node--selected"].filter(Boolean).join(" ");

  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <button
        type="button"
        className={classes}
        aria-label={["Helper " + title, status, elapsed].filter(Boolean).join(", ")}
        aria-current={selected || undefined}
        onClick={() => onSelect(task)}
      >
        <span className="gc-helpers-graph__title">{title}</span>
        <span className="gc-helpers-graph__meta">
          <span className={`gc-helpers-graph__dot gc-helpers-graph__dot--${task.status}`} aria-hidden="true" />
          <span>{status}</span>
          {elapsed && <span>{elapsed}</span>}
        </span>
      </button>
    </>
  );
}

// Matches HelpersGraph.css's node widths. Initial sizes let React Flow
// show and fit the nodes before its first DOM measurement.
const MAIN_NODE_SIZE = { initialWidth: 140, initialHeight: 40 };
const HELPER_NODE_SIZE = { initialWidth: 200, initialHeight: 56 };

// Stable module-level map: React Flow re-mounts every node when nodeTypes changes identity.
const NODE_TYPES = { mainAgent: MainAgentNode, helper: HelperNode };

// Presentational: this chat's helpers as a main agent -> helper graph
// (layout in ../helpersGraph.ts). Zoom and pan come from React Flow;
// nodes are not draggable or connectable — the layout is the timeline.
export function HelpersGraph({ tasks, selectedTaskId, onSelect }: HelpersGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const layout = layoutHelpersGraph(tasks);
    const graphNodes: (MainAgentNodeType | HelperNodeType)[] = [
      { id: MAIN_AGENT_NODE_ID, type: "mainAgent", position: layout.mainNode.position, data: {}, ...MAIN_NODE_SIZE },
      ...layout.helperNodes.map(
        (node): HelperNodeType => ({
          id: node.id,
          type: "helper",
          position: node.position,
          ...HELPER_NODE_SIZE,
          data: { task: node.task, selected: node.id === selectedTaskId, onSelect },
        }),
      ),
    ];
    const graphEdges: Edge[] = layout.edges.map((edge) => ({ ...edge, animated: edge.target === selectedTaskId }));
    return { nodes: graphNodes, edges: graphEdges };
  }, [tasks, selectedTaskId, onSelect]);

  const handleNodeClick = useCallback<NodeMouseHandler<MainAgentNodeType | HelperNodeType>>(
    (_event, node) => {
      if (node.type === "helper") onSelect(node.data.task);
    },
    [onSelect],
  );

  return (
    <div className="gc-helpers-graph" role="region" aria-label="Helpers graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        colorMode="dark"
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        // Without a node click handler, React Flow gives non-selectable,
        // non-draggable nodes `pointer-events: none` in a real browser.
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.2}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
