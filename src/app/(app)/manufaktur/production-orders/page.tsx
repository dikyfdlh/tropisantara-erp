import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge, statusTone } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, ExternalLink } from 'lucide-react';
import { formatTanggal } from '@/lib/format';

export default async function ProductionOrdersPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'PRODUCTION' || user.role === 'SUPER_ADMIN';

  const list = await db.productionOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });

  return (
    <div>
      <PageHeader title={t('page.po.title')} description={t('page.po.desc')}>
        {canWrite && (
          <Link href="/manufaktur/production-orders/new">
            <Button><Plus className="h-4 w-4" />{t('page.po.createBtn')}</Button>
          </Link>
        )}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('page.po.empty')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.product')}</TH>
            <TH className="text-right">{t('page.po.target')}</TH>
            <TH className="text-right">{t('page.po.produced')}</TH>
            <TH>{t('page.po.startDate')}</TH>
            <TH>{t('page.po.deadline')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.code}</TD>
                <TD>{p.product.code} — {p.product.name}</TD>
                <TD className="text-right">{p.targetQty}</TD>
                <TD className="text-right">{p.producedQty}</TD>
                <TD>{formatTanggal(p.startDate)}</TD>
                <TD>{formatTanggal(p.dueDate)}</TD>
                <TD><Badge tone={statusTone(p.status)}>{p.status}</Badge></TD>
                <TD className="text-right">
                  <Link href={`/manufaktur/production-orders/${p.id}`}>
                    <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />{t('btn.detail')}</Button>
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
