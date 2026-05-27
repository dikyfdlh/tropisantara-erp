import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/input';
import { Plus, Pencil } from 'lucide-react';
import { createWarehouse, deleteWarehouse } from './actions';

const TYPES = ['GENERAL', 'RAW_MATERIAL', 'FG', 'CONSTRUCTION', 'MERCHANDISE'];

export default async function WarehousesPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const list = await db.warehouse.findMany({ orderBy: { code: 'asc' } });

  return (
    <div>
      <PageHeader title={t('page.warehouses.title')} description={t('page.warehouses.desc')} />

      {canWrite && (
        <Card className="mb-6">
          <CardBody>
            <form action={createWarehouse} className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div><Label>{t('col.name')} *</Label><Input name="name" required /></div>
              <div>
                <Label>{t('col.type')}</Label>
                <Select name="type" defaultValue="GENERAL">
                  {TYPES.map((typ) => <option key={typ} value={typ}>{typ}</option>)}
                </Select>
              </div>
              <div><Label>{t('col.incharge')}</Label><Input name="incharge" /></div>
              <div><Label>{t('col.address')}</Label><Input name="address" /></div>
              <div className="flex items-end">
                <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('btn.add')}</Button>
              </div>
              <input type="hidden" name="isActive" value="on" />
            </form>
          </CardBody>
        </Card>
      )}

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('col.type')}</TH>
            <TH>{t('col.incharge')}</TH>
            <TH>{t('col.address')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((w) => (
              <TR key={w.id}>
                <TD className="font-medium">{w.code}</TD>
                <TD>{w.name}</TD>
                <TD><Badge tone="brand">{w.type}</Badge></TD>
                <TD>{w.incharge ?? '-'}</TD>
                <TD>{w.address ?? '-'}</TD>
                <TD>{w.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Link href={`/master/warehouses/${w.id}`}>
                        <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" />{t('btn.edit')}</Button>
                      </Link>
                      {w.isActive && (
                        <form action={deleteWarehouse.bind(null, w.id)}>
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
