import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PillProps {
  children: ReactNode;
  variant?: 'bull' | 'bear' | 'neutral' | 'amber' | 'cyan' | 'violet' | 'rose' | 'default';
  className?: string;
  glow?: boolean;
}

const VARIANT: Record<NonNullable<PillProps['variant']>, string> = {
  bull: 'pill-bull',
  bear: 'pill-bear',
  neutral: 'pill-neutral',
  amber: 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber',
  cyan: 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan',
  violet: 'border-accent-violet/30 bg-accent-violet/10 text-accent-violet',
  rose: 'border-accent-rose/30 bg-accent-rose/10 text-accent-rose',
  default: 'border-white/10 bg-white/5 text-text-muted',
};

const GLOW: Record<NonNullable<PillProps['variant']>, string> = {
  bull: 'shadow-glow-bull',
  bear: 'shadow-glow-bear',
  neutral: '',
  amber: 'shadow-[0_0_20px_-6px_rgba(251,191,36,0.4)]',
  cyan: 'shadow-glow-cyan',
  violet: 'shadow-glow-violet',
  rose: 'shadow-glow-bear',
  default: '',
};

export function Pill({ children, variant = 'default', className, glow = false }: PillProps) {
  return (
    <span className={cn('pill', VARIANT[variant], glow && GLOW[variant], className)}>
      {children}
    </span>
  );
}
