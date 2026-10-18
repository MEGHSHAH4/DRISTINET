import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import { InvestigationShell } from "@/layouts/InvestigationShell/investigation-shell";
import { CaseHeader } from "./components/case-header";
import { CaseOverviewView } from "./components/case-overview-view";
import { CaseStepNav } from "./components/case-step-nav";
import { CaseEvidenceView } from "./evidence/case-evidence-view";
import { CaseTimeline } from "./timeline/case-timeline";
import { CaseAuditView } from "./audit/case-audit-view";
import { CaseDetailSidebar } from "./components/case-detail-sidebar";
import { ProvenanceViewer } from "@/components/evidence/ProvenanceViewer";
import { useUIStore } from "@/stores/uiStore";
import { getCaseDetails } from "@/services/api/casesApi";
import type { CaseDetail } from "@/types/case";
import { Button } from "@/components/ui/button";
import { Lock, Radio, Database } from "lucide-react";

function UnknownView({ caseId }: { caseId: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 bg-surface-1">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 border border-border-subtle mb-4">
        <Layers className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">This view is not available</h3>
      <p className="mt-2 text-sm text-text-secondary text-center max-w-sm leading-relaxed">
        Please use the steps on the left to move through the case.
      </p>
      <Link to={`/cases/${caseId}`} className="mt-6">
        <Button variant="secondary" className="text-xs gap-1.5 shadow-sm">
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          Back to Start
        </Button>
      </Link>
    </div>
  );
}

function activeTabFor(pathname: string): string {
  if (pathname.endsWith("/timeline")) return "timeline";
  if (pathname.endsWith("/evidence")) return "evidence";
  if (pathname.endsWith("/audit")) return "audit";
  if (pathname.includes("/hitl")) return "hitl";
  if (pathname.endsWith("/graph")) return "graph";
  if (pathname.includes("/report")) return "report";
  return "overview";
}

export function CaseWorkspacePage() {
  const { caseId = "CASE-0001" } = useParams();
  const location = useLocation();
  const activeTab = activeTabFor(location.pathname);

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { caseInfoPanelExpanded, toggleCaseInfoPanel } = useUIStore();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!caseId) return;
      setIsLoading(true);
      try {
        const res = await getCaseDetails(caseId);
        if (isMounted && res.data) {
          setCaseData(res.data);
        }
      } catch {
        // Error loading case
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [caseId]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }
  if (!caseData) {
    return <div className="p-8 text-center text-text-muted">Could not load this case.</div>;
  }

  return (
    <>
      <InvestigationShell
        header={<CaseHeader caseData={caseData} activeTab={activeTab} />}
        caseNav={<CaseStepNav />}
        main={
          activeTab === "overview" ? (
            <CaseOverviewView caseData={caseData} />
          ) : activeTab === "timeline" ? (
            <CaseTimeline caseId={caseId} />
          ) : activeTab === "evidence" ? (
            <CaseEvidenceView />
          ) : activeTab === "audit" ? (
            <CaseAuditView caseId={caseId} />
          ) : (
            <UnknownView caseId={caseId} />
          )
        }
        detailPanel={
          <CaseDetailSidebar
            caseData={caseData}
            isCollapsed={!caseInfoPanelExpanded}
            onToggleCollapse={toggleCaseInfoPanel}
          />
        }
        isDetailPanelCollapsed={!caseInfoPanelExpanded}
        footer={
          <div className="flex h-10 items-center justify-between px-4 text-xs text-text-muted min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1 text-text-secondary shrink-0">
                <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-micro font-semibold uppercase">
                  {caseData.classification.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-border-strong shrink-0">|</span>
              <div className="flex items-center gap-1 shrink-0">
                <Radio className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-micro font-medium">Private details hidden</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 font-mono text-micro text-text-muted">
                <Database className="h-3 w-3 text-border-strong shrink-0" />
                <span className="hidden sm:inline">Secure</span>
              </div>
            </div>
          </div>
        }
      />

      <ProvenanceViewer />
    </>
  );
}
