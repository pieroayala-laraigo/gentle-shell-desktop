import "./HelpersViewToggle.css";

export const HELPERS_VIEW = {
  LIST: "list",
  GRAPH: "graph",
} as const;

export type HelpersView = (typeof HELPERS_VIEW)[keyof typeof HELPERS_VIEW];

export interface HelpersViewToggleProps {
  readonly view: HelpersView;
  readonly onSelectView: (view: HelpersView) => void;
}

const OPTIONS: readonly { readonly view: HelpersView; readonly label: string }[] = [
  { view: HELPERS_VIEW.LIST, label: "List" },
  { view: HELPERS_VIEW.GRAPH, label: "Graph" },
];

// Presentational: the `List | Graph` segmented toggle above this chat's helpers.
export function HelpersViewToggle({ view, onSelectView }: HelpersViewToggleProps) {
  return (
    <div className="gc-helpers-view-toggle" role="group" aria-label="Helpers view">
      {OPTIONS.map((option) => (
        <button
          key={option.view}
          type="button"
          className="gc-helpers-view-toggle__option"
          aria-pressed={option.view === view}
          onClick={() => onSelectView(option.view)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
