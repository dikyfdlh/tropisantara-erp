import { db } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { updateWarehouse } from '../actions';
import { requireRole } from '@/lib/rbac';

const TYPES = ['GENERAL', 'RAW_MATERIAL', 'FG', 'CONSTRUCTION', 'MERCHANDISE'];

export default async function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN']);
  const { id } = await params;
  const w = await db.warehouse.findUnique({ where: { id } });
  if (!w) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${w.code}`} description={w.name} />
      <form action={updateWarehouse.bind(null, id)}>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><Label>Nama *</Label><Input name="name" required defaultValue={w.name} /></div>
            <div>
              <Label>Tipe</Label>
              <Select name="type" defaultValue={w.type}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label>Penanggung Jawab</Label><Input name="incharge" defaultValue={w.incharge ?? ''} /></div>
            <div className="md:col-span-2">
              <Label>Alamat</Label>
              <Textarea name="address" rows={3} defaultValue={w.address ?? ''} />
            </div>
            <div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={w.isActive}
                  className="h-4 w-4 rounded border-slate-300" />
                <span>Aktif</span>
              </label>
            </div>
          </CardBody>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Link href="/master/warehouses"><Button type="button" variant="outline">Batal</Button></Link>
          <Button type="submit">Update</Button>
        </div>
      </form>
    </div>
  );
}
