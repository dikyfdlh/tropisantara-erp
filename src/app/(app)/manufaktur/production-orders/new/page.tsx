import Link from 'next/link';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { createProductionOrder } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewProductionOrderPage() {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const [fgs, boms] = await Promise.all([
    db.product.findMany({ where: { isActive: true, type: 'FG' }, orderBy: { code: 'asc' } }),
    db.bom.findMany({ where: { isActive: true }, include: { product: true }, orderBy: { code: 'desc' } }),
  ]);

  return (
    <div>
      <PageHeader title="Production Order Baru" />
      <form action={createProductionOrder}>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Produk Jadi *</Label>
              <Select name="productId" required defaultValue="">
                <option value="">- pilih -</option>
                {fgs.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>BOM (opsional)</Label>
              <Select name="bomId" defaultValue="">
                <option value="">- tanpa BOM -</option>
                {boms.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.product.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Qty Target *</Label>
              <Input name="targetQty" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Mulai *</Label>
                <Input name="startDate" type="date" required />
              </div>
              <div>
                <Label>Deadline *</Label>
                <Input name="dueDate" type="date" required />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Catatan</Label>
              <Textarea name="notes" rows={3} />
            </div>
          </CardBody>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Link href="/manufaktur/production-orders"><Button type="button" variant="outline">Batal</Button></Link>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </div>
  );
}
