import { cn } from "@/lib/utils";

interface StepHeaderProps {
  /** e.g. "Step 2 of 4" — omit for non-step pages */
  step?: string;
  /** Plain-language title, e.g. "Review matches" */
  title: string;
  /** One-line plain explanation of what this screen is for */
  whatItDoes: string;
  className?: string;
}

/**
 * Standard page header for the simplified 4-step flow.
 * Every screen states its step, its plain title, and one line
 * explaining what the user does here — no jargon.
 */
export function StepHeader({ step, title, whatItDoes, className }: StepHeaderProps) {
  return (
    <div className={cn("px-5 pt-5 pb-4 border-b border-border-subtle bg-surface-1 shrink-0", className)}>
      {step && (
        <span className="inline-block rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-[11px] font-bold px-2.5 py-0.5 mb-2">
          {step}
        </span>
      )}
      <h1 className="text-lg font-bold text-text-primary tracking-tight">{title}</h1>
      <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">{whatItDoes}</p>
    </div>
  );
}
