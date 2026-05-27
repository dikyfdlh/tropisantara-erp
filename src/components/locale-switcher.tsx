import { cn } from '@/lib/cn';
import { setLocale } from '@/lib/i18n/actions';
import type { Locale } from '@/lib/i18n';

/**
 * Server component: dua tombol ID/EN. Klik = server action set cookie + revalidate.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-md border border-slate-300 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-800"
    >
      <LocaleBtn code="id" label="ID" active={current === 'id'} />
      <LocaleBtn code="en" label="EN" active={current === 'en'} />
    </div>
  );
}

function LocaleBtn({ code, label, active }: { code: Locale; label: string; active: boolean }) {
  return (
    <form action={async () => { 'use server'; await setLocale(code); }}>
      <button
        type="submit"
        aria-pressed={active}
        className={cn(
          'inline-flex h-7 min-w-[2rem] items-center justify-center rounded px-2 text-xs font-semibold transition',
          active
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
        )}
      >
        {label}
      </button>
    </form>
  );
}
