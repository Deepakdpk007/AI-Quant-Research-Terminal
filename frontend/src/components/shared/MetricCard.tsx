'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
  delay?: number;
  className?: string;
}

export function MetricCard({ label, value, hint, trend, delay = 0, className }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'panel panel-interactive group relative overflow-hidden px-4 py-3',
        className,
      )}
    >
      {/* subtle gradient sweep on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
      <div
        className={cn(
          'mt-1.5 font-mono text-xl font-semibold tabular',
          trend === 'up' && 'text-bias-bull',
          trend === 'down' && 'text-bias-bear',
          !trend && 'text-text',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 truncate text-2xs text-text-dim">{hint}</div>}
    </motion.div>
  );
}
