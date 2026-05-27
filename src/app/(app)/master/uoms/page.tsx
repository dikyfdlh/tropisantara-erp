import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { createUom, toggleUom } from './actions';
import { Plus } from 'lucide-react';

export default async function UomsPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const list = await db.uom.findMany({ orderBy: { code: 'asc' } });

  return (
    <div>
      <PageHeader title={t('page.uoms.title')} description={t('page.uoms.desc')} />

      {canWrite && (
        <Card className="mb-6">
          <CardBody>
            <form action={createUom} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div><Label>{t('col.code')} *</Label><Input name="code" required placeholder="PCS" /></div>
              <div><Label>{t('col.name')} *</Label><Input name="name" required placeholder="Pieces" /></div>
              <div className="flex items-end">
                <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('btn.add')}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.code}</TD>
                <TD>{u.name}</TD>
                <TD>{u.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <form action={toggleUom.bind(null, u.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        {u.isActive ? t('btn.deactivate') : t('btn.activate')}
                      </Button>
                    </form>
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
