import { requireSuperAdmin } from '@/lib/rbac';
import { getT } from '@/lib/i18n';

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  const { t } = await getT();
  return (
    <div>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {t('page.super.warning')}
      </div>
      {children}
    </div>
  );
}
