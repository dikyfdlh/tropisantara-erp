import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, formatTanggal, paymentMethodLabel } from '@/lib/format';
import { getMonthlyCashflow, summarizeCashflow } from '@/lib/cashflow';
import { CashflowChart } from './cashflow-chart';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default async function CashflowPage() {
  await requireRole(['ADMIN', 'MANAGER', 'ACCOUNTING']);
  const { t } = await getT();

  const monthly = await getMonthlyCashflow(6);
  const summary = summarizeCashflow(monthly);

  const [recentIn, recentOut] = await Promise.all([
    db.payment.findMany({
      orderBy: { date: 'desc' }, take: 15,
      include: { invoice: { include: { salesOrder: { include: { customer: true } } } } },
    }),
    db.supplierPayment.findMany({
      orderBy: { date: 'desc' }, take: 15,
      include: { purchaseOrder: { include: { supplier: true } } },
    }),
  ]);

  const thisMonth = monthly[monthly.length - 1] ?? { inflow: 0, outflow: 0, net: 0 };

  return (
    <div>
      <PageHeader title={t('page.cashflow.title')} description={t('page.cashflow.desc')} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard icon={TrendingUp}   label={t('page.cashflow.inflowMonth')}  value={formatRupiah(thisMonth.inflow)}  tone="emerald" />
        <KpiCard icon={TrendingDown} label={t('page.cashflow.outflowMonth')} value={formatRupiah(thisMonth.outflow)} tone="rose" />
        <KpiCard icon={Wallet}       label={t('page.cashflow.netMonth')}     value={formatRupiah(thisMonth.net)}     tone={thisMonth.net >= 0 ? 'brand' : 'rose'} />
        <KpiCard icon={Wallet}       label={t('page.cashflow.net6m')}        value={formatRupiah(summary.net)}       tone={summary.net >= 0 ? 'brand' : 'rose'} />
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('page.cashflow.trendTitle')}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{t('page.cashflow.trendDesc')}</p>
        </div>
        <CardBody>
          <CashflowChart data={monthly} />
        </CardBody>
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('page.cashflow.summary')}</h3>
        </div>
        <CardBody className="!p-0">
          <Table>
            <THead><TR>
              <TH>{t('col.month')}</TH>
              <TH className="text-right">{t('col.inflow')}</TH>
              <TH className="text-right">{t('col.outflow')}</TH>
              <TH className="text-right">{t('col.net')}</TH>
            </TR></THead>
            <TBody>
              {monthly.map((m) => (
                <TR key={m.monthKey}>
                  <TD className="font-medium">{m.monthLabel}</TD>
                  <TD className="text-right text-emerald-700 dark:text-emerald-400">{formatRupiah(m.inflow)}</TD>
                  <TD className="text-right text-rose-700 dark:text-rose-400">{formatRupiah(m.outflow)}</TD>
                  <TD className={`text-right font-semibold ${m.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {formatRupiah(m.net)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" /> {t('page.cashflow.recentIn')}
            </h3>
          </div>
          <CardBody className="!p-0">
            {recentIn.length === 0 ? (
              <div className="p-4"><Empty>{t('empty.default')}</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>{t('col.date')}</TH>
                  <TH>{t('col.from')}</TH>
                  <TH>{t('col.method')}</TH>
                  <TH className="text-right">{t('col.amount')}</TH>
                </TR></THead>
                <TBody>
                  {recentIn.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatTanggal(p.date)}</TD>
                      <TD className="font-medium">{p.invoice.salesOrder.customer.name}</TD>
                      <TD><Badge tone="emerald">{paymentMethodLabel(p.method)}</Badge></TD>
                      <TD className="text-right font-medium text-emerald-700 dark:text-emerald-400">{formatRupiah(p.amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" /> {t('page.cashflow.recentOut')}
            </h3>
          </div>
          <CardBody className="!p-0">
            {recentOut.length === 0 ? (
              <div className="p-4"><Empty>{t('empty.default')}</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>{t('col.date')}</TH>
                  <TH>{t('col.to')}</TH>
                  <TH>{t('col.method')}</TH>
                  <TH className="text-right">{t('col.amount')}</TH>
                </TR></THead>
                <TBody>
                  {recentOut.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatTanggal(p.date)}</TD>
                      <TD className="font-medium">{p.purchaseOrder.supplier.name}</TD>
                      <TD><Badge tone="rose">{paymentMethodLabel(p.method)}</Badge></TD>
                      <TD className="text-right font-medium text-rose-700 dark:text-rose-400">{formatRupiah(p.amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string;
  tone: 'emerald' | 'rose' | 'brand';
}) {
  const toneCls =
    tone === 'emerald' ? 'from-emerald-100 to-emerald-200 text-emerald-800 dark:from-emerald-900/40 dark:to-emerald-800/40 dark:text-emerald-200' :
    tone === 'rose'    ? 'from-rose-100 to-rose-200 text-rose-800 dark:from-rose-900/40 dark:to-rose-800/40 dark:text-rose-200' :
                          'from-brand-100 to-brand-200 text-brand-800 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-200';
  return (
    <Card hoverable>
      <CardBody className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${toneCls} shadow-inner`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 dark:text-neutral-400">{label}</div>
          <div className="truncate text-lg font-semibold text-slate-900 dark:text-neutral-100">{value}</div>
        </div>
      </CardBody>
    </Card>
  );
}
