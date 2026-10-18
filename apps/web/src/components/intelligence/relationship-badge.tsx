import { AlertTriangle, ArrowLeftRight, MapPinned, Phone, ShieldHalf, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RelationshipType } from "@/types/entity";
import { cn } from "@/lib/utils";

const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, { label: string; icon: typeof Phone }> = {
  COMMUNICATED_WITH: { label: "Communicated With", icon: Phone },
  TRANSFERRED_FUNDS: { label: "Transferred Funds", icon: ArrowLeftRight },
  USED_DEVICE: { label: "Used Device", icon: ShieldHalf },
  USED_PHONE: { label: "Used Phone", icon: Phone },
  CO_LOCATED_AT: { label: "Co-Located At", icon: MapPinned },
  ASSOCIATED_IN_CASE: { label: "Associated In Case", icon: Users },
};

interface RelationshipBadgeProps {
  type: string;
  /** Contradictions must always be visible, never silently resolved (spec §18/§10). */
  hasContradiction?: boolean;
  className?: string;
}

/** Human-readable label for any relationship type, including ones outside the old 6-type list. */
function humanizeType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function RelationshipBadge({ type, hasContradiction = false, className }: RelationshipBadgeProps) {
  const config = (RELATIONSHIP_TYPE_CONFIG as Record<string, { label: string; icon: typeof Phone }>)[type];
  const Icon = config?.icon ?? ArrowLeftRight;
  const label = config?.label ?? humanizeType(type);

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge tone="neutral">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </Badge>
      {hasContradiction && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge tone="red" className="font-semibold">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Contradiction
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            <p className="text-text-secondary">
              Conflicting assertions exist for this relationship. Resolution status must be
              reviewed before this edge is treated as trustworthy.
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export { RelationshipBadge };
