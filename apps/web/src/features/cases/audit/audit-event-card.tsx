import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Network,
  Filter,
  GitBranch,
  FileCheck,
  Award,
  FilePlus,
  FileEdit,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Eye,
  Download,
  Copy,
  Check,
  ExternalLink,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuditLogEntry, AuditActionType } from "@/types/audit";

interface AuditEventCardProps {
  log: AuditLogEntry;
  blockNumber: number;
  onInspect: (log: AuditLogEntry) => void;
}

function maskIpAddress(ip: string): string {
  if (!ip || ip.includes("No IP")) return "(No IP Logged)";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return "***.***.***.***";
}

function maskPhoneNumbersInText(text: string): string {
  if (!text) return text;
  return text.replace(/\b(\+?91[\s-]?)?([6-9]\d{2})[\s-]?(\d{3})[\s-]?(\d{4})\b/g, "$1$2-***-****");
}

function formatDetailedTimestamp(isoStr: string) {
  const d = new Date(isoStr);
  return (
    d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  );
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getActionConfig(action: AuditActionType): {
  label: string;
  tone: "neutral" | "blue" | "amber" | "orange" | "emerald" | "purple" | "red" | "gray";
  icon: typeof FileText;
} {
  switch (action) {
    case "CASE_VIEW":
    case "DOCKET_OPENED":
      return { label: "Case opened", tone: "neutral", icon: FileText };
    case "VIEW_GRAPH":
    case "GRAPH_VIEW":
      return { label: "Map opened", tone: "blue", icon: Network };
    case "FILTER_GRAPH":
      return { label: "Map filtered", tone: "blue", icon: Filter };
    case "EXPAND_NODE":
    case "ENTITY_VIEW":
    case "EDGE_VIEW":
      return { label: "Item opened", tone: "blue", icon: GitBranch };
    case "VIEW_EVIDENCE":
    case "EVIDENCE_VIEW":
      return { label: "File opened", tone: "emerald", icon: FileCheck };
    case "EVIDENCE_UPLOAD":
      return { label: "File uploaded", tone: "emerald", icon: FilePlus };
    case "EVIDENCE_DOWNLOAD":
      return { label: "File downloaded", tone: "blue", icon: Download };
    case "EVIDENCE_VERIFY":
    case "EVIDENCE_PROCESS":
    case "SCAN_RESULT":
      return { label: "File checked", tone: "emerald", icon: ShieldCheck };
    case "EVIDENCE_CONTEXT":
      return { label: "File details viewed", tone: "neutral", icon: FileText };
    case "UPDATE_TIER":
      return { label: "Tier changed", tone: "emerald", icon: Award };
    case "CREATE_NOTE":
      return { label: "Note added", tone: "purple", icon: FilePlus };
    case "UPDATE_NOTE":
      return { label: "Note edited", tone: "purple", icon: FileEdit };
    case "DELETE_NOTE":
      return { label: "Note deleted", tone: "red", icon: Trash2 };
    case "UNMASK":
      return { label: "Hidden details shown", tone: "amber", icon: Eye };
    case "REVIEW_DECISION":
      return { label: "Match decided", tone: "orange", icon: Scale };
    case "REVIEW_VIEW":
    case "REVIEW_QUEUE":
      return { label: "Review list opened", tone: "neutral", icon: FileText };
    case "TIMELINE_VIEW":
      return { label: "Timeline opened", tone: "blue", icon: FileText };
    case "LOCATION_VIEW":
      return { label: "Location opened", tone: "blue", icon: FileText };
    case "INTEGRITY_VIEW":
    case "INTEGRITY_PROOF":
    case "INTEGRITY_ANCHOR":
      return { label: "Safety check", tone: "emerald", icon: ShieldCheck };
    case "AUDIT_VIEW":
      return { label: "Activity log opened", tone: "neutral", icon: FileText };
    case "EXPORT":
      return { label: "Report exported", tone: "blue", icon: Download };
    case "LOGIN":
      return { label: "Signed in", tone: "neutral", icon: ShieldCheck };
    case "ACCESS_DENIED":
      return { label: "Access blocked", tone: "red", icon: ShieldAlert };
    default:
      return { label: humanizeAction(action), tone: "neutral", icon: FileText };
  }
}

export function AuditEventCard({
  log,
  blockNumber,
  onInspect,
}: AuditEventCardProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  const actionConfig = getActionConfig(log.action);
  const ActionIcon = actionConfig.icon;

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(log.trace_id);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const actionDescription =
    (log.detail.actionDescription as string) ||
    `${actionConfig.label} — ${log.target_id ? `ref ${log.target_id}` : "this case"}`;

  const maskedDescription = maskPhoneNumbersInText(actionDescription);

  const getTargetLink = () => {
    if (!log.target_id) return null;
    if (log.target_kind === "ENTITY") {
      return `/cases/${log.case_id}/graph?entityId=${encodeURIComponent(log.target_id)}`;
    }
    if (log.target_kind === "EVIDENCE") {
      return `/cases/${log.case_id}/evidence?evidenceId=${encodeURIComponent(log.target_id)}`;
    }
    if (log.target_kind === "NOTE") {
      return `/cases/${log.case_id}/notes?targetId=${encodeURIComponent(log.target_id)}`;
    }
    if (log.target_kind === "GRAPH" || log.target_kind === "RELATIONSHIP") {
      return `/cases/${log.case_id}/graph`;
    }
    return null;
  };

  const targetLink = getTargetLink();
  // Never show raw internal user IDs — plain words only.
  const actorName = !log.actor_id
    ? "System"
    : /^USR-[0-9a-f]+$/i.test(log.actor_id)
      ? "Team member"
      : log.actor_id;
  const actorRole = log.actor_id ? "TEAM" : "SYSTEM";

  return (
    <div
      onClick={() => onInspect(log)}
      className="group relative flex flex-col gap-2.5 rounded-lg border border-border-subtle bg-surface-1 p-3.5 hover:border-electric-blue/50 hover:bg-surface-2/60 transition-all cursor-pointer shadow-sm"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="font-mono text-xs font-bold text-electric-blue bg-electric-blue/10 border border-electric-blue/20 rounded px-1.5 py-0.5 shrink-0">
          #{String(blockNumber).padStart(2, "0")}
        </span>
        <ActionIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <Badge tone={actionConfig.tone} className="text-[10px] tracking-wider uppercase font-semibold shrink-0">
          {actionConfig.label}
        </Badge>
        <span className="text-micro font-mono text-text-muted">
          {formatDetailedTimestamp(log.created_at)}
        </span>
        <span className="text-micro text-text-muted ml-auto flex items-center gap-1.5">
          Ref:
          <code className="text-[11px] font-mono text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded border border-border-subtle">
            {log.trace_id.slice(0, 8)}...
          </code>
          <button
            type="button"
            onClick={handleCopyHash}
            className="text-text-muted hover:text-electric-blue p-0.5"
          >
            {copiedHash ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </span>
      </div>

      <p className="text-xs text-text-primary leading-relaxed font-sans">
        {maskedDescription}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-text-muted">
        <span className="text-text-secondary font-medium">
          {actorName}
        </span>
        <span>•</span>
        <span>{actorRole === "TEAM" ? "Team" : "System"}</span>

        {targetLink && log.target_id && (
          <>
            <span>•</span>
            <Link
              to={targetLink}
              onClick={(e) => e.stopPropagation()}
              className="text-electric-blue hover:underline inline-flex items-center gap-0.5"
              title="Open in context"
            >
              Open related item
              <ExternalLink className="h-2.5 w-2.5 inline" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
