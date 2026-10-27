# Gentle Shell Desktop: helpers graph (proposal 0001 PoC)

Feature document (ODD). Fork: pieroayala-laraigo/gentle-shell-desktop, branch `feat/helpers-graph` from `upstream/main` (`5ab4a00`). Engram mirror: `odd/desktop-helpers-graph/tasks`. Coordination: gentle-shell-desktop#28 (comment 6446145704), community proposal `docs/07-proposals/0001-agent-flow-graph.md` (PR #29).
Scope is limited to data the runtime already publishes (`gentle-agents.activity/v1`); no gentle-shell changes.

## Specs

- S1 Location. User decision: "Vista dentro de Helpers (Recomendado)": "Toggle Lista | Grafo dentro de la pestaña Helpers de cada chat. Reusa los datos que ya llegan, es un PR chico y encaja con el diseño upstream (\"per chat, never a global list\")." UI copy is English: a `List | Graph` toggle in the existing per-chat Helpers pane. List stays the default view.
- S2 Library. User decision: "React Flow / @xyflow (Recomendado)": "MIT, estándar de facto ... Zoom, pan y layout listos." Use `@xyflow/react`; zoom and pan enabled.
- S3 Nodes. One node for the chat's main agent plus one node per helper in that chat's `gentle-agents.activity/v1` tasks. Each helper node shows its label (or agent), status (queued, running, waiting, done, failed, using the statuses the app already handles) and elapsed time. Helpers are ordered by start time (queued helpers without a start use creation time), so the graph also reads as a timeline.
- S4 Edges. Only main agent -> helper delegation edges. No message, question/reply, result or steering edges (the payload has no fields for them).
- S5 Selection. Selecting a helper node opens that helper's thread in the existing Helpers pane, the same as selecting it in the list.
- S6 Scope. Per chat only, never a global graph (maintainer decision, `odd/tasks/desktop-m2-helpers.md`).
- S7 Preview. `pnpm dev:web` (mock bridge) shows the graph with the mock's helpers, so screenshots can be shared in #28 before any upstream PR.
- S8 Docs. README "Helpers tab" section mentions the List | Graph toggle.

## Tasks

- T1 [S1-S6, S8] Graph view in the Helpers pane, tests, dependency, README. Route: gentle-ai-worker (background). Commit: this feature commit on feat/helpers-graph.
- T2 [S7] Browser verification on `pnpm dev:web` with screenshots. Route: inline after T1. Commit: with T1. Done: 5 helper nodes, 5 edges, node click opens the thread, List toggle returns.
- T3 [S1-S8] Independent verification (new dependency = high-risk item 5). Route: gentle-ai-verify. Commit: none. Done: S1-S6, S8 pass; S7 verified by parent in browser; no blockers; licenses MIT/ISC/BSD-3 (d3-ease); lockfile adds 20 packages, no version changes, ~40 snapshot keys gain (supports-color@7.2.0).

## Log

- L1 (user, original request, 2026-10-27): "El objetivo es construir una capa de frontend para todo este harness, workflow, o sea tú. Dime la viabilidad, se puede hacer? Que todo sea mucho más visual. Pensando también en que toda la instalación más sencilla, que todo esté empaquetado (todas las herramientas que tienes, incluso), pero que haya una capa de chat, alguna pestaña de seguimiento de lo que hacen los agentes, pero de una manera muy visual, repito."
- L2 (user decisions, 2026-10-27): fork-to-contribute on gentle-shell-desktop; views in order: live agent graph -> timeline/Gantt -> ODD kanban -> ODD phase pipeline; next slice "Grafo de agentes (Recomendado)"; location "Vista dentro de Helpers"; library "React Flow / @xyflow"; coordination "Avisar y construir" (comment posted on #28).
- L4 (evidence, T2): in a real browser, helper nodes did not receive clicks: with `elementsSelectable` and `nodesDraggable` false and no `onNodeClick`, React Flow sets `pointer-events: none` on nodes (jsdom tests could not see it). Fixed with an `onNodeClick` handler; re-verified with Playwright on `pnpm dev:web`.
- L3 (evidence): proposal 0001 states parent session and message linkage are absent from `gentle-agents.activity/v1`; only main -> helper star edges are buildable today.
- L5 (evidence, lockfile): regenerating upstream's lockfile with upstream's package.json (pnpm 11.27.1 and 11.28.9) reproduces it byte-for-byte; adding `@xyflow/react` makes pnpm rewrite ~40 existing snapshot keys with `(supports-color@7.2.0)` and link `supports-color` as `debug`'s optional peer. No version changes. This is pnpm's resolution of the new graph, not a pnpm version mismatch, so the lockfile is kept as generated.
