import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number, currency = 'INR') {
  if (currency === 'INR') return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (currency === 'USD') return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return value.toFixed(2);
}

export function formatPct(value: number, digits = 2) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatNumber(value: number) {
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

export function biasColor(bias: string) {
  if (bias.includes('Strong Bull')) return 'text-bias-bull';
  if (bias.includes('Bullish')) return 'text-bias-bull';
  if (bias.includes('Strong Bear')) return 'text-bias-bear';
  if (bias.includes('Bearish')) return 'text-bias-bear';
  return 'text-bias-neutral';
}

export function biasPillClass(bias: string) {
  if (bias.includes('Bull')) return 'pill-bull';
  if (bias.includes('Bear')) return 'pill-bear';
  return 'pill-neutral';
}

export function regimeColor(regime: string) {
  switch (regime) {
    case 'RISK-ON':
      return 'text-bias-bull';
    case 'PANIC':
      return 'text-bias-bear';
    case 'RISK-OFF':
      return 'text-accent-amber';
    default:
      return 'text-text-muted';
  }
}

export function timeAgo(iso: string): string {
  const ts = new Date(iso).getTime();
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
