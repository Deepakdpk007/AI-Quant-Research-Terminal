'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OhlcvPoint } from '@/lib/types';

interface Props {
  candles: OhlcvPoint[];
  width?: number;
  height?: number;
}

export function Sparkline({ candles, width = 720, height = 220 }: Props) {
  const { path, area, low, high, change, gridY, currentY, dx } = useMemo(() => {
    if (!candles.length) {
      return { path: '', area: '', low: 0, high: 0, change: 0, gridY: [], currentY: 0, dx: 0 };
    }
    const closes = candles.map((c) => c.close);
    const lo = Math.min(...closes);
    const hi = Math.max(...closes);
    const span = hi - lo || 1;
    const padX = 16;
    const padY = 14;
    const dx = (width - padX * 2) / Math.max(closes.length - 1, 1);

    const points = closes.map((c, i) => ({
      x: padX + i * dx,
      y: height - padY - ((c - lo) / span) * (height - padY * 2),
    }));

    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const area = `${path} L${width - padX},${height - padY} L${padX},${height - padY} Z`;
    const change = closes[closes.length - 1] - closes[0];
    const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: height - padY - t * (height - padY * 2),
      v: lo + t * span,
    }));
    return { path, area, low: lo, high: hi, change, gridY, currentY: points[points.length - 1].y, dx };
  }, [candles, width, height]);

  if (!candles.length) {
    return <div className="h-full w-full skeleton" />;
  }

  const stroke = change >= 0 ? '#10b981' : '#f43f5e';
  const gradId = change >= 0 ? 'sparkBull' : 'sparkBear';
  const stops =
    change >= 0
      ? [
          { o: '0%', c: 'rgba(16, 185, 129, 0.5)' },
          { o: '100%', c: 'rgba(16, 185, 129, 0)' },
        ]
      : [
          { o: '0%', c: 'rgba(244, 63, 94, 0.5)' },
          { o: '100%', c: 'rgba(244, 63, 94, 0)' },
        ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          {stops.map((s) => (
            <stop key={s.o} offset={s.o} stopColor={s.c} />
          ))}
        </linearGradient>
        <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.6" />
          <stop offset="100%" stopColor={stroke} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {gridY.map(({ y, v }, i) => (
        <g key={i}>
          <line
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            stroke="rgba(148, 163, 184, 0.06)"
            strokeDasharray="2 6"
          />
          <text
            x={6}
            y={y - 3}
            fill="rgba(148, 163, 184, 0.4)"
            fontSize="10"
            className="font-mono"
          >
            {v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <motion.path
        d={area}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Line */}
      <path d={path} fill="none" stroke="url(#sparkLine)" strokeWidth="1.8" className="spark-line" />

      {/* Current price marker */}
      <circle cx={width - 16} cy={currentY} r="4" fill={stroke} className="animate-pulse-slow" />
      <circle cx={width - 16} cy={currentY} r="8" fill={stroke} fillOpacity="0.2" />

      {/* High / Low badges */}
      <g>
        <rect x={width - 90} y={6} rx="4" width="80" height="18" fill="rgba(15, 20, 33, 0.6)" />
        <text x={width - 84} y={18} fill="#94a3b8" fontSize="10" className="font-mono">
          H {high.toFixed(2)}
        </text>
        <rect
          x={width - 90}
          y={height - 26}
          rx="4"
          width="80"
          height="18"
          fill="rgba(15, 20, 33, 0.6)"
        />
        <text x={width - 84} y={height - 14} fill="#94a3b8" fontSize="10" className="font-mono">
          L {low.toFixed(2)}
        </text>
      </g>
    </svg>
  );
}
