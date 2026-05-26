import type { Disagreement } from '@/lib/types';
import { cn } from '@/lib/utils';

export function DisagreementAlert({ d }: { d: Disagreement }) {
  if (!d.flagged) {
    return (
      <div className="rounded border border-border bg-bg-raised px-3 py-2 text-xs text-text-muted">
        No significant agent disagreement — broad alignment across the panel.
      </div>
    );
  }
  const tone =
    d.severity === 'HIGH'
      ? 'border-bias-bear/40 bg-bias-bear/5 text-bias-bear'
      : d.severity === 'MEDIUM'
        ? 'border-accent-amber/40 bg-accent-amber/5 text-accent-amber'
        : 'border-accent-cyan/40 bg-accent-cyan/5 text-accent-cyan';
  return (
    <div className={cn('rounded border px-3 py-2 text-xs', tone)}>
      <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em]">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        Signal divergence ({d.severity})
      </div>
      <div className="mt-1 text-xs leading-relaxed">{d.message}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-2xs">
        <span className="rounded border border-bias-bull/40 bg-bias-bull/10 px-2 py-0.5 text-bias-bull">
          Bulls: {d.bull_agents.join(', ') || '—'}
        </span>
        <span className="rounded border border-bias-bear/40 bg-bias-bear/10 px-2 py-0.5 text-bias-bear">
          Bears: {d.bear_agents.join(', ') || '—'}
        </span>
        <span className="rounded border border-border bg-bg-muted px-2 py-0.5 text-text-muted">
          Penalty: −{Math.round(d.confidence_penalty * 100)}%
        </span>
      </div>
    </div>
  );
}
