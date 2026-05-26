'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Consensus, MarketSnapshot, QuantBundle } from '@/lib/types';
import { Sparkline } from '@/components/charts/Sparkline';
import { MetricCard } from '@/components/shared/MetricCard';
import { Pill } from '@/components/shared/Pill';
import { biasPillClass, formatNumber, formatPct, formatPrice } from '@/lib/utils';

interface Props {
  snapshot: MarketSnapshot;
  quant: QuantBundle;
  consensus: Consensus | null;
}

export function OverviewTab({ snapshot, quant, consensus }: Props) {
  const q = snapshot.quote;
  const news = snapshot.news;

  const consensusVariant = consensus
    ? biasPillClass(consensus.consensus).includes('bull')
      ? 'bull'
      : biasPillClass(consensus.consensus).includes('bear')
        ? 'bear'
        : 'neutral'
    : 'neutral';

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Hero — symbol header + sparkline */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="panel col-span-12 lg:col-span-8 overflow-hidden"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
              {q.symbol}
            </h1>
            <span className="text-sm text-text-muted">{q.name}</span>
            <Pill variant="default">{q.exchange}</Pill>
            {q.sector && <Pill variant="violet">{q.sector}</Pill>}
            {consensus && (
              <Pill variant={consensusVariant} glow>
                {consensus.consensus} · {consensus.confidence.toFixed(0)}%
              </Pill>
            )}
          </div>
          <span className="font-mono text-2xs uppercase tracking-[0.2em] text-text-dim">
            updated {new Date(q.updated_at).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-8 px-5 pb-2 pt-3">
          <div>
            <div className="text-2xs uppercase tracking-[0.22em] text-text-dim">last price</div>
            <div className="mt-1 font-mono text-4xl font-semibold tabular text-text">
              {formatPrice(q.price, q.currency)}
            </div>
            <div
              className={`flex items-center gap-1.5 font-mono text-sm tabular ${
                q.change_pct >= 0 ? 'text-bias-bull' : 'text-bias-bear'
              }`}
            >
              {q.change_pct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {q.change >= 0 ? '+' : ''}
              {q.change.toFixed(2)} ({formatPct(q.change_pct)})
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard label="Volume" value={formatNumber(q.volume)} delay={0.1} />
            <MetricCard
              label="Mkt Cap"
              value={q.market_cap ? formatNumber(q.market_cap) : '—'}
              hint={q.currency}
              delay={0.15}
            />
            <MetricCard label="P/E" value={q.pe?.toFixed(1) ?? '—'} delay={0.2} />
            <MetricCard label="P/B" value={q.pb?.toFixed(1) ?? '—'} delay={0.25} />
          </div>
        </div>
        <div className="border-t border-white/[0.04] px-3 pb-3 pt-3">
          <Sparkline candles={snapshot.candles} />
        </div>
      </motion.section>

      {/* Quant snapshot */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="panel col-span-12 lg:col-span-4"
      >
        <header className="panel-header">
          <span>Quant Snapshot</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            indicators · risk
          </span>
        </header>
        <div className="grid grid-cols-3 gap-2 p-3">
          <Metric
            label="RSI"
            value={quant.indicators.rsi.toFixed(1)}
            hint={
              quant.indicators.rsi >= 70
                ? 'overbought'
                : quant.indicators.rsi <= 30
                  ? 'oversold'
                  : 'neutral'
            }
          />
          <Metric label="MACD" value={quant.indicators.macd_hist.toFixed(2)} />
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
          <div className="border-t border-white/[0.04] px-3 py-2.5">
            <ul className="space-y-1 text-2xs leading-relaxed text-text-muted">
              {quant.notes.map((note) => (
                <li key={note} className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-accent-cyan/60">·</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      {/* News tape */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="panel col-span-12"
      >
        <header className="panel-header">
          <span>News Tape</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            sentiment-tagged · {news.length} items
          </span>
        </header>
        <div className="divide-y divide-white/[0.04]">
          {news.map((article, idx) => {
            const tone =
              article.sentiment === null
                ? 'text-text-muted'
                : article.sentiment >= 0.3
                  ? 'text-bias-bull'
                  : article.sentiment <= -0.3
                    ? 'text-bias-bear'
                    : 'text-text-muted';
            return (
              <motion.div
                key={article.headline}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group flex items-start gap-4 px-4 py-2.5 text-xs transition-colors hover:bg-white/[0.02]"
              >
                <span className={`w-12 shrink-0 font-mono text-2xs tabular ${tone}`}>
                  {article.sentiment !== null
                    ? `${article.sentiment >= 0 ? '+' : ''}${article.sentiment.toFixed(2)}`
                    : '—'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-text">{article.headline}</div>
                  <div className="mt-0.5 text-2xs text-text-dim/70">
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
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-white/10">
      <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-medium tabular text-text">{value}</div>
      {hint && <div className="mt-0.5 text-2xs text-text-dim/70">{hint}</div>}
    </div>
  );
}
