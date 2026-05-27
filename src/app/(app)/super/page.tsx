import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Settings, Users, Eye } from 'lucide-react';
import { getT, type MessageKey } from '@/lib/i18n';

type Item = { href: string; labelKey: MessageKey; descKey: MessageKey; icon: React.ComponentType<{ className?: string }> };

const items: Item[] = [
  { href: '/super/users',    labelKey: 'page.super.cardUsers',    descKey: 'page.super.cardUsersDesc',    icon: Users },
  { href: '/super/settings', labelKey: 'page.super.cardSettings', descKey: 'page.super.cardSettingsDesc', icon: Settings },
  { href: '/super/overview', labelKey: 'page.super.cardOverview', descKey: 'page.super.cardOverviewDesc', icon: Eye },
];

export default async function SuperIndex() {
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t('page.super.title')} description={t('page.super.desc')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="block">
            <Card hoverable>
              <CardBody className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 shadow-inner dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-200">
                  <it.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-neutral-100">{t(it.labelKey)}</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">{t(it.descKey)}</div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
