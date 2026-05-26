'use client';

import { useMemo } from 'react';
import type { OhlcvPoint } from '@/lib/types';

interface Props {
  candles: OhlcvPoint[];
  width?: number;
  height?: number;
  showArea?: boolean;
}

export function Sparkline({ candles, width = 600, height = 180, showArea = true }: Props) {
  const { path, area, low, high, change, axis } = useMemo(() => {
    if (!candles.length)
      return { path: '', area: '', low: 0, high: 0, change: 0, axis: [] as number[] };
    const closes = candles.map((c) => c.close);
    const lo = Math.min(...closes);
    const hi = Math.max(...closes);
    const span = hi - lo || 1;
    const dx = width / (closes.length - 1 || 1);

    const points = closes.map((c, i) => ({
      x: i * dx,
      y: height - 8 - ((c - lo) / span) * (height - 16),
    }));
    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const area = `${path} L${width},${height} L0,${height} Z`;
    const change = closes[closes.length - 1] - closes[0];
    const tickCount = 4;
    const axis = Array.from({ length: tickCount }, (_, i) => lo + (span * i) / (tickCount - 1));
    return { path, area, low: lo, high: hi, change, axis };
  }, [candles, width, height]);

  const stroke = change >= 0 ? '#22c55e' : '#ef4444';
  const fill = change >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {axis.map((value, i) => {
        const y = height - 8 - (i / (axis.length - 1)) * (height - 16);
        return (
          <g key={value}>
            <line x1={0} x2={width} y1={y} y2={y} stroke="#1c2233" strokeDasharray="2 4" />
            <text x={4} y={y - 2} fill="#52596d" fontSize="9" className="font-mono">
              {value.toFixed(2)}
            </text>
          </g>
        );
      })}

      {showArea && <path d={area} fill={fill} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.4} />
      <text
        x={width - 4}
        y={12}
        fill="#7a8499"
        fontSize="10"
        textAnchor="end"
        className="font-mono"
      >
        H {high.toFixed(2)}
      </text>
      <text
        x={width - 4}
        y={height - 4}
        fill="#7a8499"
        fontSize="10"
        textAnchor="end"
        className="font-mono"
      >
        L {low.toFixed(2)}
      </text>
    </svg>
  );
}
