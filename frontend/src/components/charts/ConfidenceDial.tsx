'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  value: number;
  bias: string;
  size?: number;
}

/**
 * Radial confidence dial: a circular arc that fills to `value`% with a
 * gradient that shifts based on bias. Clean, premium, animated.
 */
export function ConfidenceDial({ value, bias, size = 200 }: Props) {
  const animatedValue = useCountUp(value, 1100);
  const pct = Math.max(0, Math.min(100, animatedValue));

  const stroke = bias.includes('Bull')
    ? '#10b981'
    : bias.includes('Bear')
      ? '#f43f5e'
      : '#94a3b8';

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const inner = r + 8;
        const outer = r + (i % 5 === 0 ? 14 : 11);
        return {
          x1: cx + Math.cos(angle) * inner,
          y1: cy + Math.sin(angle) * inner,
          x2: cx + Math.cos(angle) * outer,
          y2: cy + Math.sin(angle) * outer,
          highlight: i % 5 === 0,
        };
      }),
    [cx, cy, r],
  );

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id={`dialGrad-${bias.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stroke} stopOpacity="1" />
          </linearGradient>
          <filter id="dialGlow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Tick marks */}
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.highlight ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.15)'}
              strokeWidth={t.highlight ? 1.4 : 0.8}
            />
          ))}
        </g>

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(148, 163, 184, 0.08)"
          strokeWidth="6"
        />

        {/* Glow underneath */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.4}
          filter="url(#dialGlow)"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Active arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#dialGrad-${bias.replace(/\s/g, '')})`}
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xs uppercase tracking-[0.25em] text-text-dim">consensus</div>
        <div
          className="font-display font-semibold tabular"
          style={{ fontSize: size * 0.22, color: stroke, lineHeight: 1 }}
        >
          {pct.toFixed(0)}
        </div>
        <div className="mt-1 text-2xs uppercase tracking-[0.18em]" style={{ color: stroke }}>
          {bias}
        </div>
      </div>
    </div>
  );
}
