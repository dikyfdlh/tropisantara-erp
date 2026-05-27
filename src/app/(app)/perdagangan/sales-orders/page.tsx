import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge, statusTone } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, ExternalLink } from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete';
import { deleteSalesOrder } from './actions';

export default async function SalesOrdersPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SALES' || user.role === 'SUPER_ADMIN';
  const canDelete = user.role === 'SUPER_ADMIN';
  const list = await db.salesOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader title={t('page.so.title')} description={t('page.so.desc')}>
        {canWrite && <Link href="/perdagangan/sales-orders/new"><Button><Plus className="h-4 w-4" />{t('page.so.createBtn')}</Button></Link>}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('page.so.empty')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.customer')}</TH>
            <TH>{t('col.date')}</TH>
            <TH className="text-right">{t('col.itemCount')}</TH>
            <TH className="text-right">{t('col.total')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((so) => (
              <TR key={so.id}>
                <TD className="font-medium">{so.code}</TD>
                <TD>{so.customer.name}</TD>
                <TD>{formatTanggal(so.orderDate)}</TD>
                <TD className="text-right">{so._count.items}</TD>
                <TD className="text-right font-medium">{formatRupiah(so.total)}</TD>
                <TD><Badge tone={statusTone(so.status)}>{so.status}</Badge></TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/perdagangan/sales-orders/${so.id}`}>
                      <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />{t('btn.detail')}</Button>
                    </Link>
                    {canDelete && (
                      <ConfirmDeleteButton
                        action={deleteSalesOrder.bind(null, so.id)}
                        confirmText={`Confirm delete ${so.code}? Linked invoices & payments will also be deleted.`}
                      />
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
