import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/lib/roles';
import { createUser, toggleUser, resetPassword } from './actions';
import { Plus } from 'lucide-react';

export default async function UsersAdminPage() {
  await requireRole(['ADMIN']);
  const { t } = await getT();

  const list = await db.user.findMany({
    where: { role: { not: 'SUPER_ADMIN' } },
    orderBy: { email: 'asc' },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return (
    <div>
      <PageHeader title={t('page.users.title')} description={t('page.users.desc')} />

      <Card className="mb-6">
        <CardBody>
          <form action={createUser} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div><Label>{t('col.name')} *</Label><Input name="name" required /></div>
            <div><Label>{t('col.email')} *</Label><Input name="email" type="email" required /></div>
            <div><Label>{t('field.password')} *</Label><Input name="password" type="text" minLength={6} required /></div>
            <div>
              <Label>{t('col.role')} *</Label>
              <Select name="role" required defaultValue="SALES">
                {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('btn.createAccount')}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.email')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('col.role')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.email}</TD>
                <TD>{u.name}</TD>
                <TD><Badge tone="brand">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</Badge></TD>
                <TD>{u.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <form action={resetPassword.bind(null, u.id)}>
                      <Button size="sm" variant="outline" type="submit">{t('btn.resetPassword')}</Button>
                    </form>
                    <form action={toggleUser.bind(null, u.id)}>
                      <Button size="sm" variant={u.isActive ? 'danger' : 'primary'} type="submit">
                        {u.isActive ? t('btn.deactivate') : t('btn.activate')}
                      </Button>
                    </form>
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
