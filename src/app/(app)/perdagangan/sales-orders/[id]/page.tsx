import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { requireUser } from '@/lib/rbac';
import { updateSalesOrderStatus, generateInvoice, deleteSalesOrder } from '../actions';
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete';

const STATUSES = ['DRAFT', 'CONFIRMED', 'DELIVERED', 'INVOICED', 'PAID', 'CANCELLED'];

export default async function SODetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const canWrite = user.role === 'ADMIN' || user.role === 'SALES' || user.role === 'SUPER_ADMIN';
  const canInvoice = canWrite || user.role === 'ACCOUNTING';
  const canDelete = user.role === 'SUPER_ADMIN';
  const { id } = await params;

  const so = await db.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { include: { uom: true } } } },
      invoices: true,
    },
  });
  if (!so) notFound();

  return (
    <div>
      <PageHeader title={so.code} description={so.customer.name}>
        <Badge tone={statusTone(so.status)}>{so.status}</Badge>
        {canDelete && (
          <ConfirmDeleteButton
            action={deleteSalesOrder.bind(null, so.id)}
            label="Hapus SO"
            confirmText={`Yakin hapus ${so.code}? Invoice & pembayaran terkait juga ikut terhapus.`}
          />
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Informasi Order</h3></div>
          <CardBody className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <Info label="Pelanggan" value={so.customer.name} />
            <Info label="Tanggal Order" value={formatTanggal(so.orderDate)} />
            <Info label="Tanggal Kirim" value={formatTanggal(so.deliveryDate)} />
            <Info label="Subtotal" value={formatRupiah(so.subtotal)} />
            <Info label={`PPN (${so.taxRate}%)`} value={formatRupiah(so.tax)} />
            <Info label="Total" value={formatRupiah(so.total)} />
            {so.notes && <div className="col-span-3"><Info label="Catatan" value={so.notes} /></div>}
          </CardBody>
        </Card>

        {(canWrite || canInvoice) && (
          <Card>
            <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Aksi</h3></div>
            <CardBody className="space-y-4">
              {canWrite && (
                <form action={updateSalesOrderStatus.bind(null, id)}>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={so.status}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Button type="submit" className="mt-2 w-full">Update Status</Button>
                </form>
              )}
              {canInvoice && so.invoices.length === 0 && so.status !== 'CANCELLED' && (
                <form action={generateInvoice.bind(null, id)}>
                  <Button type="submit" variant="outline" className="w-full">Buat Invoice</Button>
                </form>
              )}
              {so.invoices.map((inv) => (
                <div key={inv.id} className="rounded-md border border-slate-200 p-2 text-sm">
                  <div className="font-medium">{inv.code}</div>
                  <a className="text-xs text-brand-700 hover:underline" href={`/perdagangan/invoices/${inv.id}`}>
                    Lihat invoice →
                  </a>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <Card>
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Item</h3></div>
          <CardBody className="!p-0">
            <Table>
              <THead><TR>
                <TH>Produk</TH><TH>UoM</TH>
                <TH className="text-right">Qty</TH><TH className="text-right">Harga</TH>
                <TH className="text-right">Diskon</TH><TH className="text-right">Subtotal</TH>
              </TR></THead>
              <TBody>
                {so.items.map((it) => (
                  <TR key={it.id}>
                    <TD>{it.product.code} — {it.product.name}</TD>
                    <TD>{it.product.uom.code}</TD>
                    <TD className="text-right">{it.qty}</TD>
                    <TD className="text-right">{formatRupiah(it.unitPrice)}</TD>
                    <TD className="text-right">{formatRupiah(it.discount)}</TD>
                    <TD className="text-right font-medium">{formatRupiah(it.total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
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
