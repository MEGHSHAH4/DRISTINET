import { useParams } from "react-router-dom";
import { useState } from "react";
import { Download, FileText, AlertTriangle, FileJson, FileCode2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepHeader } from "@/components/ui/step-header";
import { InvestigationShell } from "@/layouts/InvestigationShell/investigation-shell";
import { CaseStepNav } from "@/features/cases/components/case-step-nav";
import { generateCaseReport, generateCourtPdf } from "@/services/api/reportApi";

export function ReportsPage() {
  const {  caseId } = useParams();
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error" | "unauthorized">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [analystComments, setAnalystComments] = useState("");
  const [format, setFormat] = useState<"json" | "html">("html");

  const handleGenerate = async () => {
    if (!caseId) return;
    setStatus("generating");
    setErrorMsg("");

    try {
      const response = await generateCaseReport(caseId, { analyst_comments: analystComments, format });
      
      if (response && response.data) {
        setStatus("success");
        
        let blob: Blob;
        if (format === "html") {
          blob = new Blob([response.data as unknown as string], { type: "text/html" });
        } else {
          blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Report_${caseId}_${new Date().getTime()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setStatus("error");
        setErrorMsg("Failed to generate report (empty response).");
      }
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setStatus("unauthorized");
      } else {
        setStatus("error");
        setErrorMsg(e.message || "An error occurred");
      }
    }
  };

  const handleGeneratePdf = async () => {
    if (!caseId) return;
    setStatus("generating");
    setErrorMsg("");

    try {
      const response = await generateCourtPdf(caseId, { analyst_comments: analystComments });
      if (response) {
        setStatus("success");
      }
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setStatus("unauthorized");
      } else if (e.response?.status === 400 || e.message?.includes("WeasyPrint")) {
        setStatus("error");
        setErrorMsg("WeasyPrint is not available on this server to render PDF.");
      } else {
        setStatus("error");
        setErrorMsg(e.message || "An error occurred generating PDF");
      }
    }
  };

  const mainContent = (
    <div className="flex flex-col h-full bg-surface-base overflow-y-auto">
      <div className="p-6 max-w-3xl mx-auto w-full mt-4 space-y-6">
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-electric-blue/10 rounded-lg text-electric-blue shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-base font-bold text-text-primary">Case summary report</h3>
                <p className="text-sm text-text-secondary">
                  A readable summary of the case: the people, phones and places found, how they may be linked, and the evidence behind each link.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-text-primary">
                  File type
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat("html")}
                    className={"flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors " + (format === "html" ? "border-electric-blue bg-electric-blue/10 text-electric-blue" : "border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary")}
                  >
                    <FileCode2 className="h-4 w-4" />
                    Web page
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("json")}
                    className={"flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors " + (format === "json" ? "border-electric-blue bg-electric-blue/10 text-electric-blue" : "border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary")}
                  >
                    <FileJson className="h-4 w-4" />
                    Data file
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-semibold text-text-primary">
                  Your notes (optional)
                </label>
                <textarea
                  value={analystComments}
                  onChange={(e) => setAnalystComments(e.target.value)}
                  className="w-full bg-surface-2 border border-border-subtle rounded-md p-3 text-sm text-text-primary focus:outline-none focus:border-electric-blue"
                  rows={3}
                  placeholder="Anything you want to add to the report…"
                />
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={status === "generating"}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {status === "generating" ? "Making report…" : "Download report"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleGeneratePdf}
                  disabled={status === "generating"}
                  className="gap-2 text-amber border-amber/30 hover:bg-amber/10"
                >
                  <Scale className="h-4 w-4" />
                  Official PDF version
                </Button>
              </div>

              {status === "success" && (
                <div className="mt-4 p-3 bg-verified-emerald/10 text-verified-emerald text-sm rounded-md border border-verified-emerald/20 font-medium">
                  Report is ready — your download has started.
                </div>
              )}
              {status === "unauthorized" && (
                <div className="mt-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-md border border-red-500/20 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  You don&apos;t have permission to make a report for this case.
                </div>
              )}
              {status === "error" && (
                <div className="mt-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-md border border-red-500/20 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Something went wrong: {errorMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <InvestigationShell
      header={
        <StepHeader
          step="Step 4 of 4"
          title="Make report"
          whatItDoes="Create a summary of what you reviewed and accepted. Only human-reviewed findings go into the report — nothing unreviewed."
        />
      }
      caseNav={<CaseStepNav />}
      main={mainContent}
      footer={<></>}
    />
  );
}
