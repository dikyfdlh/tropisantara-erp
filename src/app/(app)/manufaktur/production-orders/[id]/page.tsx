import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatTanggal } from '@/lib/format';
import { requireUser } from '@/lib/rbac';
import { updateProductionOrderStatus, recordProducedQty } from '../actions';

const STATUSES = ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default async function ProductionOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const canWrite = user.role === 'ADMIN' || user.role === 'PRODUCTION';
  const { id } = await params;

  const po = await db.productionOrder.findUnique({
    where: { id },
    include: {
      product: { include: { uom: true } },
      bom: { include: { items: { include: { product: { include: { uom: true } } } } } },
    },
  });
  if (!po) notFound();

  // Hitung kebutuhan bahan baku berdasarkan BOM
  const ratio = po.bom ? po.targetQty / po.bom.outputQty : 0;
  const requirements = po.bom?.items.map((it) => ({
    productCode: it.product.code,
    productName: it.product.name,
    uom: it.product.uom.code,
    qtyNeeded: +(it.qty * ratio).toFixed(4),
  })) ?? [];

  return (
    <div>
      <PageHeader title={po.code} description={`${po.product.code} — ${po.product.name}`}>
        <Badge tone={statusTone(po.status)}>{po.status}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Informasi Order</h3>
          </div>
          <CardBody className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Produk Jadi" value={`${po.product.code} — ${po.product.name}`} />
            <Info label="Satuan" value={po.product.uom.code} />
            <Info label="Target Qty" value={po.targetQty.toString()} />
            <Info label="Diproduksi" value={po.producedQty.toString()} />
            <Info label="Tanggal Mulai" value={formatTanggal(po.startDate)} />
            <Info label="Deadline" value={formatTanggal(po.dueDate)} />
            <Info label="BOM" value={po.bom?.code ?? '-'} />
            <Info label="Dibuat" value={formatTanggal(po.createdAt, true)} />
            {po.notes && <div className="col-span-2"><Info label="Catatan" value={po.notes} /></div>}
          </CardBody>
        </Card>

        {canWrite && (
          <Card>
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-sm font-semibold">Aksi</h3>
            </div>
            <CardBody className="space-y-4">
              <form action={updateProductionOrderStatus.bind(null, id)}>
                <Label>Update Status</Label>
                <Select name="status" defaultValue={po.status}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Button type="submit" className="mt-2 w-full">Simpan Status</Button>
              </form>
              <form action={recordProducedQty.bind(null, id)}>
                <Label>Qty Diproduksi (running total)</Label>
                <Input name="producedQty" type="number" step="0.01" min="0" defaultValue={po.producedQty} />
                <Button type="submit" variant="outline" className="mt-2 w-full">Catat Produksi</Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Kebutuhan Bahan Baku (dari BOM)</h3>
            <p className="mt-1 text-xs text-slate-500">
              {po.bom ? `Berdasarkan ${po.bom.code} (output ${po.bom.outputQty}/batch).`
                      : 'PO ini belum dikaitkan dengan BOM.'}
            </p>
          </div>
          <CardBody className="!p-0">
            {requirements.length === 0 ? (
              <div className="p-4"><Empty>Tidak ada item.</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>Kode</TH><TH>Nama</TH><TH>Satuan</TH><TH className="text-right">Qty Dibutuhkan</TH>
                </TR></THead>
                <TBody>
                  {requirements.map((r) => (
                    <TR key={r.productCode}>
                      <TD className="font-medium">{r.productCode}</TD>
                      <TD>{r.productName}</TD>
                      <TD>{r.uom}</TD>
                      <TD className="text-right font-semibold">{r.qtyNeeded}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
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
