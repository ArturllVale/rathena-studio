import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90',
        secondary: 'border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-rose-500/30 bg-rose-500/12 text-rose-600 dark:text-rose-300',
        outline: 'text-foreground border-border bg-card/40',
        success: 'border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        warning: 'border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300',
        info: 'border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300',
        purple: 'border-purple-500/25 bg-purple-500/12 text-purple-700 dark:text-purple-300',
        peach: 'border-orange-500/25 bg-orange-500/12 text-orange-700 dark:text-orange-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
