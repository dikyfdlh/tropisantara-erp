import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { deleteInvoice } from './actions';
import { DeleteInvoiceButton } from './[id]/delete-button';

export default async function InvoicesPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canDelete = user.role === 'SUPER_ADMIN';
  const list = await db.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: { salesOrder: { include: { customer: true } } },
  });

  return (
    <div>
      <PageHeader title={t('page.invoices.title')} description={t('page.invoices.desc')} />
      {list.length === 0 ? <Empty>{t('page.invoices.empty')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.customer')}</TH>
            <TH>SO</TH>
            <TH>{t('col.date')}</TH>
            <TH>{t('col.dueDate')}</TH>
            <TH className="text-right">{t('col.total')}</TH>
            <TH className="text-right">{t('col.remaining')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((inv) => (
              <TR key={inv.id}>
                <TD className="font-medium">{inv.code}</TD>
                <TD>{inv.salesOrder.customer.name}</TD>
                <TD>{inv.salesOrder.code}</TD>
                <TD>{formatTanggal(inv.date)}</TD>
                <TD>{formatTanggal(inv.dueDate)}</TD>
                <TD className="text-right">{formatRupiah(inv.total)}</TD>
                <TD className="text-right font-medium">{formatRupiah(inv.total - inv.paid)}</TD>
                <TD><Badge tone={statusTone(inv.status)}>{inv.status}</Badge></TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/perdagangan/invoices/${inv.id}`}>
                      <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />{t('btn.detail')}</Button>
                    </Link>
                    {canDelete && (
                      <DeleteInvoiceButton action={deleteInvoice.bind(null, inv.id)} code={inv.code} />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
