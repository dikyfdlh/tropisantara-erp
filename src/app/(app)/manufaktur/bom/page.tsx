import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, Pencil } from 'lucide-react';
import { deleteBom } from './actions';

export default async function BomPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'PRODUCTION' || user.role === 'SUPER_ADMIN';

  const list = await db.bom.findMany({
    orderBy: { code: 'desc' },
    include: { product: true, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader title={t('page.bom.title')} description={t('page.bom.desc')}>
        {canWrite && <Link href="/manufaktur/bom/new"><Button><Plus className="h-4 w-4" />{t('page.bom.createBtn')}</Button></Link>}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('page.bom.empty')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.product')}</TH>
            <TH className="text-right">{t('page.bom.outputBatch')}</TH>
            <TH className="text-right">{t('col.itemsCount')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((b) => (
              <TR key={b.id}>
                <TD className="font-medium">{b.code}</TD>
                <TD>{b.product.code} — {b.product.name}</TD>
                <TD className="text-right">{b.outputQty}</TD>
                <TD className="text-right">{b._count.items}</TD>
                <TD>{b.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Link href={`/manufaktur/bom/${b.id}`}>
                        <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" />{t('btn.edit')}</Button>
                      </Link>
                      {b.isActive && (
                        <form action={deleteBom.bind(null, b.id)}>
                          <Button size="sm" variant="danger" type="submit">{t('btn.deactivate')}</Button>
                        </form>
                      )}
                    </div>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
