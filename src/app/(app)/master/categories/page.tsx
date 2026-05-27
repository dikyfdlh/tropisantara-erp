import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { createCategory, toggleCategory } from './actions';
import { Plus } from 'lucide-react';

const TYPES = ['RAW_MATERIAL', 'FINISHED_GOOD', 'MERCHANDISE', 'CONSTRUCTION_MATERIAL', 'SERVICE'];

export default async function CategoriesPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const list = await db.category.findMany({ orderBy: { code: 'asc' } });

  return (
    <div>
      <PageHeader title={t('page.categories.title')} description={t('page.categories.desc')} />

      {canWrite && (
        <Card className="mb-6">
          <CardBody>
            <form action={createCategory} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div><Label>{t('col.code')} *</Label><Input name="code" required placeholder="CAT-RM01" /></div>
              <div><Label>{t('col.name')} *</Label><Input name="name" required /></div>
              <div>
                <Label>{t('col.type')} *</Label>
                <Select name="type" required defaultValue="MERCHANDISE">
                  {TYPES.map((typ) => <option key={typ} value={typ}>{typ}</option>)}
                </Select>
              </div>
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
            <TH>{t('col.type')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.code}</TD>
                <TD>{c.name}</TD>
                <TD><Badge tone="brand">{c.type}</Badge></TD>
                <TD>{c.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  {canWrite && (
                    <form action={toggleCategory.bind(null, c.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        {c.isActive ? t('btn.deactivate') : t('btn.activate')}
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
