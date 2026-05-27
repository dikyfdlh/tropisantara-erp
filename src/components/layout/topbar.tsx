import { signOut } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/roles';
import { LogOut } from 'lucide-react';
import type { SessionUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';

export async function Topbar({ user }: { user: SessionUser }) {
  const { locale, t } = await getT();
  const isSuper = user.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md backdrop-saturate-150 dark:border-neutral-800 dark:bg-neutral-800/80">
      <div className="hidden text-sm text-slate-500 sm:block dark:text-neutral-400">
        {t('topbar.welcome')}{' '}
        <span className="font-medium text-slate-900 dark:text-neutral-100">{user.name || user.email}</span>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <LocaleSwitcher current={locale} />
        <ThemeToggle labels={{
          light:  t('theme.light'),
          dark:   t('theme.dark'),
          system: t('theme.system'),
        }} />

        <div className="hidden text-right md:block">
          <div className="text-sm font-medium text-slate-900 dark:text-neutral-100">{user.name}</div>
          <div className="text-xs text-slate-500 dark:text-neutral-400">{ROLE_LABELS[user.role]}</div>
        </div>
        <div
          className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition ${
            isSuper
              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-700'
              : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
          }`}
          title={ROLE_LABELS[user.role]}
        >
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300"
            title={t('topbar.logout')}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('topbar.logout')}</span>
          </button>
        </form>
      </div>
    </header>
  );
}
