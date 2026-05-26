'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AgentResult } from '@/lib/types';

interface Props {
  agents: AgentResult[];
  size?: number;
}

const AXIS_ORDER = ['Macro', 'Sentiment', 'Technical', 'Valuation', 'Risk'];

const AXIS_COLOR: Record<string, string> = {
  Macro: '#a78bfa',
  Sentiment: '#22d3ee',
  Technical: '#fbbf24',
  Valuation: '#60a5fa',
  Risk: '#f43f5e',
};

export function RadarChart({ agents, size = 360 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const axes = AXIS_ORDER.length;

  const points = useMemo(
    () =>
      AXIS_ORDER.map((name, i) => {
        const agent = agents.find((a) => a.agent === name);
        const score = agent?.score ?? 50;
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const r = (score / 100) * radius;
        return {
          name,
          score,
          bias: agent?.bias ?? 'Neutral',
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          ax: cx + Math.cos(angle) * radius,
          ay: cy + Math.sin(angle) * radius,
          color: AXIS_COLOR[name],
        };
      }),
    [agents, cx, cy, radius, axes],
  );

  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
          <stop offset="100%" stopColor="rgba(34, 211, 238, 0.1)" />
        </radialGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Concentric polygons */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={AXIS_ORDER.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
            const r = scale * radius;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          }).join(' ')}
          fill="none"
          stroke={
            scale === 1 ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.08)'
          }
          strokeWidth={scale === 1 ? 1 : 0.8}
          strokeDasharray={scale === 1 ? '0' : '3 5'}
        />
      ))}

      {/* Axis lines */}
      {points.map((p) => (
        <line
          key={p.name}
          x1={cx}
          y1={cy}
          x2={p.ax}
          y2={p.ay}
          stroke="rgba(148, 163, 184, 0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Polygon glow */}
      <motion.polygon
        points={polygon}
        fill="url(#radarFill)"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        filter="url(#radarGlow)"
      />

      {/* Polygon stroke */}
      <motion.polygon
        points={polygon}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Vertices + labels */}
      {points.map((p, i) => (
        <g key={p.name}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="4"
            fill={p.color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
          />
          <circle cx={p.x} cy={p.y} r="9" fill={p.color} fillOpacity="0.15" />
          <text
            x={p.ax + (p.ax - cx) * 0.18}
            y={p.ay + (p.ay - cy) * 0.18}
            fill={p.color}
            fontSize="11"
            fontWeight="500"
            textAnchor={Math.abs(p.ax - cx) < 1 ? 'middle' : p.ax > cx ? 'start' : 'end'}
            dominantBaseline="middle"
            className="font-display"
          >
            {p.name}
          </text>
          <text
            x={p.ax + (p.ax - cx) * 0.32}
            y={p.ay + (p.ay - cy) * 0.32 + 12}
            fill="rgba(148, 163, 184, 0.5)"
            fontSize="9"
            textAnchor="middle"
            className="font-mono"
          >
            {p.score.toFixed(0)}
          </text>
        </g>
      ))}
    </svg>
  );
}
