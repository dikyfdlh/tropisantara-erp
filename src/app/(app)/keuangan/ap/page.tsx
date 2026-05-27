import Link from 'next/link';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { getT, type MessageKey } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, statusTone } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatRupiah, formatTanggal } from '@/lib/format';

function agingKey(days: number): { key: MessageKey; tone: 'slate' | 'amber' | 'rose' } {
  if (days <= 0)  return { key: 'aging.notDue',  tone: 'slate' };
  if (days <= 30) return { key: 'aging.1to30',   tone: 'amber' };
  if (days <= 60) return { key: 'aging.31to60',  tone: 'amber' };
  return                 { key: 'aging.over60',  tone: 'rose'  };
}

export default async function APPage() {
  await requireRole(['ADMIN', 'MANAGER', 'ACCOUNTING']);
  const { t } = await getT();

  const pos = await db.purchaseOrder.findMany({
    where: { status: { notIn: ['CANCELLED', 'DRAFT'] } },
    include: { supplier: true },
    orderBy: [{ status: 'asc' }, { orderDate: 'asc' }],
  });

  const unpaid = pos.filter((p) => p.paid < p.total);
  const paid   = pos.filter((p) => p.paid >= p.total);

  const totalHutang = unpaid.reduce((s, p) => s + (p.total - p.paid), 0);
  const totalDibayar = pos.reduce((s, p) => s + p.paid, 0);

  const now = new Date();

  return (
    <div>
      <PageHeader title={t('page.ap.title')} description={t('page.ap.desc')} />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card hoverable>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-neutral-400">{t('page.ap.totalAP')}</div>
            <div className="mt-1 text-2xl font-bold text-rose-600">{formatRupiah(totalHutang)}</div>
            <div className="text-xs text-slate-400 dark:text-neutral-500">{t('page.ap.poUnpaid', unpaid.length)}</div>
          </CardBody>
        </Card>
        <Card hoverable>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-neutral-400">{t('page.ap.totalPaid')}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{formatRupiah(totalDibayar)}</div>
            <div className="text-xs text-slate-400 dark:text-neutral-500">{t('page.ap.poPaid', paid.length)}</div>
          </CardBody>
        </Card>
        <Card hoverable>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-neutral-400">{t('page.ap.totalCommit')}</div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-neutral-100">{formatRupiah(pos.reduce((s, p) => s + p.total, 0))}</div>
            <div className="text-xs text-slate-400 dark:text-neutral-500">{t('page.ap.poTotal', pos.length)}</div>
          </CardBody>
        </Card>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-neutral-300">{t('page.ap.unpaidSection')}</h3>
      {unpaid.length === 0 ? <Empty>{t('page.ap.noActive')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')} PO</TH>
            <TH>{t('col.supplier')}</TH>
            <TH>{t('col.date')}</TH>
            <TH className="text-right">{t('col.total')}</TH>
            <TH className="text-right">{t('col.paid')}</TH>
            <TH className="text-right">{t('col.remaining')}</TH>
            <TH>{t('col.aging')}</TH>
            <TH>{t('col.status')}</TH>
          </TR></THead>
          <TBody>
            {unpaid.map((p) => {
              const days = Math.floor((now.getTime() - new Date(p.orderDate).getTime()) / 86400000) - p.supplier.paymentTerm;
              const a = agingKey(days);
              return (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/perdagangan/purchase-orders/${p.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                      {p.code}
                    </Link>
                  </TD>
                  <TD>{p.supplier.name}</TD>
                  <TD>{formatTanggal(p.orderDate)}</TD>
                  <TD className="text-right">{formatRupiah(p.total)}</TD>
                  <TD className="text-right text-emerald-700 dark:text-emerald-400">{formatRupiah(p.paid)}</TD>
                  <TD className="text-right font-semibold text-rose-700 dark:text-rose-400">{formatRupiah(p.total - p.paid)}</TD>
                  <TD><Badge tone={a.tone}>{t(a.key)}</Badge></TD>
                  <TD><Badge tone={statusTone(p.status)}>{p.status}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {paid.length > 0 && (
        <>
          <h3 className="mb-2 mt-8 text-sm font-semibold text-slate-700 dark:text-neutral-300">{t('page.ap.paidSection')}</h3>
          <Table>
            <THead><TR>
              <TH>{t('col.code')} PO</TH>
              <TH>{t('col.supplier')}</TH>
              <TH>{t('page.ap.orderDate')}</TH>
              <TH>{t('page.ap.paidDate')}</TH>
              <TH className="text-right">{t('page.ap.totalPaidLabel')}</TH>
            </TR></THead>
            <TBody>
              {paid.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/perdagangan/purchase-orders/${p.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                      {p.code}
                    </Link>
                  </TD>
                  <TD>{p.supplier.name}</TD>
                  <TD>{formatTanggal(p.orderDate)}</TD>
                  <TD>{formatTanggal(p.paidAt)}</TD>
                  <TD className="text-right font-medium text-emerald-700 dark:text-emerald-400">{formatRupiah(p.paid)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </div>
  );
}
