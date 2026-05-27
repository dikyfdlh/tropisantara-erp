import * as React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:   'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 dark:disabled:bg-brand-900/60',
  secondary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-700 disabled:bg-slate-400 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-100',
  outline:   'border border-slate-300 bg-white text-slate-900 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-200',
  ghost:     'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-800',
  danger:    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800',
};
const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150',
        'focus-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
