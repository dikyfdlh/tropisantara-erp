import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { ALL_ROLES, ROLE_LABELS } from '@/lib/roles';
import { superCreateUser, superSetPassword, superUpdateUser, superDeleteUser } from './actions';
import { Plus, Eye } from 'lucide-react';
import { PasswordReveal } from './password-reveal';

export default async function SuperUsersPage() {
  const me = await requireSuperAdmin();
  const { locale, t } = await getT();

  const list = await db.user.findMany({
    orderBy: [{ role: 'asc' }, { email: 'asc' }],
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, passwordPlain: true, createdAt: true,
    },
  });

  const youLabel = locale === 'en' ? '(you)' : '(Anda)';
  const actionsLabel = locale === 'en' ? 'Actions' : 'Aksi';
  const newPwdLabel = locale === 'en' ? 'New Password' : 'Password Baru';
  const setPwdLabel = locale === 'en' ? 'Set Password' : 'Set Password';
  const deleteAccLabel = locale === 'en' ? 'Delete Account' : 'Hapus Akun';

  return (
    <div>
      <PageHeader title={t('page.superUsers.title')} description={t('page.superUsers.desc')} />

      <Card className="mb-6">
        <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{t('page.superUsers.newAccount')}</h3>
        </div>
        <CardBody>
          <form action={superCreateUser} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div><Label>{t('col.name')} *</Label><Input name="name" required /></div>
            <div><Label>{t('col.email')} *</Label><Input name="email" type="email" required /></div>
            <div><Label>{t('field.password')} *</Label><Input name="password" type="text" minLength={6} required /></div>
            <div>
              <Label>{t('col.role')} *</Label>
              <Select name="role" required defaultValue="SALES">
                {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('btn.add')}</Button>
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
            <TH>{t('field.password')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((u) => {
              const isSelf = u.id === me.id;
              return (
                <TR key={u.id}>
                  <TD className="font-medium">{u.email}{isSelf && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">{youLabel}</span>}</TD>
                  <TD>{u.name}</TD>
                  <TD>
                    <Badge tone={u.role === 'SUPER_ADMIN' ? 'amber' : 'brand'}>
                      {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                    </Badge>
                  </TD>
                  <TD>
                    <PasswordReveal value={u.passwordPlain ?? ''} />
                  </TD>
                  <TD>{u.isActive ? <Badge tone="emerald">{t('status.active')}</Badge> : <Badge>{t('status.inactive')}</Badge>}</TD>
                  <TD className="text-right">
                    <details>
                      <summary className="cursor-pointer text-sm text-brand-700 hover:underline dark:text-brand-300">{actionsLabel}</summary>
                      <div className="mt-3 space-y-3 rounded-md border border-slate-200 p-3 text-left dark:border-neutral-800">
                        <form action={superUpdateUser.bind(null, u.id)} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                          <div>
                            <Label>{t('col.name')}</Label><Input name="name" defaultValue={u.name} required />
                          </div>
                          <div>
                            <Label>{t('col.role')}</Label>
                            <Select name="role" defaultValue={u.role}>
                              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input type="checkbox" name="isActive" defaultChecked={u.isActive} className="h-4 w-4 rounded border-slate-300" />
                              <span>{t('field.active')}</span>
                            </label>
                          </div>
                          <div className="flex items-end">
                            <Button size="sm" type="submit" className="w-full">{t('btn.update')}</Button>
                          </div>
                        </form>

                        <form action={superSetPassword.bind(null, u.id)} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                          <div className="md:col-span-3">
                            <Label>{newPwdLabel}</Label>
                            <Input name="password" type="text" minLength={6} required />
                          </div>
                          <div className="flex items-end">
                            <Button size="sm" variant="outline" type="submit" className="w-full">{setPwdLabel}</Button>
                          </div>
                        </form>

                        {!isSelf && (
                          <form action={superDeleteUser.bind(null, u.id)}>
                            <Button size="sm" variant="danger" type="submit">{deleteAccLabel}</Button>
                          </form>
                        )}
                      </div>
                    </details>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <p className="mt-4 text-xs text-slate-500 dark:text-neutral-400">
        <Eye className="inline h-3.5 w-3.5" /> {t('page.superUsers.passwordHint')}
      </p>
    </div>
  );
}
