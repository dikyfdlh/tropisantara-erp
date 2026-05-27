import Link from 'next/link';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { createProject } from '../actions';
import { requireRole } from '@/lib/rbac';

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export default async function NewProjectPage() {
  await requireRole(['ADMIN', 'PROJECT_MANAGER']);
  const customers = await db.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  return (
    <div>
      <PageHeader title="Proyek Baru" />
      <form action={createProject}>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Nama Proyek *</Label><Input name="name" required /></div>
            <div>
              <Label>Klien *</Label>
              <Select name="customerId" required defaultValue="">
                <option value="">- pilih -</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </Select>
            </div>
            <div><Label>Lokasi</Label><Input name="location" /></div>
            <div><Label>Nilai Kontrak (Rp)</Label><Input name="contractValue" type="number" min={0} defaultValue={0} /></div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue="PLANNING">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div><Label>Tanggal Mulai *</Label><Input name="startDate" type="date" required /></div>
            <div><Label>Tanggal Selesai *</Label><Input name="endDate" type="date" required /></div>
            <div className="md:col-span-2">
              <Label>Deskripsi</Label>
              <Textarea name="description" rows={3} />
            </div>
          </CardBody>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Link href="/konstruksi/projects"><Button type="button" variant="outline">Batal</Button></Link>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </div>
  );
}
