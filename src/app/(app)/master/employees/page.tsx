import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, Pencil } from 'lucide-react';
import { deleteEmployee } from './actions';
import { formatTanggal } from '@/lib/format';

export default async function EmployeesPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const list = await db.employee.findMany({ orderBy: { code: 'asc' } });

  return (
    <div>
      <PageHeader title={t('page.employees.title')} description={t('page.employees.desc')}>
        {canWrite && <Link href="/master/employees/new"><Button><Plus className="h-4 w-4" />{t('btn.add')}</Button></Link>}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('col.position')}</TH>
            <TH>{t('col.division')}</TH>
            <TH>{t('col.joinDate')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium">{e.code}</TD>
                <TD>{e.name}</TD>
                <TD>{e.position ?? '-'}</TD>
                <TD>{e.division ?? '-'}</TD>
                <TD>{formatTanggal(e.joinDate)}</TD>
                <TD>{e.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Link href={`/master/employees/${e.id}`}>
                        <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" />{t('btn.edit')}</Button>
                      </Link>
                      {e.isActive && (
                        <form action={deleteEmployee.bind(null, e.id)}>
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
