import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, Pencil } from 'lucide-react';
import { deleteSupplier } from './actions';

export default async function SuppliersPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'PURCHASING' || user.role === 'SUPER_ADMIN';
  const list = await db.supplier.findMany({ orderBy: { code: 'asc' } });

  return (
    <div>
      <PageHeader title={t('page.suppliers.title')} description={t('page.suppliers.desc')}>
        {canWrite && (
          <Link href="/master/suppliers/new"><Button><Plus className="h-4 w-4" />{t('btn.add')}</Button></Link>
        )}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('col.kind')}</TH>
            <TH>{t('col.city')}</TH>
            <TH>{t('col.npwp')}</TH>
            <TH className="text-right">{t('col.term')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.code}</TD>
                <TD>{s.name}</TD>
                <TD><Badge tone="brand">{s.businessType}</Badge></TD>
                <TD>{s.city ?? '-'}</TD>
                <TD>{s.npwp ?? '-'}</TD>
                <TD className="text-right">{s.paymentTerm}</TD>
                <TD>{s.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Link href={`/master/suppliers/${s.id}`}>
                        <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" />{t('btn.edit')}</Button>
                      </Link>
                      {user.role === 'ADMIN' && s.isActive && (
                        <form action={deleteSupplier.bind(null, s.id)}>
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
