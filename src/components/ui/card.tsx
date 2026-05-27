import * as React from 'react';
import { cn } from '@/lib/cn';

export function Card({
  className, hoverable = false, ...props
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200',
        'dark:border-neutral-800 dark:bg-neutral-900',
        hoverable && 'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-700',
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 border-b border-slate-100 p-4 dark:border-neutral-800', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-slate-900 dark:text-neutral-100', className)} {...props} />;
}
export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />;
}
