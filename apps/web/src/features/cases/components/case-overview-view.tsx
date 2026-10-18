import type { CaseDetail } from "@/types/case";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, ListChecks, Network, FileText, ArrowRight, ShieldCheck } from "lucide-react";

interface CaseOverviewViewProps {
  caseData: CaseDetail;
}

const STEPS = [
  {
    no: "1",
    title: "Add evidence",
    what: "Upload files like call records or FIRs.",
    youDo: "You upload. The system safety-checks each file, then reads out names, phones, and possible links.",
    to: (id: string) => `/cases/${id}/evidence`,
    icon: Upload,
  },
  {
    no: "2",
    title: "Review matches",
    what: "The system suggests possible matches.",
    youDo: "You look at the proof and decide: Yes, No, or Later. Nothing is decided automatically.",
    to: (id: string) => `/cases/${id}/hitl`,
    icon: ListChecks,
  },
  {
    no: "3",
    title: "Connections map",
    what: "See people, phones, and places as a map.",
    youDo: "Click any dot to see why things are linked. Lines are suggestions, not proof.",
    to: (id: string) => `/cases/${id}/graph`,
    icon: Network,
  },
  {
    no: "4",
    title: "Make report",
    what: "Build a summary of what you found.",
    youDo: "Only things you reviewed and accepted go into the report.",
    to: (id: string) => `/cases/${id}/report`,
    icon: FileText,
  },
];

export function CaseOverviewView({ caseData }: CaseOverviewViewProps) {
  if (!caseData) {
    return <div className="p-8 text-center text-text-secondary">No case data available.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Welcome + steps */}
        <section className="space-y-1">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Start here — work through the 4 steps
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Follow the steps in order. Each one builds on the last.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.no}
                className="rounded-xl border border-border-subtle bg-surface-1 p-5 space-y-3 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-blue text-white text-sm font-bold shrink-0">
                    {s.no}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 text-electric-blue shrink-0" />
                    <h3 className="text-sm font-bold text-text-primary truncate">{s.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{s.what}</p>
                <p className="text-xs text-text-muted leading-relaxed flex-1">{s.youDo}</p>
                <Link to={s.to(caseData.id)}>
                  <Button variant="secondary" size="sm" className="w-full text-xs gap-1.5 h-9">
                    <span>Go to step {s.no}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Case facts in plain words */}
        <section className="rounded-xl border border-border-subtle bg-surface-1 p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">
            About this case
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-text-secondary block">Who can see this</span>
              <Badge tone="neutral" className="text-xs uppercase">
                {caseData.classification.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-secondary block">Area</span>
              <span className="text-sm font-medium text-text-primary">{caseData.jurisdiction}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-secondary block">Case owner</span>
              <span className="text-sm font-medium text-text-primary">{caseData.owner_id}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-secondary block">Reference number</span>
              <span className="text-sm font-medium text-text-primary">{caseData.authority_reference}</span>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-1.5 py-2 text-xs text-text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-verified-emerald shrink-0" />
          <span>Private details (like full phone numbers) stay hidden unless you have permission to see them.</span>
        </div>
      </div>
    </div>
  );
}
