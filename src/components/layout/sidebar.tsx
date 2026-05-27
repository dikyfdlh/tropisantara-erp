'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Truck, Package, Building2, Hammer, Factory, ShoppingCart,
  Wallet, Warehouse, UserCog, ChevronDown, Boxes, Crown, Settings, Eye, ArrowDownUp,
  Calculator, TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Role } from '@/lib/roles';
import { canAccess, MODULE_ROLES } from '@/lib/permissions';
import type { MessageKey } from '@/lib/i18n';

type ModuleKey = keyof typeof MODULE_ROLES | 'super';
type Item = {
  href: string;
  labelKey: MessageKey;
  icon: React.ComponentType<{ className?: string }>;
  module: ModuleKey;
};
type Group = { labelKey: MessageKey; items: Item[]; module: ModuleKey };

const groups: Group[] = [
  { labelKey: 'sidebar.summary', module: 'dashboard', items: [
    { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, module: 'dashboard' },
  ]},
  { labelKey: 'sidebar.masterData', module: 'master', items: [
    { href: '/master/customers',     labelKey: 'sidebar.customers',     icon: Users,       module: 'master' },
    { href: '/master/suppliers',     labelKey: 'sidebar.suppliers',     icon: Truck,       module: 'master' },
    { href: '/master/products',      labelKey: 'sidebar.products',      icon: Package,     module: 'master' },
    { href: '/master/products/io',   labelKey: 'sidebar.productsIO',    icon: ArrowDownUp, module: 'master' },
    { href: '/master/employees',     labelKey: 'sidebar.employees',     icon: UserCog,     module: 'master' },
    { href: '/master/warehouses',    labelKey: 'sidebar.warehouses',    icon: Warehouse,   module: 'master' },
    { href: '/master/categories',    labelKey: 'sidebar.categories',    icon: Boxes,       module: 'master' },
    { href: '/master/uoms',          labelKey: 'sidebar.uoms',          icon: Boxes,       module: 'master' },
  ]},
  { labelKey: 'sidebar.manufacturing', module: 'manufaktur', items: [
    { href: '/manufaktur/bom',               labelKey: 'sidebar.bom',              icon: Boxes,   module: 'manufaktur' },
    { href: '/manufaktur/production-orders', labelKey: 'sidebar.productionOrders', icon: Factory, module: 'manufaktur' },
  ]},
  { labelKey: 'sidebar.construction', module: 'konstruksi', items: [
    { href: '/konstruksi/projects', labelKey: 'sidebar.projects',          icon: Building2,  module: 'konstruksi' },
    { href: '/konstruksi/termin',   labelKey: 'sidebar.termin',            icon: Hammer,     module: 'konstruksi' },
    { href: '/konstruksi/anggaran', labelKey: 'sidebar.budgetCalculator',  icon: Calculator, module: 'konstruksi' },
  ]},
  { labelKey: 'sidebar.trade', module: 'perdagangan', items: [
    { href: '/perdagangan/sales-orders',    labelKey: 'sidebar.salesOrders',    icon: ShoppingCart, module: 'perdagangan' },
    { href: '/perdagangan/purchase-orders', labelKey: 'sidebar.purchaseOrders', icon: ShoppingCart, module: 'perdagangan' },
    { href: '/perdagangan/invoices',        labelKey: 'sidebar.invoices',       icon: Wallet,       module: 'perdagangan' },
  ]},
  { labelKey: 'sidebar.inventory', module: 'inventaris', items: [
    { href: '/inventaris/stock',    labelKey: 'sidebar.stock',   icon: Warehouse,   module: 'inventaris' },
    { href: '/inventaris/stock/io', labelKey: 'sidebar.stockIO', icon: ArrowDownUp, module: 'inventaris' },
  ]},
  { labelKey: 'sidebar.finance', module: 'keuangan', items: [
    { href: '/keuangan/cashflow', labelKey: 'sidebar.cashflow', icon: TrendingUp, module: 'keuangan' },
    { href: '/keuangan/ar',       labelKey: 'sidebar.ar',       icon: Wallet,     module: 'keuangan' },
    { href: '/keuangan/ap',       labelKey: 'sidebar.ap',       icon: Wallet,     module: 'keuangan' },
  ]},
  { labelKey: 'sidebar.administration', module: 'admin', items: [
    { href: '/admin/users', labelKey: 'sidebar.users', icon: UserCog, module: 'admin' },
  ]},
];

const superGroup: Group = {
  labelKey: 'sidebar.superAdmin', module: 'super', items: [
    { href: '/super',           labelKey: 'sidebar.superHome',      icon: Crown,    module: 'super' },
    { href: '/super/users',     labelKey: 'sidebar.allUsers',       icon: Users,    module: 'super' },
    { href: '/super/settings',  labelKey: 'sidebar.companyProfile', icon: Settings, module: 'super' },
    { href: '/super/overview',  labelKey: 'sidebar.systemOverview', icon: Eye,      module: 'super' },
  ],
};

function moduleAccess(role: Role, mod: ModuleKey): boolean {
  if (mod === 'super') return role === 'SUPER_ADMIN';
  return canAccess(role, MODULE_ROLES[mod]);
}

type T = (key: MessageKey) => string;

export function Sidebar({
  role, translations,
}: {
  role: Role;
  translations: Record<string, string>; // peta MessageKey → string (sudah diterjemahkan server-side)
}) {
  const pathname = usePathname();
  const isSuper = role === 'SUPER_ADMIN';
  const t: T = (k) => translations[k] ?? k;

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:flex-shrink-0 border-r border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo.png"
          alt="Tropisantara"
          className="h-9 w-9 flex-shrink-0 object-contain"
        />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('sidebar.brandTitle')}</div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400">{t('sidebar.brandSubtitle')}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((g) => {
          if (!moduleAccess(role, g.module)) return null;
          return <NavGroup key={g.labelKey} group={g} pathname={pathname} role={role} t={t} accent="brand" />;
        })}
        {isSuper && <NavGroup group={superGroup} pathname={pathname} role={role} t={t} accent="amber" />}
      </nav>
    </aside>
  );
}

function NavGroup({
  group, pathname, role, t, accent = 'brand',
}: { group: Group; pathname: string; role: Role; t: T; accent?: 'brand' | 'amber' }) {
  const [open, setOpen] = useState(true);
  const activeCls = accent === 'amber'
    ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
    : 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200';
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <span>{t(group.labelKey)}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open ? '' : '-rotate-90')} />
      </button>
      {open && (
        <ul className="mt-2 space-y-0.5">
          {group.items.map((it) => {
            if (!moduleAccess(role, it.module)) return null;
            const active = pathname === it.href || pathname.startsWith(it.href + '/');
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition',
                    active
                      ? activeCls
                      : 'text-slate-700 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
                  )}
                >
                  <it.icon className="h-4 w-4" />
                  {t(it.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
