import { useCallback, useEffect, useState } from "react";
import { HELPER_STATUS, type HelperTask, type HelpersActivity } from "@shared/bridge-types";
import { type HelperPartition, partitionHelpers } from "./format";
import { HelpersFooter } from "./components/HelpersFooter";
import { HelperList } from "./components/HelperList";
import { HelpersGraph } from "./components/HelpersGraph";
import { HelperThread } from "./components/HelperThread";
import { HelpersSummary } from "./components/HelpersSummary";
import { HELPERS_VIEW, type HelpersView, HelpersViewToggle } from "./components/HelpersViewToggle";
import "./HelpersContainer.css";

export interface HelpersContainerProps {
  readonly activity: HelpersActivity;
  readonly onBackToChat: () => void;
  /**
   * ISO timestamp of the moment this chat became active in the renderer
   * (set by ConversationContainer when `activeChat` changes). Draws the
   * line between "current" and "Earlier" helpers — see
   * format.ts's partitionHelpers.
   */
  readonly openedAt: string;
}

/** First running task, else first current task, else first earlier task — reached only when `current` is empty, i.e. the Earlier group is the only content (maintainer decision, 2026-09-22). */
function pickDefaultTaskId(partition: HelperPartition): string | undefined {
  const runningTask = partition.current.find((task) => task.status === HELPER_STATUS.RUNNING);
  if (runningTask) return runningTask.id;
  if (partition.current.length > 0) return partition.current[0]?.id;
  return partition.earlier[0]?.id;
}

/**
 * Owns the Helpers pane's own local view state (selected helper, Follow
 * live, Show tool details, List | Graph view) — no bridge calls: the data
 * is ChatState.helpers, already pushed into ConversationContainer. Left
 * pane: this chat's helpers as a list (the default) or a main agent ->
 * helper graph, never a global one (see odd/tasks/desktop-m2-helpers.md's
 * Objective and odd/tasks/desktop-helpers-graph.md). Both views share
 * the selection. Right pane: the selected helper's thread plus the footer.
 */
export function HelpersContainer({ activity, onBackToChat, openedAt }: HelpersContainerProps) {
  const partition = partitionHelpers(activity.tasks, openedAt);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(() => pickDefaultTaskId(partition));
  const [followLive, setFollowLive] = useState(true);
  const [showToolDetails, setShowToolDetails] = useState(false);
  const [view, setView] = useState<HelpersView>(HELPERS_VIEW.LIST);
  const handleSelect = useCallback((task: HelperTask) => setSelectedTaskId(task.id), []);

  // Keeps the current selection while its task is still present (even
  // once it finishes); re-picks a default — preferring a running task —
  // once the previously selected task drops out of the list (e.g. the
  // chat reopened with a fresh activity snapshot).
  useEffect(() => {
    setSelectedTaskId((current) => {
      if (current && activity.tasks.some((task) => task.id === current)) return current;
      return pickDefaultTaskId(partitionHelpers(activity.tasks, openedAt));
    });
  }, [activity.tasks, openedAt]);

  const selectedTask = activity.tasks.find((task) => task.id === selectedTaskId);
  const showGraph = view === HELPERS_VIEW.GRAPH && activity.tasks.length > 0;

  return (
    <div className="gc-helpers">
      <div className={showGraph ? "gc-helpers__list-pane gc-helpers__list-pane--graph" : "gc-helpers__list-pane"}>
        <HelpersSummary summary={activity.summary} />
        <HelpersViewToggle view={view} onSelectView={setView} />
        {showGraph ? (
          <HelpersGraph tasks={activity.tasks} selectedTaskId={selectedTaskId} onSelect={handleSelect} />
        ) : (
          <HelperList current={partition.current} earlier={partition.earlier} selectedTaskId={selectedTaskId} onSelect={handleSelect} />
        )}
      </div>
      <div className="gc-helpers__thread-pane">
        {selectedTask ? (
          <HelperThread task={selectedTask} showToolDetails={showToolDetails} followLive={followLive} />
        ) : (
          // Distinct wording from HelperList's own empty message (left
          // pane) so the two panes never render the exact same text twice.
          <p className="gc-helpers__empty">Nothing running for this chat yet.</p>
        )}
        <HelpersFooter
          followLive={followLive}
          showToolDetails={showToolDetails}
          onToggleFollowLive={setFollowLive}
          onToggleShowToolDetails={setShowToolDetails}
          onBackToChat={onBackToChat}
        />
      </div>
    </div>
  );
}
