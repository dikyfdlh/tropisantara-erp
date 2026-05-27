import * as React from 'react';
import { cn } from '@/lib/cn';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead
    className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-neutral-800/60 dark:text-neutral-400"
    {...props}
  />;
}
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-slate-100 dark:divide-neutral-800" {...props} />;
}
export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr
    className={cn('transition-colors duration-150 hover:bg-brand-50/40 dark:hover:bg-neutral-800/60', className)}
    {...props}
  />;
}
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-2 font-semibold', className)} {...props} />;
}
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-2 align-top', className)} {...props} />;
}

export function Empty({ children = 'Belum ada data.' }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-neutral-900 dark:text-neutral-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      {children}
    </div>
  );
}
