import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { requireUser } from '@/lib/rbac';
import { addRab, deleteRab, addTermin, markTerminPaid, addProgress } from '../actions';
import Link from 'next/link';

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const canWrite = user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER';
  const canMarkPaid = canWrite || user.role === 'ACCOUNTING';
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      customer: true,
      rabItems: { orderBy: { no: 'asc' } },
      termins: { orderBy: { termNo: 'asc' } },
      progresses: { orderBy: { date: 'desc' } },
    },
  });
  if (!project) notFound();

  const rabTotal = project.rabItems.reduce((s, r) => s + r.total, 0);
  const terminTotal = project.termins.reduce((s, t) => s + t.amount, 0);
  const terminPaid = project.termins.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amount, 0);
  const latestProgress = project.progresses[0]?.percentage ?? 0;

  return (
    <div>
      <PageHeader title={project.code} description={project.name}>
        <Badge tone={statusTone(project.status)}>{project.status}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Nilai Kontrak" value={formatRupiah(project.contractValue)} />
        <Kpi label="Total RAB" value={formatRupiah(rabTotal)} />
        <Kpi label="Termin Terbayar" value={`${formatRupiah(terminPaid)} / ${formatRupiah(terminTotal)}`} />
        <Kpi label="Progress" value={`${latestProgress}%`} />
      </div>

      <div className="mt-6">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Informasi Proyek</h3>
          </div>
          <CardBody className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <Info label="Klien" value={project.customer.name} />
            <Info label="Lokasi" value={project.location ?? '-'} />
            <Info label="Mulai" value={formatTanggal(project.startDate)} />
            <Info label="Selesai" value={formatTanggal(project.endDate)} />
            {project.description && <div className="col-span-2 md:col-span-4"><Info label="Deskripsi" value={project.description} /></div>}
          </CardBody>
        </Card>
      </div>

      {/* ===== RAB ===== */}
      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Rencana Anggaran Biaya (RAB)</h3>
            <span className="text-xs text-slate-500">Total: <strong>{formatRupiah(rabTotal)}</strong></span>
          </div>
          <CardBody className="!p-0">
            {project.rabItems.length === 0 ? (
              <div className="p-4"><Empty>Belum ada item RAB.</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>No</TH><TH>Pekerjaan</TH><TH>Satuan</TH>
                  <TH className="text-right">Qty</TH><TH className="text-right">Harga Satuan</TH>
                  <TH className="text-right">Total</TH><TH></TH>
                </TR></THead>
                <TBody>
                  {project.rabItems.map((r) => (
                    <TR key={r.id}>
                      <TD>{r.no}</TD>
                      <TD>{r.workName}</TD>
                      <TD>{r.uom}</TD>
                      <TD className="text-right">{r.qty}</TD>
                      <TD className="text-right">{formatRupiah(r.unitPrice)}</TD>
                      <TD className="text-right font-medium">{formatRupiah(r.total)}</TD>
                      <TD className="text-right">
                        {canWrite && (
                          <form action={deleteRab.bind(null, id, r.id)}>
                            <Button size="sm" variant="ghost" type="submit">Hapus</Button>
                          </form>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
          {canWrite && (
            <div className="border-t border-slate-100 p-4">
              <form action={addRab.bind(null, id)} className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <div className="md:col-span-2"><Label>Pekerjaan *</Label><Input name="workName" required /></div>
                <div><Label>Satuan *</Label><Input name="uom" required placeholder="m2, ls, dll" /></div>
                <div><Label>Qty *</Label><Input name="qty" type="number" step="0.01" min="0.01" required /></div>
                <div><Label>Harga Satuan (Rp) *</Label><Input name="unitPrice" type="number" min={0} required /></div>
                <div className="flex items-end"><Button type="submit" className="w-full">Tambah</Button></div>
              </form>
            </div>
          )}
        </Card>
      </div>

      {/* ===== TERMIN ===== */}
      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Termin Pembayaran</h3>
            <span className="text-xs text-slate-500">Total: <strong>{formatRupiah(terminTotal)}</strong></span>
          </div>
          <CardBody className="!p-0">
            {project.termins.length === 0 ? (
              <div className="p-4"><Empty>Belum ada termin.</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>No</TH><TH>Kode</TH><TH>Deskripsi</TH>
                  <TH className="text-right">%</TH><TH className="text-right">Nilai</TH>
                  <TH>Jatuh Tempo</TH><TH>Status</TH><TH></TH>
                </TR></THead>
                <TBody>
                  {project.termins.map((t) => (
                    <TR key={t.id}>
                      <TD>{t.termNo}</TD>
                      <TD className="font-medium">{t.code}</TD>
                      <TD>{t.description}</TD>
                      <TD className="text-right">{t.percentage}%</TD>
                      <TD className="text-right font-medium">{formatRupiah(t.amount)}</TD>
                      <TD>{formatTanggal(t.dueDate)}</TD>
                      <TD><Badge tone={statusTone(t.status)}>{t.status}</Badge></TD>
                      <TD className="text-right">
                        {canMarkPaid && t.status !== 'PAID' && (
                          <form action={markTerminPaid.bind(null, id, t.id)}>
                            <Button size="sm" variant="outline" type="submit">Tandai Lunas</Button>
                          </form>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
          {canWrite && (
            <div className="border-t border-slate-100 p-4">
              <form action={addTermin.bind(null, id)} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="md:col-span-2"><Label>Deskripsi *</Label><Input name="description" required placeholder="DP 30%, Termin 1, dll" /></div>
                <div><Label>% Kontrak *</Label><Input name="percentage" type="number" step="0.01" min={0} max={100} required /></div>
                <div><Label>Nilai (Rp) *</Label><Input name="amount" type="number" min={0} required /></div>
                <div><Label>Jatuh Tempo *</Label><Input name="dueDate" type="date" required /></div>
                <div className="md:col-span-5"><Button type="submit">Tambah Termin</Button></div>
              </form>
            </div>
          )}
        </Card>
      </div>

      {/* ===== PROGRESS ===== */}
      <div className="mt-6">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Progress Lapangan</h3>
          </div>
          <CardBody className="!p-0">
            {project.progresses.length === 0 ? (
              <div className="p-4"><Empty>Belum ada laporan progress.</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>Tanggal</TH><TH className="text-right">Progress (%)</TH><TH>Catatan</TH>
                </TR></THead>
                <TBody>
                  {project.progresses.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatTanggal(p.date)}</TD>
                      <TD className="text-right font-semibold">{p.percentage}%</TD>
                      <TD>{p.notes ?? '-'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
          {canWrite && (
            <div className="border-t border-slate-100 p-4">
              <form action={addProgress.bind(null, id)} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div><Label>Tanggal</Label><Input name="date" type="date" /></div>
                <div><Label>Progress (%) *</Label><Input name="percentage" type="number" step="0.01" min={0} max={100} required /></div>
                <div className="md:col-span-2"><Label>Catatan</Label><Input name="notes" /></div>
                <div className="md:col-span-4"><Button type="submit">Catat Progress</Button></div>
              </form>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/konstruksi/projects"><Button variant="outline">Kembali</Button></Link>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
      </CardBody>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}
