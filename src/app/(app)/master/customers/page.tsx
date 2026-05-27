import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, Pencil } from 'lucide-react';
import { deleteCustomer } from './actions';

export default async function CustomersPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SALES' || user.role === 'SUPER_ADMIN';

  const customers = await db.customer.findMany({ orderBy: { code: 'asc' } });

  return (
    <div>
      <PageHeader title={t('page.customers.title')} description={t('page.customers.desc')}>
        {canWrite && (
          <Link href="/master/customers/new">
            <Button><Plus className="h-4 w-4" /> {t('btn.add')}</Button>
          </Link>
        )}
      </PageHeader>

      {customers.length === 0 ? (
        <Empty>{t('empty.default')} {t('empty.click')}</Empty>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('col.code')}</TH>
              <TH>{t('col.name')}</TH>
              <TH>{t('col.kind')}</TH>
              <TH>{t('col.city')}</TH>
              <TH>{t('col.npwp')}</TH>
              <TH className="text-right">{t('col.term')}</TH>
              <TH>{t('col.status')}</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {customers.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.code}</TD>
                <TD>{c.name}</TD>
                <TD><Badge tone="brand">{c.businessType}</Badge></TD>
                <TD>{c.city ?? '-'}</TD>
                <TD>{c.npwp ?? '-'}</TD>
                <TD className="text-right">{c.paymentTerm}</TD>
                <TD>{c.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge tone="slate">{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Link href={`/master/customers/${c.id}`}>
                        <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /> {t('btn.edit')}</Button>
                      </Link>
                      {user.role !== 'SALES' && c.isActive && (
                        <form action={deleteCustomer.bind(null, c.id)}>
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
