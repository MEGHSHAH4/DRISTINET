import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  FolderOpen,
  ArrowRight,
  Upload,
  ListChecks,
  Network,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { listCases } from "@/services/api/casesApi";
import type { CaseSummary } from "@/types/case";

const HOW_IT_WORKS = [
  {
    no: "1",
    title: "Add evidence",
    text: "Upload files. Each one is safety-checked, then the system reads out names, phones, and possible links.",
    icon: Upload,
  },
  {
    no: "2",
    title: "Review matches",
    text: "The system suggests possible matches. You look at the proof and decide: Yes, No, or Later.",
    icon: ListChecks,
  },
  {
    no: "3",
    title: "Connections map",
    text: "See people, phones, and places as a map. Click anything to see why they are linked.",
    icon: Network,
  },
  {
    no: "4",
    title: "Make report",
    text: "Build a summary of what you reviewed and accepted. Nothing unreviewed goes in.",
    icon: FileText,
  },
];

export function CommandCenterPage() {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listCases()
      .then((res) => {
        if (mounted && res.data) {
          setCases(res.data);
        }
      })
      .catch((e) => console.error("Failed to load cases", e))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 min-w-0 overflow-y-auto bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface-1 px-6 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-electric-blue/10 text-electric-blue">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary">Home</h1>
            <p className="text-[11px] text-text-muted">
              Welcome back, {user?.display_name || "Investigator"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* How it works — plain 4 steps */}
        <section className="rounded-xl border border-border-subtle bg-surface-1 p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">
            How DRISTI-NET works — 4 simple steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {HOW_IT_WORKS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.no} className="rounded-lg border border-border-subtle bg-surface-2 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-blue text-white text-xs font-bold shrink-0">
                      {s.no}
                    </span>
                    <Icon className="h-4 w-4 text-electric-blue shrink-0" />
                    <h3 className="text-xs font-bold text-text-primary">{s.title}</h3>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{s.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cases */}
        <section className="rounded-xl border border-border-subtle bg-surface-1 p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">
            Your cases
          </h2>

          {isLoading ? (
            <p className="text-xs text-text-muted py-4">Loading your cases…</p>
          ) : cases.length === 0 ? (
            <p className="text-xs text-text-muted py-4">
              No cases assigned to you yet. Ask your supervisor to assign one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.slice(0, 4).map((c) => (
                <div key={c.id} className="rounded-lg border border-border-subtle bg-surface-2 p-4 space-y-3">
                  <div>
                    <span className="font-mono text-xs font-semibold text-text-primary block">{c.id}</span>
                    <span className="text-xs text-text-secondary mt-0.5 line-clamp-1">{c.title}</span>
                  </div>
                  <div className="pt-2 border-t border-border-subtle">
                    <Link to={`/cases/${c.id}`} className="block">
                      <Button variant="secondary" size="sm" className="w-full text-xs gap-1.5 h-9">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Open case — start with step 1</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link to="/cases">
              <Button variant="ghost" size="sm" className="text-xs text-electric-blue gap-1">
                <span>See all cases</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
