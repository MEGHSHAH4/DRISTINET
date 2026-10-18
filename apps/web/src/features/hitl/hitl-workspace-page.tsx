import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepHeader } from "@/components/ui/step-header";
import { HITLQueueFilters } from "./hitl-queue-filters";
import { HITLTaskCard } from "./hitl-task-card";
import { HITLDecisionPane } from "./hitl-decision-pane";
import { HITLEvidencePane } from "./hitl-evidence-pane";
import { HITLDecisionDialog } from "./hitl-decision-dialog";
import { ProvenanceViewer } from "@/components/evidence/ProvenanceViewer";
import { useHITLStore } from "@/stores/hitlStore";
import type { HITLTaskDecision } from "@/types/hitl";
import { cn } from "@/lib/utils";

/**
 * Step 2 content — rendered inside the shared case shell (CaseWorkspacePage),
 * so the top bar, steps menu, case panel and footer are identical on every page.
 */
export function HITLStepContent() {
  const { taskId, caseId } = useParams<{ taskId?: string, caseId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const caseIdFilter = caseId || "CASE-0001";

  const {
    tasks,
    activeTask,
    filter,
    stats,
    isLoading,
    isSubmitting,
    loadTasks,
    loadTaskById,
    selectTask,
    setFilter,
    resetFilter,
    submitDecision,
  } = useHITLStore();

  const [pendingDecision, setPendingDecision] = useState<HITLTaskDecision | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load tasks on mount or when caseId param changes
  useEffect(() => {
    loadTasks({ caseId: caseIdFilter });
  }, [caseIdFilter, loadTasks]);

  // Sync route taskId with store activeTask
  useEffect(() => {
    if (taskId) {
      loadTaskById(taskId);
    } else {
      selectTask(null);
    }
  }, [taskId, loadTaskById, selectTask]);

  const handleSelectTask = (id: string) => {
    navigate(`/cases/${caseIdFilter}/hitl/${id}`);
  };

  const handleBackToQueue = () => {
    navigate(`/cases/${caseIdFilter}/hitl`);
  };

  const handleDecisionRequest = async (decision: HITLTaskDecision) => {
    setPendingDecision(decision);
    setIsDialogOpen(true);
    return true;
  };

  const handleConfirmDecision = async () => {
    if (!activeTask || !pendingDecision) return;
    const success = await submitDecision(activeTask.id, pendingDecision);
    if (success) {
      setIsDialogOpen(false);
      setPendingDecision(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <StepHeader
        step="Step 2 of 4"
        title="Review matches"
        whatItDoes="The system suggests things that might match — like two records for the same person. Nothing is decided by itself: you look at the proof and choose Yes, No, or Later."
      />

      {/* Stats Ribbon — plain words */}
      <div className="flex items-center justify-between px-5 py-2 bg-surface-2 border-b border-border-subtle text-xs shrink-0 overflow-x-auto">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber" />
            Waiting for you: <strong>{stats?.pendingCount ?? 0}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-critical-red">
            <AlertTriangle className="h-3 w-3" />
            Needs attention: <strong>{stats?.criticalCount ?? 0}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-verified-emerald">
            <CheckCircle2 className="h-3 w-3" />
            Done: <strong>{stats?.resolvedCount ?? 0}</strong>
          </span>
          <span className="text-text-muted">
            Total: <strong className="text-text-primary">{stats?.totalTasks ?? tasks.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeTask && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToQueue}
              className="text-xs gap-1.5 h-7"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to list</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadTasks()}
            title="Refresh list"
            className="h-7 w-7 text-text-muted hover:text-text-primary"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Main Workspace Area: Either Queue List or Two-Pane Review */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTask ? (
          /* Two-Pane Review Workspace (§17 & §18) */
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-0">
            {/* Left Pane: Proposed Match / Contradiction & Decision */}
            <div className="h-full min-h-0 overflow-hidden">
              <HITLDecisionPane
                task={activeTask}
                onRequestDecision={handleDecisionRequest}
                isSubmitting={isSubmitting}
              />
            </div>

            {/* Right Pane: Supporting Evidence & Provenance Viewer */}
            <div className="h-full min-h-0 overflow-hidden">
              <HITLEvidencePane task={activeTask} />
            </div>
          </div>
        ) : (
          /* Full Queue List View */
          <div className="flex flex-col h-full max-w-7xl mx-auto p-4 space-y-4 overflow-y-auto">
            <HITLQueueFilters
              filter={filter}
              onFilterChange={setFilter}
              onReset={resetFilter}
              totalResults={tasks.length}
            />

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-electric-blue border-t-transparent" />
                <p className="text-xs text-text-muted">Loading your review list...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-subtle bg-surface-1 p-12 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-verified-emerald mx-auto" />
                <h3 className="text-sm font-semibold text-text-primary">All done — nothing waiting</h3>
                <p className="text-xs text-text-muted max-w-md mx-auto">
                  There are no matches waiting for your review right now. When new files are read, suggestions will appear here.
                </p>
                <Button variant="secondary" size="sm" onClick={resetFilter} className="text-xs">
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tasks.map((task) => (
                  <HITLTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => handleSelectTask(task.id)} isActive={task.id === taskId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {activeTask && (
        <HITLDecisionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={handleConfirmDecision}
          task={activeTask}
          decision={pendingDecision}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Global Provenance Viewer Modal (available when clicking Full Inspector) */}
      <ProvenanceViewer />
    </div>
  );
}
