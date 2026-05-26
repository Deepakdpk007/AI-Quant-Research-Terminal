'use client';

import type { AgentResult } from '@/lib/types';

interface Props {
  agents: AgentResult[];
  size?: number;
}

const AXIS_ORDER = ['Macro', 'Sentiment', 'Technical', 'Valuation', 'Risk'];

export function RadarChart({ agents, size = 320 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const axes = AXIS_ORDER.length;

  const points = AXIS_ORDER.map((name, i) => {
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
    };
  });

  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {/* Radial grid */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={AXIS_ORDER.map((_, i) => {
            const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
            const r = scale * radius;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          }).join(' ')}
          fill="none"
          stroke="#1c2233"
          strokeWidth={1}
          strokeDasharray={scale === 1 ? '0' : '2 4'}
        />
      ))}
      {/* Axis lines */}
      {points.map((p) => (
        <line key={p.name} x1={cx} y1={cy} x2={p.ax} y2={p.ay} stroke="#252b3d" strokeWidth={1} />
      ))}
      {/* Filled polygon */}
      <polygon
        points={polygon}
        fill="rgba(0, 211, 255, 0.18)"
        stroke="#00d3ff"
        strokeWidth={1.5}
        className="radar-stroke"
      />
      {/* Vertices */}
      {points.map((p) => (
        <g key={p.name}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#00d3ff" />
          <text
            x={p.ax + (p.ax - cx) * 0.22}
            y={p.ay + (p.ay - cy) * 0.22}
            fill="#7a8499"
            fontSize="11"
            textAnchor={Math.abs(p.ax - cx) < 1 ? 'middle' : p.ax > cx ? 'start' : 'end'}
            dominantBaseline="middle"
            className="font-mono"
          >
            {p.name}
          </text>
          <text
            x={p.ax + (p.ax - cx) * 0.42}
            y={p.ay + (p.ay - cy) * 0.42 + 12}
            fill="#52596d"
            fontSize="10"
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
