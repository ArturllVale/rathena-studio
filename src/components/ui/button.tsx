import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30',
        outline: 'border border-border bg-card/60 shadow-2xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80 border border-border/60',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        pastel: 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/25 shadow-2xs',
        ide: 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground border border-border shadow-2xs',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-9 rounded-lg px-3 text-xs',
        xs: 'h-8 rounded-md px-2.5 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
