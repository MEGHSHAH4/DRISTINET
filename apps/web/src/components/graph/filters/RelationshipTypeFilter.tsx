import { Checkbox } from "@/components/ui/checkbox";
import { RelationshipBadge } from "@/components/intelligence/relationship-badge";
import { useGraphStore } from "@/stores/graphStore";
import { cn } from "@/lib/utils";

/** Plain-English labels for relationship types (API vocabulary + legacy names). */
function humanizeRelType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function RelationshipTypeFilter() {
  const {
    activeRelationshipTypes,
    availableRelationshipTypes,
    toggleRelationshipType,
    selectAllRelationshipTypes,
    clearRelationshipTypes,
    edges,
  } = useGraphStore();

  const getEdgeCountByType = (type: string) => {
    return edges.filter((e) => e.relationshipType === type).length;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-micro font-semibold uppercase tracking-wider text-text-muted">
          Connection Types
        </span>
        <div className="flex items-center gap-2 text-micro">
          <button
            type="button"
            onClick={selectAllRelationshipTypes}
            className="text-teal-primary hover:underline font-medium"
          >
            All
          </button>
          <span className="text-border-strong">&bull;</span>
          <button
            type="button"
            onClick={clearRelationshipTypes}
            className="text-text-muted hover:text-text-primary"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {availableRelationshipTypes.map((type) => {
          const isChecked = activeRelationshipTypes.has(type);
          const count = getEdgeCountByType(type);

          return (
            <label
              key={type}
              htmlFor={`rel-filter-${type}`}
              className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-surface-2 cursor-pointer transition-colors text-xs"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`rel-filter-${type}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleRelationshipType(type)}
                  aria-label={`Filter by ${humanizeRelType(type)}`}
                />
                <RelationshipBadge type={type} />
              </div>
              <span className="font-mono text-micro text-text-muted">
                {count}
              </span>
            </label>
          );
        })}
        {availableRelationshipTypes.length === 0 && (
          <p className={cn("text-xs text-text-muted")}>No connections loaded yet.</p>
        )}
      </div>
    </div>
  );
}
