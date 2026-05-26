'use client';

import type { Consensus, MarketSnapshot, QuantBundle } from '@/lib/types';
import { Sparkline } from '@/components/charts/Sparkline';
import { MetricCard } from '@/components/shared/MetricCard';
import { Pill } from '@/components/shared/Pill';
import { biasColor, biasPillClass, formatNumber, formatPct, formatPrice } from '@/lib/utils';

interface Props {
  snapshot: MarketSnapshot;
  quant: QuantBundle;
  consensus: Consensus | null;
}

export function OverviewTab({ snapshot, quant, consensus }: Props) {
  const q = snapshot.quote;
  const news = snapshot.news;

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      <section className="panel col-span-12 lg:col-span-8">
        <header className="panel-header">
          <span className="flex items-center gap-3">
            <span className="font-mono text-base text-text">{q.symbol}</span>
            <span className="text-2xs text-text-muted">{q.name}</span>
            <Pill variant="default">{q.exchange}</Pill>
            {q.sector && <Pill variant="violet">{q.sector}</Pill>}
            {consensus && (
              <Pill
                variant={
                  biasPillClass(consensus.consensus).includes('bull')
                    ? 'bull'
                    : biasPillClass(consensus.consensus).includes('bear')
                      ? 'bear'
                      : 'neutral'
                }
              >
                {consensus.consensus} · {consensus.confidence.toFixed(0)}%
              </Pill>
            )}
          </span>
          <span className="font-mono text-2xs text-text-dim">
            updated {new Date(q.updated_at).toLocaleTimeString()}
          </span>
        </header>
        <div className="flex flex-wrap items-end gap-6 px-4 py-3">
          <div>
            <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">last</div>
            <div className="font-mono text-3xl font-semibold tabular-nums text-text">
              {formatPrice(q.price, q.currency)}
            </div>
            <div
              className={`text-sm tabular-nums ${q.change_pct >= 0 ? 'text-bias-bull' : 'text-bias-bear'}`}
            >
              {q.change >= 0 ? '+' : ''}
              {q.change.toFixed(2)} ({formatPct(q.change_pct)})
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-4">
            <MetricCard label="Volume" value={formatNumber(q.volume)} />
            <MetricCard
              label="Mkt Cap"
              value={q.market_cap ? formatNumber(q.market_cap) : '—'}
              hint={q.currency}
            />
            <MetricCard label="PE" value={q.pe?.toFixed(1) ?? '—'} />
            <MetricCard label="PB" value={q.pb?.toFixed(1) ?? '—'} />
          </div>
        </div>
        <div className="border-t border-border px-3 pb-3 pt-3">
          <Sparkline candles={snapshot.candles} />
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-4">
        <header className="panel-header">
          Quant snapshot
          <span className="text-2xs text-text-muted">indicators · risk</span>
        </header>
        <div className="grid grid-cols-3 gap-2 p-3 text-xs">
          <Metric
            label="RSI 14"
            value={quant.indicators.rsi.toFixed(1)}
            hint={
              quant.indicators.rsi >= 70
                ? 'overbought'
                : quant.indicators.rsi <= 30
                  ? 'oversold'
                  : 'neutral'
            }
          />
          <Metric label="MACD h" value={quant.indicators.macd_hist.toFixed(2)} />
          <Metric label="ATR" value={quant.indicators.atr.toFixed(2)} />
          <Metric label="EMA20" value={quant.indicators.ema_20.toFixed(1)} />
          <Metric label="EMA50" value={quant.indicators.ema_50.toFixed(1)} />
          <Metric label="SMA200" value={quant.indicators.sma_200.toFixed(1)} />
          <Metric label="VWAP" value={quant.indicators.vwap.toFixed(1)} />
          <Metric label="BB%" value={(quant.indicators.bb_pct * 100).toFixed(0) + '%'} />
          <Metric label="Sharpe" value={quant.risk.sharpe.toFixed(2)} />
          <Metric label="MDD" value={`${(quant.risk.max_drawdown * 100).toFixed(1)}%`} />
          <Metric label="Vol" value={`${(quant.risk.annualised_volatility * 100).toFixed(0)}%`} />
          <Metric label="VaR95" value={`${(quant.risk.var_95 * 100).toFixed(2)}%`} />
        </div>
        {quant.notes.length > 0 && (
          <div className="border-t border-border px-3 py-2">
            <ul className="space-y-1 text-2xs leading-relaxed text-text-muted">
              {quant.notes.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel col-span-12">
        <header className="panel-header">
          News tape
          <span className="text-2xs text-text-muted">sentiment-tagged · {news.length} items</span>
        </header>
        <div className="divide-y divide-border">
          {news.map((article) => {
            const tone =
              article.sentiment === null
                ? 'text-text-muted'
                : article.sentiment >= 0.3
                  ? 'text-bias-bull'
                  : article.sentiment <= -0.3
                    ? 'text-bias-bear'
                    : 'text-text-muted';
            return (
              <div key={article.headline} className="flex items-start gap-3 px-3 py-2 text-xs">
                <span
                  className={`w-12 shrink-0 font-mono text-2xs uppercase tracking-[0.18em] ${tone}`}
                >
                  {article.sentiment?.toFixed(2) ?? '—'}
                </span>
                <div className="flex-1">
                  <div className="text-text">{article.headline}</div>
                  <div className="mt-0.5 text-2xs text-text-dim">
                    {article.source} · {new Date(article.published_at).toLocaleString()}
                  </div>
                </div>
                <div className="hidden gap-1 sm:flex">
                  {article.tags.slice(0, 2).map((tag) => (
                    <Pill key={tag} variant="default">
                      {tag}
                    </Pill>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded border border-border bg-bg-raised px-2 py-1.5">
      <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
      <div className="font-mono text-sm tabular-nums text-text">{value}</div>
      {hint && <div className="text-2xs text-text-dim">{hint}</div>}
    </div>
  );
}
