'use client';

import type { MemoryPoint } from '@/lib/types';

export function MemoryTrajectoryChart({ points }: { points: MemoryPoint[] }) {
  if (!points.length) {
    return (
      <div className="rounded border border-dashed border-border p-4 text-center text-xs text-text-muted">
        No memory yet — analyse this symbol to start tracking confidence evolution.
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const pad = 36;
  const xs = points.map((_, i) => pad + (i / Math.max(points.length - 1, 1)) * (width - pad * 2));
  const ys = points.map((p) => height - pad - (p.confidence / 100) * (height - pad * 2));

  const path = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = height - pad - (v / 100) * (height - pad * 2);
        return (
          <g key={v}>
            <line x1={pad} x2={width - pad} y1={y} y2={y} stroke="#1c2233" strokeDasharray="2 4" />
            <text
              x={pad - 6}
              y={y + 3}
              fill="#52596d"
              fontSize="10"
              textAnchor="end"
              className="font-mono"
            >
              {v}
            </text>
          </g>
        );
      })}
      <path d={path} fill="none" stroke="#a48dff" strokeWidth={1.5} />
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={xs[i]} cy={ys[i]} r={3.5} fill="#a48dff" />
          <text
            x={xs[i]}
            y={ys[i] - 8}
            fill="#7a8499"
            fontSize="9"
            textAnchor="middle"
            className="font-mono"
          >
            {p.confidence.toFixed(0)}
          </text>
          <text
            x={xs[i]}
            y={height - pad / 3}
            fill="#52596d"
            fontSize="9"
            textAnchor="middle"
            className="font-mono"
          >
            {new Date(p.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: '2-digit',
            })}
          </text>
        </g>
      ))}
    </svg>
  );
}
