'use client';

/**
 * 3D consensus orb. Pure CSS 3D — no Three.js needed.
 *
 * The orb consists of layered SVG rings that rotate at different speeds on
 * different axes, with a glowing core whose intensity reflects confidence.
 * Each agent contributes an "orbit ring" colored by its bias.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AgentResult } from '@/lib/types';

interface Props {
  confidence: number;
  bias: string;
  agents: AgentResult[];
  size?: number;
}

export function ConsensusOrb({ confidence, bias, agents, size = 280 }: Props) {
  const coreColor = bias.includes('Bull')
    ? '#10b981'
    : bias.includes('Bear')
      ? '#f43f5e'
      : '#22d3ee';

  const orbits = useMemo(
    () =>
      agents.slice(0, 5).map((a, i) => {
        const color = a.bias.includes('Bull')
          ? '#10b981'
          : a.bias.includes('Bear')
            ? '#f43f5e'
            : '#94a3b8';
        return {
          agent: a.agent,
          score: a.score,
          color,
          delay: i * 0.15,
          radius: 32 + i * 16,
          duration: 6 + i * 2,
          tilt: i * 24,
        };
      }),
    [agents],
  );

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: 800,
      }}
    >
      {/* Background blob glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${coreColor}40 0%, transparent 70%)`,
          opacity: 0.7 + (confidence / 100) * 0.3,
        }}
      />

      <svg viewBox={`0 0 ${size} ${size}`} className="relative h-full w-full">
        <defs>
          <radialGradient id="orbCore" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
            <stop offset="35%" stopColor={coreColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0.2" />
          </radialGradient>
          <radialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
            <stop offset="40%" stopColor={coreColor} stopOpacity="0" />
            <stop offset="80%" stopColor={coreColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0" />
          </radialGradient>
          <filter id="orbGlow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Halo */}
        <circle cx={size / 2} cy={size / 2} r={size * 0.42} fill="url(#orbHalo)" />

        {/* Sphere core (with subtle rim highlight) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.18}
          fill="url(#orbCore)"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: 'drop-shadow(0 0 24px rgba(34,211,238,0.4))' }}
        />

        {/* rim highlight */}
        <circle
          cx={size / 2 - size * 0.06}
          cy={size / 2 - size * 0.07}
          r={size * 0.06}
          fill="rgba(255, 255, 255, 0.18)"
          filter="url(#orbGlow)"
        />
      </svg>

      {/* Orbiting rings — CSS animations */}
      {orbits.map((o, i) => (
        <div
          key={o.agent}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `rotateX(70deg) rotateZ(${o.tilt}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="relative"
            style={{
              width: o.radius * 2 + size * 0.4,
              height: o.radius * 2 + size * 0.4,
            }}
          >
            <div
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: `${o.color}28`,
                boxShadow: `0 0 16px -2px ${o.color}25`,
              }}
            />
            {/* Orbit dot */}
            <div
              className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: o.color,
                boxShadow: `0 0 12px ${o.color}, 0 0 24px ${o.color}66`,
                animation: `orbitSpin ${o.duration}s linear infinite`,
                animationDelay: `${o.delay}s`,
                transformOrigin: '50% 50%',
              }}
            />
          </div>
        </div>
      ))}

      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xs uppercase tracking-[0.25em] text-white/70">consensus</div>
        <div
          className="font-display text-4xl font-semibold tabular leading-none"
          style={{ color: '#fff', textShadow: `0 0 24px ${coreColor}` }}
        >
          {confidence.toFixed(0)}
        </div>
        <div
          className="mt-1 text-2xs uppercase tracking-[0.2em]"
          style={{ color: coreColor, textShadow: `0 0 8px ${coreColor}` }}
        >
          {bias}
        </div>
      </div>

      <style jsx>{`
        @keyframes orbitSpin {
          from {
            transform: translate(-50%, -50%) rotate(0deg) translateX(0);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg) translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
