import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { markTerminPaid } from '../projects/actions';

export default async function TerminPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canMark = user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER' || user.role === 'ACCOUNTING';

  const termins = await db.termin.findMany({
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    include: { project: true },
  });

  return (
    <div>
      <PageHeader title={t('page.termin.title')} description={t('page.termin.desc')} />
      {termins.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.project')}</TH>
            <TH>{t('col.termin')}</TH>
            <TH>{t('field.description')}</TH>
            <TH className="text-right">{t('col.percent')}</TH>
            <TH className="text-right">{t('col.value')}</TH>
            <TH>{t('col.dueDate')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {termins.map((tr) => (
              <TR key={tr.id}>
                <TD className="font-medium">{tr.code}</TD>
                <TD>
                  <Link href={`/konstruksi/projects/${tr.projectId}`} className="text-brand-700 hover:underline dark:text-brand-300">
                    {tr.project.code}
                  </Link>{' '}{tr.project.name}
                </TD>
                <TD>#{tr.termNo}</TD>
                <TD>{tr.description}</TD>
                <TD className="text-right">{tr.percentage}%</TD>
                <TD className="text-right font-medium">{formatRupiah(tr.amount)}</TD>
                <TD>{formatTanggal(tr.dueDate)}</TD>
                <TD><Badge tone={statusTone(tr.status)}>{tr.status}</Badge></TD>
                <TD className="text-right">
                  {canMark && tr.status !== 'PAID' && (
                    <form action={markTerminPaid.bind(null, tr.projectId, tr.id)}>
                      <Button size="sm" variant="outline" type="submit">{t('page.termin.markPaid')}</Button>
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
