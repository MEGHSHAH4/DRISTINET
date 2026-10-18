import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileDown,
  Layers,
  Eye,
  PanelRight,
  Info,
} from "lucide-react";
import { InvestigationShell } from "@/layouts/InvestigationShell/investigation-shell";
import { CaseStepNav } from "./components/case-step-nav";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { EntityDrawer } from "@/components/graph/drawers/EntityDrawer";
import { EdgeDrawer } from "@/components/graph/drawers/EdgeDrawer";
import { EmptyDrawer } from "@/components/graph/drawers/EmptyDrawer";
import { TemporalSlider } from "@/components/graph/TemporalSlider";
import { ProvenanceViewer } from "@/components/evidence/ProvenanceViewer";
import { Button } from "@/components/ui/button";
import { useGraphStore } from "@/stores/graphStore";
import { cn } from "@/lib/utils";

export function CaseGraphPage() {
  const {  caseId = "" } = useParams();
  const { 
    
    selectedNodeId,
    selectedEdgeId,
    loadGraph,
    isLoading,
    showCoreConnectionsOnly,
    toggleShowCoreConnectionsOnly,
  } = useGraphStore();

  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const isDrawerOpen = Boolean(selectedNodeId || selectedEdgeId) || !isDrawerCollapsed;

  useEffect(() => {
    loadGraph(caseId);
    if (typeof window !== "undefined") {
      (window as any).__graphStore = useGraphStore;
    }
  }, [ loadGraph]);

  return (
    <>
      <InvestigationShell
        header={
          <div className="flex flex-col bg-surface-1 select-none">
            <div className="flex h-14 items-center justify-between px-4 border-b border-border-subtle">
              <div className="flex items-center gap-3 min-w-0">
                <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                  <Link to="/command-center">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Home</span>
                  </Link>
                </Button>

                <div className="h-4 w-px bg-border-subtle" />

                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-electric-blue shrink-0">
                    {caseId}
                  </span>
                  <span className="text-border-strong">&mdash;</span>
                  <span className="text-sm font-semibold text-text-primary truncate">
                    Step 3 of 4 · Connections map
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Focus toggle: fewer dots, clearer picture */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleShowCoreConnectionsOnly}
                  className={cn(
                    "gap-1.5 text-xs font-semibold transition-colors",
                    showCoreConnectionsOnly
                      ? "bg-electric-blue/10 text-electric-blue border-electric-blue/30 hover:bg-electric-blue/20"
                      : "bg-surface-2 text-text-primary",
                  )}
                  title={showCoreConnectionsOnly ? "Show every connection" : "Show only the key connections"}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>
                    {showCoreConnectionsOnly
                      ? "Show all connections"
                      : "Show key connections only"}
                  </span>
                </Button>

                <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs">
                  <Link to={`/cases/${caseId}`}>
                    <Layers className="h-3.5 w-3.5 text-text-muted" />
                    <span className="hidden sm:inline">Start here</span>
                  </Link>
                </Button>

                <Button
                  variant={isDrawerOpen ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
                  onClick={() => setIsDrawerCollapsed(isDrawerOpen)}
                  title={isDrawerOpen ? "Hide details panel" : "Show details panel"}
                >
                  <PanelRight className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{isDrawerOpen ? "Hide details" : "Show details"}</span>
                </Button>

                <Button
                  variant="restricted"
                  size="sm"
                  restrictedReason="A supervisor's permission is needed to export"
                  className="gap-1.5 text-xs"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Plain-Language Orientation Hint Bar */}
            <div className="flex items-center justify-between gap-2.5 px-3 py-1.5 2xl:px-4 2xl:py-2 bg-surface-1 text-xs text-text-secondary select-none">
              <div className="flex items-center gap-1.5 2xl:gap-2 shrink-0 whitespace-nowrap">
                <Info className="h-3.5 w-3.5 text-electric-blue shrink-0" />
                <span className="whitespace-nowrap text-[11px] 2xl:text-xs text-text-secondary">
                  <strong className="text-text-primary font-semibold">How to read this map:</strong> each dot is a person, phone, account, or place. A line means they may be connected — click anything to see the proof. Lines are suggestions, not proof.
                </span>
              </div>
              <div className="flex items-center gap-2 2xl:gap-3 text-text-muted text-[10.5px] 2xl:text-[11px] font-medium shrink-0 whitespace-nowrap hidden sm:flex">
                <span>🟢 Green = Bank Account</span>
                <span>🔵 Teal = Person</span>
                <span>🟣 Purple = Phone Handset</span>
                <span>🟠 Amber = Location</span>
              </div>
            </div>
          </div>
        }
        caseNav={<CaseStepNav />}
        main={
          <div className="relative h-full w-full flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* Graph Canvas */}
            <div className="flex-1 min-h-0 min-w-0 relative">
              {isLoading ? (
                <div className="flex h-full items-center justify-center bg-background text-text-secondary text-sm">
                  Loading Investigation Map...
                </div>
              ) : (
                <GraphCanvas />
              )}
            </div>
          </div>
        }
        detailPanel={
          isDrawerOpen ? (
            selectedNodeId ? (
              <EntityDrawer />
            ) : selectedEdgeId ? (
              <EdgeDrawer />
            ) : (
              <EmptyDrawer />
            )
          ) : undefined
        }
        footer={<TemporalSlider />}
      />

      {/* Overlaid Provenance Subsystem */}
      <ProvenanceViewer />
    </>
  );
}
