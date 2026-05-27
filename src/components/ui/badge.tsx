import { cn } from '@/lib/cn';

const tones = {
  slate:   'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-800',
  brand:   'bg-brand-100 text-brand-800 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800',
  amber:   'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800',
  rose:    'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800',
  sky:     'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800',
} as const;

export function Badge({
  children, tone = 'slate', className,
}: { children: React.ReactNode; tone?: keyof typeof tones; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
      tones[tone], className,
    )}>
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof tones {
  switch (status) {
    case 'DRAFT': case 'PLANNING': case 'PENDING': return 'slate';
    case 'PLANNED': case 'CONFIRMED': case 'SENT': case 'ACTIVE':
    case 'IN_PROGRESS': case 'PARTIAL': case 'INVOICED': return 'brand';
    case 'COMPLETED': case 'PAID': case 'RECEIVED':
    case 'DELIVERED': case 'APPROVED': return 'emerald';
    case 'OVERDUE': case 'ON_HOLD': return 'amber';
    case 'CANCELLED': case 'UNPAID': return 'rose';
    default: return 'slate';
  }
}
