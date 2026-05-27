import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge, statusTone } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { Plus, ExternalLink } from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';

export default async function ProjectsPage() {
  const user = await requireUser();
  const { t } = await getT();
  const canWrite = user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER' || user.role === 'SUPER_ADMIN';
  const list = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, progresses: { orderBy: { date: 'desc' }, take: 1 } },
  });

  return (
    <div>
      <PageHeader title={t('page.projects.title')} description={t('page.projects.desc')}>
        {canWrite && (
          <Link href="/konstruksi/projects/new"><Button><Plus className="h-4 w-4" />{t('page.projects.createBtn')}</Button></Link>
        )}
      </PageHeader>

      {list.length === 0 ? <Empty>{t('empty.default')}</Empty> : (
        <Table>
          <THead><TR>
            <TH>{t('col.code')}</TH>
            <TH>{t('col.name')}</TH>
            <TH>{t('page.projects.client')}</TH>
            <TH className="text-right">{t('page.projects.contract')}</TH>
            <TH>{t('page.projects.period')}</TH>
            <TH className="text-right">{t('page.projects.progress')}</TH>
            <TH>{t('col.status')}</TH>
            <TH></TH>
          </TR></THead>
          <TBody>
            {list.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.code}</TD>
                <TD>{p.name}</TD>
                <TD>{p.customer.name}</TD>
                <TD className="text-right">{formatRupiah(p.contractValue)}</TD>
                <TD>{formatTanggal(p.startDate)} → {formatTanggal(p.endDate)}</TD>
                <TD className="text-right font-semibold">{p.progresses[0]?.percentage ?? 0}%</TD>
                <TD><Badge tone={statusTone(p.status)}>{p.status}</Badge></TD>
                <TD className="text-right">
                  <Link href={`/konstruksi/projects/${p.id}`}>
                    <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />{t('btn.detail')}</Button>
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
