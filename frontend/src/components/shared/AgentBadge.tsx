import { cn, biasPillClass } from '@/lib/utils';
import { Pill } from './Pill';

const AGENT_GLYPH: Record<string, { color: string; mark: string }> = {
  Macro: { color: 'text-accent-violet', mark: 'M' },
  Sentiment: { color: 'text-accent-cyan', mark: 'S' },
  Technical: { color: 'text-accent-amber', mark: 'T' },
  Valuation: { color: 'text-accent-blue', mark: 'V' },
  Risk: { color: 'text-bias-bear', mark: 'R' },
};

export function AgentBadge({
  agent,
  bias,
  score,
  weight,
  active,
}: {
  agent: string;
  bias: string;
  score?: number;
  weight?: number;
  active?: boolean;
}) {
  const meta = AGENT_GLYPH[agent] ?? { color: 'text-text-muted', mark: agent[0] };
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded border border-border bg-bg-raised px-2 py-1.5 transition-colors',
        active && 'ring-glow border-accent-cyan/40',
      )}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded border border-border bg-bg-panel font-mono text-xs',
          meta.color,
        )}
      >
        {meta.mark}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-text">{agent}</span>
          {weight !== undefined && (
            <span className="text-2xs text-text-dim">{Math.round(weight * 100)}%</span>
          )}
        </div>
        {score !== undefined && (
          <div className="mt-0.5 text-2xs tabular-nums text-text-muted">
            score <span className="text-text">{score.toFixed(0)}</span>
          </div>
        )}
      </div>
      <Pill
        variant={
          biasPillClass(bias).includes('bull')
            ? 'bull'
            : biasPillClass(bias).includes('bear')
              ? 'bear'
              : 'neutral'
        }
      >
        {bias}
      </Pill>
    </div>
  );
}
