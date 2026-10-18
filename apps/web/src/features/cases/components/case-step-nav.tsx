import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Home,
  Upload,
  ListChecks,
  Network,
  FileText,
  Clock,
  ScrollText,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepDef {
  id: string;
  /** Step number shown in a badge; undefined for non-step entries */
  stepNo?: string;
  label: string;
  /** One-line plain description shown under the label */
  hint: string;
  icon: LucideIcon;
  to: (caseId: string) => string;
  /** Returns true when the current path means this step is active */
  isActive: (pathname: string) => boolean;
}

const STEPS: StepDef[] = [
  {
    id: "start",
    label: "Start here",
    hint: "The 4 steps, in order",
    icon: Home,
    to: (id) => `/cases/${id}`,
    isActive: (p) => /\/cases\/[^/]+(\/overview)?$/.test(p),
  },
  {
    id: "evidence",
    stepNo: "1",
    label: "Add evidence",
    hint: "Upload files to work with",
    icon: Upload,
    to: (id) => `/cases/${id}/evidence`,
    isActive: (p) => p.endsWith("/evidence"),
  },
  {
    id: "review",
    stepNo: "2",
    label: "Review matches",
    hint: "You decide what is correct",
    icon: ListChecks,
    to: (id) => `/cases/${id}/hitl`,
    isActive: (p) => p.includes("/hitl"),
  },
  {
    id: "map",
    stepNo: "3",
    label: "Connections map",
    hint: "See how things link together",
    icon: Network,
    to: (id) => `/cases/${id}/graph`,
    isActive: (p) => p.endsWith("/graph"),
  },
  {
    id: "report",
    stepNo: "4",
    label: "Make report",
    hint: "Summarize what you found",
    icon: FileText,
    to: (id) => `/cases/${id}/report`,
    isActive: (p) => p.includes("/report"),
  },
];

const MORE_TOOLS: StepDef[] = [
  {
    id: "timeline",
    label: "Timeline",
    hint: "Events in time order",
    icon: Clock,
    to: (id) => `/cases/${id}/timeline`,
    isActive: (p) => p.endsWith("/timeline"),
  },
  {
    id: "activity",
    label: "Activity log",
    hint: "Who did what, and when",
    icon: ScrollText,
    to: (id) => `/cases/${id}/audit`,
    isActive: (p) => p.endsWith("/audit"),
  },
];

function StepRow({ step, caseId }: { step: StepDef; caseId: string }) {
  const { pathname } = useLocation();
  const active = step.isActive(pathname);
  const Icon = step.icon;
  return (
    <li>
      <Link
        to={step.to(caseId)}
        className={cn(
          "flex items-start gap-2.5 rounded-md px-2.5 py-2 transition-colors min-w-0",
          active
            ? "bg-electric-blue/10 border-l-2 border-electric-blue"
            : "border-l-2 border-transparent hover:bg-surface-2",
        )}
      >
        {step.stepNo ? (
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5",
              active ? "bg-electric-blue text-white" : "bg-surface-2 text-text-muted border border-border-subtle",
            )}
          >
            {step.stepNo}
          </span>
        ) : (
          <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", active ? "text-electric-blue" : "text-text-muted")} />
        )}
        <span className="min-w-0">
          <span className={cn("block text-xs font-semibold truncate", active ? "text-electric-blue" : "text-text-primary")}>
            {step.label}
          </span>
          <span className="block text-[11px] text-text-muted leading-snug mt-0.5">{step.hint}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * The single navigation for every case page: 4 numbered steps plus
 * a collapsed "More tools" section. Plain labels, one-line hints,
 * nothing hidden behind jargon.
 */
export function CaseStepNav() {
  const { caseId = "" } = useParams();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(MORE_TOOLS.some((t) => t.isActive(pathname)));

  return (
    <nav className="p-2 min-w-0 select-none" aria-label="Case steps">
      <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted truncate">
        Work through the steps
      </div>
      <ul className="flex flex-col gap-0.5 mt-1">
        {STEPS.map((s) => (
          <StepRow key={s.id} step={s} caseId={caseId} />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
        aria-expanded={moreOpen}
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
        More tools
      </button>
      {moreOpen && (
        <ul className="flex flex-col gap-0.5 mt-0.5">
          {MORE_TOOLS.map((s) => (
            <StepRow key={s.id} step={s} caseId={caseId} />
          ))}
        </ul>
      )}
    </nav>
  );
}
