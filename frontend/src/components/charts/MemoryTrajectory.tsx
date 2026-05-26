'use client';

import { motion } from 'framer-motion';
import type { MemoryPoint } from '@/lib/types';

export function MemoryTrajectoryChart({ points }: { points: MemoryPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-white/10 p-8 text-center text-xs text-text-muted">
        No memory yet — analyse this symbol to start tracking how the system's confidence
        evolves.
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padX = 44;
  const padY = 30;

  const xs = points.map(
    (_, i) => padX + (i / Math.max(points.length - 1, 1)) * (width - padX * 2),
  );
  const ys = points.map(
    (p) => height - padY - (p.confidence / 100) * (height - padY * 2),
  );

  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${path} L${xs[xs.length - 1].toFixed(1)},${height - padY} L${xs[0].toFixed(1)},${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id="memoryFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(167, 139, 250, 0.35)" />
          <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
        </linearGradient>
        <linearGradient id="memoryLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Y-axis grid */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = height - padY - (v / 100) * (height - padY * 2);
        return (
          <g key={v}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(148, 163, 184, 0.06)"
              strokeDasharray="3 5"
            />
            <text
              x={padX - 8}
              y={y + 3}
              fill="rgba(148, 163, 184, 0.4)"
              fontSize="10"
              textAnchor="end"
              className="font-mono"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Area */}
      <motion.path
        d={area}
        fill="url(#memoryFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke="url(#memoryLine)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Points */}
      {points.map((p, i) => (
        <g key={p.id}>
          <motion.circle
            cx={xs[i]}
            cy={ys[i]}
            r="9"
            fill="rgba(167, 139, 250, 0.15)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + i * 0.06 }}
          />
          <motion.circle
            cx={xs[i]}
            cy={ys[i]}
            r="4"
            fill="#a78bfa"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + i * 0.06 }}
          />
          <text
            x={xs[i]}
            y={ys[i] - 12}
            fill="#cbd5e1"
            fontSize="10"
            fontWeight="500"
            textAnchor="middle"
            className="font-mono"
          >
            {p.confidence.toFixed(0)}
          </text>
          <text
            x={xs[i]}
            y={height - padY / 2 + 4}
            fill="rgba(148, 163, 184, 0.5)"
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
