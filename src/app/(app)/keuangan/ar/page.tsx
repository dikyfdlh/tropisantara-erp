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

export default async function ARPage() {
  await requireRole(['ADMIN', 'MANAGER', 'ACCOUNTING']);
  const { t } = await getT();

  const invoices = await db.invoice.findMany({
    where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
    include: { salesOrder: { include: { customer: true } } },
    orderBy: { dueDate: 'asc' },
  });

  const now = new Date();
  const total = invoices.reduce((s, i) => s + (i.total - i.paid), 0);

  return (
    <div>
      <PageHeader title={t('page.ar.title')} description={t('page.ar.desc')} />
      <Card className="mb-6">
        <CardBody>
          <div className="text-xs text-slate-500 dark:text-neutral-400">{t('page.ar.totalAR')}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-neutral-100">{formatRupiah(total)}</div>
        </CardBody>
      </Card>

      {invoices.length === 0 ? <Empty>{t('page.ar.noActive')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('sidebar.invoices')}</TH>
            <TH>{t('col.customer')}</TH>
            <TH>{t('col.dueDate')}</TH>
            <TH className="text-right">{t('col.total')}</TH>
            <TH className="text-right">{t('col.paid')}</TH>
            <TH className="text-right">{t('col.remaining')}</TH>
            <TH>{t('col.aging')}</TH>
            <TH>{t('col.status')}</TH>
          </TR></THead>
          <TBody>
            {invoices.map((inv) => {
              const days = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
              const a = agingKey(days);
              return (
                <TR key={inv.id}>
                  <TD>
                    <Link href={`/perdagangan/invoices/${inv.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                      {inv.code}
                    </Link>
                  </TD>
                  <TD>{inv.salesOrder.customer.name}</TD>
                  <TD>{formatTanggal(inv.dueDate)}</TD>
                  <TD className="text-right">{formatRupiah(inv.total)}</TD>
                  <TD className="text-right">{formatRupiah(inv.paid)}</TD>
                  <TD className="text-right font-medium">{formatRupiah(inv.total - inv.paid)}</TD>
                  <TD><Badge tone={a.tone}>{t(a.key)}</Badge></TD>
                  <TD><Badge tone={statusTone(inv.status)}>{inv.status}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
