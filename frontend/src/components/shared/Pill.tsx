import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PillProps {
  children: ReactNode;
  variant?: 'bull' | 'bear' | 'neutral' | 'amber' | 'cyan' | 'violet' | 'default';
  className?: string;
}

const VARIANT: Record<NonNullable<PillProps['variant']>, string> = {
  bull: 'pill-bull',
  bear: 'pill-bear',
  neutral: 'pill-neutral',
  amber: 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber',
  cyan: 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan',
  violet: 'border-accent-violet/40 bg-accent-violet/10 text-accent-violet',
  default: 'border-border bg-bg-muted text-text-muted',
};

export function Pill({ children, variant = 'default', className }: PillProps) {
  return <span className={cn('pill', VARIANT[variant], className)}>{children}</span>;
}
