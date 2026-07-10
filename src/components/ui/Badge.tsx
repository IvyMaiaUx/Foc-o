import React from 'react';
import { cn } from '@/src/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'gold' | 'amber' | 'muted' | 'red';
  className?: string;
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  green:  'bg-[#055A43]/10 text-[#055A43]',
  gold:   'bg-[#B08D57]/12 text-[#7a6234]',
  amber:  'bg-amber-100 text-amber-700',
  muted:  'bg-[#506352]/10 text-[#506352]',
  red:    'bg-[#C2703E]/10 text-[#C2703E]',
};

export function Badge({ children, variant = 'green', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
