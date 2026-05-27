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
import { deletePurchaseOrder } from './actions';

export default async function POPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'PURCHASING' || user.role === 'SUPER_ADMIN';
  const canDelete = user.role === 'SUPER_ADMIN';
  const list = await db.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { supplier: true, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader title={t('page.purchase.title')} description={t('page.purchase.desc')}>
        {canWrite && <Link href="/perdagangan/purchase-orders/new"><Button><Plus className="h-4 w-4" />{t('page.purchase.createBtn')}</Button></Link>}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.supplier')}</TH>
            <TH>{t('col.date')}</TH>
            <TH className="text-right">{t('col.itemCount')}</TH>
            <TH className="text-right">{t('col.total')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((po) => (
              <TR key={po.id}>
                <TD className="font-medium">{po.code}</TD>
                <TD>{po.supplier.name}</TD>
                <TD>{formatTanggal(po.orderDate)}</TD>
                <TD className="text-right">{po._count.items}</TD>
                <TD className="text-right font-medium">{formatRupiah(po.total)}</TD>
                <TD><Badge tone={statusTone(po.status)}>{po.status}</Badge></TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/perdagangan/purchase-orders/${po.id}`}>
                      <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />{t('btn.detail')}</Button>
                    </Link>
                    {canDelete && (
                      <ConfirmDeleteButton
                        action={deletePurchaseOrder.bind(null, po.id)}
                        confirmText={`Confirm delete ${po.code}? Linked items & goods receipts will also be deleted.`}
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
