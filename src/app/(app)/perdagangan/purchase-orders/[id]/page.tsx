import Link from 'next/link';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatRupiah, formatTanggal, formatPoNumber, paymentMethodLabel } from '@/lib/format';
import { requireUser } from '@/lib/rbac';
import {
  updatePOStatus, deletePurchaseOrder,
  updatePOPaymentMethod, recordSupplierPayment, deleteSupplierPayment,
} from '../actions';
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete';
import { Printer, FileDown } from 'lucide-react';

const STATUSES = ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'PAID', 'CANCELLED'];

export default async function PODetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const canWrite = user.role === 'ADMIN' || user.role === 'PURCHASING' || user.role === 'SUPER_ADMIN';
  const canPay = canWrite || user.role === 'ACCOUNTING';
  const canDelete = user.role === 'SUPER_ADMIN';
  const { id } = await params;

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { include: { uom: true } } } },
      payments: { orderBy: { date: 'desc' } },
    },
  });
  if (!po) notFound();

  const remaining = po.total - po.paid;
  const isFullyPaid = remaining <= 0;

  return (
    <div>
      <PageHeader
        title={po.code}
        description={`${formatPoNumber(po.code, po.orderDate)} · ${po.supplier.name}`}
      >
        <Badge tone={statusTone(po.status)}>{po.status}</Badge>
        <Link href={`/po-print/${po.id}`} target="_blank">
          <Button size="sm" variant="outline"><Printer className="h-4 w-4" /> Pratinjau</Button>
        </Link>
        <Link href={`/po-print/${po.id}?auto=1`} target="_blank">
          <Button size="sm"><FileDown className="h-4 w-4" /> Cetak / PDF</Button>
        </Link>
        {canDelete && (
          <ConfirmDeleteButton
            action={deletePurchaseOrder.bind(null, po.id)}
            label="Hapus PO"
            confirmText={`Yakin hapus ${po.code}? Items, Goods Receipt, & pembayaran terkait juga ikut terhapus.`}
          />
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" hoverable>
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Informasi PO</h3></div>
          <CardBody className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <Info label="Pemasok" value={po.supplier.name} />
            <Info label="Tanggal Order" value={formatTanggal(po.orderDate)} />
            <Info label="Tanggal Diharapkan" value={formatTanggal(po.expectedDate)} />
            <Info label="Subtotal" value={formatRupiah(po.subtotal)} />
            <Info label={`PPN (${po.taxRate}%)`} value={formatRupiah(po.tax)} />
            <Info label="Total" value={formatRupiah(po.total)} />
            <Info label="Dibayar" value={formatRupiah(po.paid)} />
            <Info label="Sisa Hutang" value={formatRupiah(remaining)} />
            <Info label="Metode Pembayaran" value={paymentMethodLabel(po.paymentMethod)} />
            {po.paidAt && <Info label="Lunas Pada" value={formatTanggal(po.paidAt)} />}
            {po.notes && <div className="col-span-3"><Info label="Catatan" value={po.notes} /></div>}
          </CardBody>
        </Card>

        <div className="space-y-4">
          {canWrite && (
            <Card>
              <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Aksi</h3></div>
              <CardBody className="space-y-3">
                <form action={updatePOStatus.bind(null, id)}>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={po.status}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Button type="submit" className="mt-2 w-full">Update Status</Button>
                </form>
              </CardBody>
            </Card>
          )}

          {canPay && (
            <Card>
              <div className="border-b border-slate-100 p-4">
                <h3 className="text-sm font-semibold">Metode Pembayaran</h3>
              </div>
              <CardBody>
                <form action={updatePOPaymentMethod.bind(null, id)} className="flex gap-2">
                  <Select name="paymentMethod" defaultValue={po.paymentMethod} className="flex-1">
                    <option value="CASH">Cash</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="GIRO">Giro</option>
                    <option value="COD">COD</option>
                  </Select>
                  <Button type="submit" size="sm">Simpan</Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* ===== Pembayaran ke Supplier ===== */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">
              {isFullyPaid ? '✅ Sudah Lunas' : 'Catat Pembayaran ke Supplier'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Pembayaran tercatat di sini akan dipakai di laporan <strong>Hutang (AP)</strong> dan <strong>Cashflow</strong>.
            </p>
          </div>
          <CardBody>
            {isFullyPaid ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <p>Total <strong>{formatRupiah(po.total)}</strong> telah dibayar penuh.</p>
                {po.paidAt && <p className="mt-1 text-xs">Tanggal pelunasan: {formatTanggal(po.paidAt)}</p>}
              </div>
            ) : canPay ? (
              <form action={recordSupplierPayment.bind(null, id)} className="space-y-3">
                <div>
                  <Label>Jumlah *</Label>
                  <Input name="amount" type="number" min={1} max={remaining} required defaultValue={remaining} />
                  <p className="mt-1 text-xs text-slate-500">Sisa hutang: <strong>{formatRupiah(remaining)}</strong></p>
                </div>
                <div>
                  <Label>Metode</Label>
                  <Select name="method" defaultValue={po.paymentMethod}>
                    <option value="CASH">Cash</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="GIRO">Giro</option>
                    <option value="COD">COD</option>
                  </Select>
                </div>
                <div><Label>Tanggal</Label><Input name="date" type="date" /></div>
                <div><Label>Referensi</Label><Input name="reference" placeholder="No. cek / nota / referensi transfer" /></div>
                <div><Label>Catatan</Label><Textarea name="notes" rows={2} /></div>
                <Button type="submit" className="w-full">Simpan Pembayaran</Button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Anda tidak memiliki akses untuk mencatat pembayaran.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold">Riwayat Pembayaran</h3>
          </div>
          <CardBody className="!p-0">
            {po.payments.length === 0 ? (
              <div className="p-4"><Empty>Belum ada pembayaran.</Empty></div>
            ) : (
              <Table>
                <THead><TR>
                  <TH>Tanggal</TH><TH>Metode</TH><TH>Referensi</TH>
                  <TH className="text-right">Jumlah</TH>{canPay && <TH></TH>}
                </TR></THead>
                <TBody>
                  {po.payments.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatTanggal(p.date)}</TD>
                      <TD>{paymentMethodLabel(p.method)}</TD>
                      <TD>{p.reference ?? '-'}</TD>
                      <TD className="text-right font-medium">{formatRupiah(p.amount)}</TD>
                      {canPay && (
                        <TD className="text-right">
                          <ConfirmDeleteButton
                            action={deleteSupplierPayment.bind(null, p.id)}
                            confirmText={`Hapus pembayaran ${formatRupiah(p.amount)} tanggal ${formatTanggal(p.date)}?`}
                            iconOnly
                          />
                        </TD>
                      )}
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Item</h3></div>
          <CardBody className="!p-0">
            <Table>
              <THead><TR>
                <TH>Produk</TH><TH>UoM</TH>
                <TH className="text-right">Qty</TH><TH className="text-right">Harga</TH><TH className="text-right">Total</TH>
              </TR></THead>
              <TBody>
                {po.items.map((it) => (
                  <TR key={it.id}>
                    <TD>{it.product.code} — {it.product.name}</TD>
                    <TD>{it.product.uom.code}</TD>
                    <TD className="text-right">{it.qty}</TD>
                    <TD className="text-right">{formatRupiah(it.unitPrice)}</TD>
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
