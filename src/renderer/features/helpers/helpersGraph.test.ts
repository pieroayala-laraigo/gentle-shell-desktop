import { describe, expect, it } from "vitest";
import type { HelperTask } from "@shared/bridge-types";
import { MAIN_AGENT_NODE_ID, layoutHelpersGraph, orderHelpersByStart } from "./helpersGraph";

function task(overrides: Partial<HelperTask> = {}): HelperTask {
  return {
    id: "task-1",
    agent: "a",
    label: "Task",
    prompt: "p",
    status: "queued",
    createdAt: "2026-09-22T10:00:00.000Z",
    turns: 0,
    toolCalls: 0,
    thread: { version: 0, dropped: 0, items: [] },
    ...overrides,
  };
}

describe("orderHelpersByStart", () => {
  it("orders helpers by startedAt, using createdAt for helpers that have not started", () => {
    const tasks = [
      task({ id: "late", startedAt: "2026-09-22T10:00:30.000Z" }),
      task({ id: "queued", createdAt: "2026-09-22T10:00:20.000Z" }),
      task({ id: "early", createdAt: "2026-09-22T09:00:00.000Z", startedAt: "2026-09-22T10:00:10.000Z" }),
    ];

    expect(orderHelpersByStart(tasks).map((t) => t.id)).toEqual(["early", "queued", "late"]);
  });

  it("keeps the incoming order for ties and puts unparseable times last", () => {
    const tasks = [
      task({ id: "bad", createdAt: "not-a-date" }),
      task({ id: "a", startedAt: "2026-09-22T10:00:00.000Z" }),
      task({ id: "b", startedAt: "2026-09-22T10:00:00.000Z" }),
    ];

    expect(orderHelpersByStart(tasks).map((t) => t.id)).toEqual(["a", "b", "bad"]);
  });

  it("does not mutate its input", () => {
    const tasks = [task({ id: "2", startedAt: "2026-09-22T10:00:02.000Z" }), task({ id: "1", startedAt: "2026-09-22T10:00:01.000Z" })];
    orderHelpersByStart(tasks);
    expect(tasks.map((t) => t.id)).toEqual(["2", "1"]);
  });
});

describe("layoutHelpersGraph", () => {
  const tasks = [
    task({ id: "second", startedAt: "2026-09-22T10:00:20.000Z" }),
    task({ id: "first", startedAt: "2026-09-22T10:00:10.000Z" }),
    task({ id: "third", startedAt: "2026-09-22T10:00:30.000Z" }),
  ];

  it("has one main agent node plus one node per helper, in start order", () => {
    const { mainNode, helperNodes } = layoutHelpersGraph(tasks);

    expect(mainNode.id).toBe(MAIN_AGENT_NODE_ID);
    expect(helperNodes.map((node) => node.task.id)).toEqual(["first", "second", "third"]);
  });

  it("puts the main agent on the left and the helpers in a top-to-bottom column", () => {
    const { mainNode, helperNodes } = layoutHelpersGraph(tasks);

    const xs = new Set(helperNodes.map((node) => node.position.x));
    expect(xs.size).toBe(1);
    expect(mainNode.position.x).toBeLessThan(helperNodes[0]!.position.x);
    const ys = helperNodes.map((node) => node.position.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(new Set(ys).size).toBe(ys.length);
  });

  it("only draws main agent -> helper edges, one per helper", () => {
    const { edges } = layoutHelpersGraph(tasks);

    expect(edges).toEqual([
      { id: `${MAIN_AGENT_NODE_ID}->first`, source: MAIN_AGENT_NODE_ID, target: "first" },
      { id: `${MAIN_AGENT_NODE_ID}->second`, source: MAIN_AGENT_NODE_ID, target: "second" },
      { id: `${MAIN_AGENT_NODE_ID}->third`, source: MAIN_AGENT_NODE_ID, target: "third" },
    ]);
  });

  it("is deterministic for the same input", () => {
    expect(layoutHelpersGraph(tasks)).toEqual(layoutHelpersGraph(tasks));
  });
});
