import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { Card, CardBody } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TBody, THead, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { getMonthlyCashflow } from '@/lib/cashflow';
import { CashflowChart } from '@/app/(app)/keuangan/cashflow/cashflow-chart';
import { getT } from '@/lib/i18n';
import Link from 'next/link';
import {
  Factory, Building2, ShoppingCart, Wallet, Package, AlertTriangle,
  TrendingUp, TrendingDown,
} from 'lucide-react';

export default async function DashboardPage() {
  await requireUser();
  const { t } = await getT();

  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalCustomers, totalProducts, soThisMonth, poThisMonth,
    activeProjects, productionInProgress, lowStock, recentSOs, upcomingTermins,
    cashflow,
  ] = await Promise.all([
    db.customer.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: true } }),
    db.salesOrder.aggregate({
      _sum: { total: true }, _count: true,
      where: { orderDate: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    }),
    db.purchaseOrder.aggregate({
      _sum: { total: true }, _count: true,
      where: { orderDate: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    }),
    db.project.count({ where: { status: { in: ['PLANNING', 'ACTIVE'] } } }),
    db.productionOrder.count({ where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } } }),
    db.product.findMany({
      where: { isActive: true, minStock: { gt: 0 } },
      take: 5,
      include: { stockLevels: true, uom: true },
    }),
    db.salesOrder.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    db.termin.findMany({
      take: 5, where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' },
      include: { project: { select: { name: true, code: true } } },
    }),
    getMonthlyCashflow(6),
  ]);

  const thisMonthCashflow = cashflow[cashflow.length - 1] ?? { inflow: 0, outflow: 0, net: 0 };

  const lowStockItems = lowStock
    .map((p) => ({
      code: p.code, name: p.name, uom: p.uom.code, min: p.minStock,
      onHand: p.stockLevels.reduce((s, l) => s + l.qty, 0),
    }))
    .filter((p) => p.onHand < p.min);

  return (
    <div>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={TrendingUp}   label={t('dashboard.inflowMonth')}    value={formatRupiah(thisMonthCashflow.inflow)}  sub={t('dashboard.fromInvoicePay')} tone="emerald" />
        <Kpi icon={TrendingDown} label={t('dashboard.outflowMonth')}   value={formatRupiah(thisMonthCashflow.outflow)} sub={t('dashboard.toSupplierPay')} tone="rose" />
        <Kpi icon={Wallet}       label={t('dashboard.netMonth')}       value={formatRupiah(thisMonthCashflow.net)}     sub={thisMonthCashflow.net >= 0 ? t('dashboard.surplus') : t('dashboard.deficit')} tone={thisMonthCashflow.net >= 0 ? 'brand' : 'rose'} />
        <Kpi icon={ShoppingCart} label={t('dashboard.salesMonth')}     value={formatRupiah(soThisMonth._sum.total ?? 0)} sub={t('dashboard.soCount', soThisMonth._count)} />
        <Kpi icon={Wallet}       label={t('dashboard.purchaseMonth')}  value={formatRupiah(poThisMonth._sum.total ?? 0)} sub={t('dashboard.poCount', poThisMonth._count)} />
        <Kpi icon={Building2}    label={t('dashboard.activeProjects')} value={String(activeProjects)}  sub={t('sidebar.construction')} />
        <Kpi icon={Factory}      label={t('dashboard.productionWIP')}  value={String(productionInProgress)} sub={t('sidebar.productionOrders')} />
        <Kpi icon={Package}      label={t('dashboard.activeProducts')} value={String(totalProducts)}   sub={t('dashboard.activeCustomers', totalCustomers)} />
        {lowStockItems.length > 0 && (
          <Kpi icon={AlertTriangle} label={t('dashboard.lowStock')} value={String(lowStockItems.length)} sub={t('dashboard.reorderPoint')} tone="amber" />
        )}
      </div>

      <div className="mt-6">
        <Card hoverable>
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('dashboard.cashflowTitle')}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{t('dashboard.cashflowDesc')}</p>
            </div>
            <Link href="/keuangan/cashflow" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
              {t('dashboard.viewDetail')} →
            </Link>
          </div>
          <CardBody>
            <CashflowChart data={cashflow} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('dashboard.recentSO')}</h3>
          </div>
          <CardBody className="!p-0">
            {recentSOs.length === 0 ? (
              <div className="p-4"><Empty>{t('empty.default')}</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>{t('dashboard.colCode')}</TH>
                  <TH>{t('dashboard.colCustomer')}</TH>
                  <TH>{t('dashboard.colDate')}</TH>
                  <TH className="text-right">{t('dashboard.colTotal')}</TH>
                  <TH>{t('dashboard.colStatus')}</TH>
                </TR></THead>
                <TBody>
                  {recentSOs.map((so) => (
                    <TR key={so.id}>
                      <TD className="font-medium">{so.code}</TD>
                      <TD>{so.customer.name}</TD>
                      <TD>{formatTanggal(so.orderDate)}</TD>
                      <TD className="text-right">{formatRupiah(so.total)}</TD>
                      <TD><Badge tone={statusTone(so.status)}>{so.status}</Badge></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('dashboard.upcomingTermin')}</h3>
          </div>
          <CardBody className="!p-0">
            {upcomingTermins.length === 0 ? (
              <div className="p-4"><Empty>{t('empty.default')}</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>{t('dashboard.colProject')}</TH>
                  <TH>{t('dashboard.colTermin')}</TH>
                  <TH>{t('dashboard.colDueDate')}</TH>
                  <TH className="text-right">{t('dashboard.colValue')}</TH>
                </TR></THead>
                <TBody>
                  {upcomingTermins.map((tr) => (
                    <TR key={tr.id}>
                      <TD className="font-medium">{tr.project.code} — {tr.project.name}</TD>
                      <TD>#{tr.termNo}</TD>
                      <TD>{formatTanggal(tr.dueDate)}</TD>
                      <TD className="text-right">{formatRupiah(tr.amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mt-6">
          <Card>
            <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('dashboard.lowStockItems')}</h3>
            </div>
            <CardBody className="!p-0">
              <Table>
                <THead><TR>
                  <TH>{t('dashboard.colCode')}</TH>
                  <TH>{t('dashboard.colName')}</TH>
                  <TH className="text-right">{t('dashboard.colStock')}</TH>
                  <TH className="text-right">{t('dashboard.colMin')}</TH>
                  <TH>{t('dashboard.colUom')}</TH>
                </TR></THead>
                <TBody>
                  {lowStockItems.map((p) => (
                    <TR key={p.code}>
                      <TD className="font-medium">{p.code}</TD>
                      <TD>{p.name}</TD>
                      <TD className="text-right text-rose-600 font-semibold">{p.onHand}</TD>
                      <TD className="text-right">{p.min}</TD>
                      <TD>{p.uom}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, sub, tone = 'brand',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone?: 'brand' | 'amber' | 'emerald' | 'rose';
}) {
  const iconCls =
    tone === 'amber'   ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-200' :
    tone === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 dark:from-emerald-900/40 dark:to-emerald-800/40 dark:text-emerald-200' :
    tone === 'rose'    ? 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-800 dark:from-rose-900/40 dark:to-rose-800/40 dark:text-rose-200' :
                          'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-200';
  return (
    <Card hoverable className="overflow-hidden">
      <CardBody className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-lg ${iconCls} shadow-inner`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 dark:text-neutral-400">{label}</div>
          <div className="truncate text-lg font-semibold text-slate-900 dark:text-neutral-100">{value}</div>
          {sub && <div className="text-[11px] text-slate-400 dark:text-neutral-500">{sub}</div>}
        </div>
      </CardBody>
    </Card>
  );
}
