import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Users, Truck, Package, UserCog, Warehouse, Boxes } from 'lucide-react';
import { getT, type MessageKey } from '@/lib/i18n';

type Item = {
  href: string;
  labelKey: MessageKey;
  descKey: MessageKey;
  icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { href: '/master/customers',  labelKey: 'sidebar.customers',  descKey: 'master.customersDesc',  icon: Users },
  { href: '/master/suppliers',  labelKey: 'sidebar.suppliers',  descKey: 'master.suppliersDesc',  icon: Truck },
  { href: '/master/products',   labelKey: 'sidebar.products',   descKey: 'master.productsDesc',   icon: Package },
  { href: '/master/employees',  labelKey: 'sidebar.employees',  descKey: 'master.employeesDesc',  icon: UserCog },
  { href: '/master/warehouses', labelKey: 'sidebar.warehouses', descKey: 'master.warehousesDesc', icon: Warehouse },
  { href: '/master/categories', labelKey: 'sidebar.categories', descKey: 'master.categoriesDesc', icon: Boxes },
  { href: '/master/uoms',       labelKey: 'sidebar.uoms',       descKey: 'master.uomsDesc',       icon: Boxes },
];

export default async function MasterIndex() {
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t('master.title')} description={t('master.desc')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="block">
            <Card hoverable>
              <CardBody className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800 shadow-inner dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-200">
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
