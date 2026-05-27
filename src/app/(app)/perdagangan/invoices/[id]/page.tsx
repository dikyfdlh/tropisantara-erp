import Link from 'next/link';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { formatRupiah, formatTanggal, formatInvoiceNumber, paymentMethodLabel } from '@/lib/format';
import { requireUser } from '@/lib/rbac';
import { recordPayment, updatePaymentMethod, deleteInvoice } from '../actions';
import { Printer, FileDown } from 'lucide-react';
import { DeleteInvoiceButton } from './delete-button';

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const canPay = ['ADMIN', 'ACCOUNTING', 'SALES', 'SUPER_ADMIN'].includes(user.role);
  const canDelete = user.role === 'SUPER_ADMIN';
  const { id } = await params;

  const inv = await db.invoice.findUnique({
    where: { id },
    include: {
      salesOrder: { include: { customer: true, items: { include: { product: { include: { uom: true } } } } } },
      payments: { orderBy: { date: 'desc' } },
    },
  });
  if (!inv) notFound();

  const remaining = inv.total - inv.paid;
  const printedNo = formatInvoiceNumber(inv.code);

  return (
    <div>
      <PageHeader title={inv.code} description={`${printedNo} · ${inv.salesOrder.code} — ${inv.salesOrder.customer.name}`}>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
          <Link href={`/invoice-print/${inv.id}`} target="_blank">
            <Button size="sm" variant="outline"><Printer className="h-4 w-4" /> Pratinjau</Button>
          </Link>
          <Link href={`/invoice-print/${inv.id}?auto=1`} target="_blank">
            <Button size="sm"><FileDown className="h-4 w-4" /> Cetak / PDF</Button>
          </Link>
          {canDelete && (
            <DeleteInvoiceButton action={deleteInvoice.bind(null, inv.id)} code={inv.code} />
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Detail Invoice</h3></div>
          <CardBody className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <Info label="No. Cetak" value={printedNo} />
            <Info label="Pelanggan" value={inv.salesOrder.customer.name} />
            <Info label="Jenis Badan Usaha" value={inv.salesOrder.customer.businessType} />
            <Info label="Tanggal" value={formatTanggal(inv.date)} />
            <Info label="Jatuh Tempo" value={formatTanggal(inv.dueDate)} />
            <Info label="Metode Pembayaran" value={paymentMethodLabel(inv.paymentMethod)} />
            <Info label="Total" value={formatRupiah(inv.total)} />
            <Info label="Dibayar" value={formatRupiah(inv.paid)} />
            <Info label="Sisa" value={formatRupiah(remaining)} />
          </CardBody>
        </Card>

        <div className="space-y-4">
          {canPay && (
            <Card>
              <div className="border-b border-slate-100 p-4">
                <h3 className="text-sm font-semibold">Metode Pembayaran</h3>
                <p className="mt-1 text-xs text-slate-500">Yang dicetak pada invoice.</p>
              </div>
              <CardBody>
                <form action={updatePaymentMethod.bind(null, id)} className="flex gap-2">
                  <Select name="paymentMethod" defaultValue={inv.paymentMethod} className="flex-1">
                    <option value="CASH">Cash</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="GIRO">Giro</option>
                    <option value="COD">COD (Cash On Delivery)</option>
                  </Select>
                  <Button type="submit" size="sm">Simpan</Button>
                </form>
              </CardBody>
            </Card>
          )}

          {canPay && remaining > 0 && (
            <Card>
              <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Catat Pembayaran</h3></div>
              <CardBody>
                <form action={recordPayment.bind(null, id)} className="space-y-3">
                  <div><Label>Jumlah *</Label><Input name="amount" type="number" min={1} max={remaining} required defaultValue={remaining} /></div>
                  <div>
                    <Label>Metode</Label>
                    <Select name="method" defaultValue={inv.paymentMethod}>
                      <option value="CASH">Cash</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="GIRO">Giro</option>
                      <option value="COD">COD</option>
                    </Select>
                  </div>
                  <div><Label>Tanggal</Label><Input name="date" type="date" /></div>
                  <div><Label>Referensi</Label><Input name="reference" placeholder="No. rekening / no. giro" /></div>
                  <div><Label>Catatan</Label><Textarea name="notes" rows={2} /></div>
                  <Button type="submit" className="w-full">Simpan Pembayaran</Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Item dari SO</h3></div>
          <CardBody className="!p-0">
            <Table>
              <THead><TR><TH>Produk</TH><TH className="text-right">Qty</TH><TH className="text-right">Total</TH></TR></THead>
              <TBody>
                {inv.salesOrder.items.map((it) => (
                  <TR key={it.id}>
                    <TD>{it.product.code} — {it.product.name}</TD>
                    <TD className="text-right">{it.qty} {it.product.uom.code}</TD>
                    <TD className="text-right font-medium">{formatRupiah(it.total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold">Riwayat Pembayaran</h3></div>
          <CardBody className="!p-0">
            {inv.payments.length === 0 ? (
              <div className="p-4"><Empty /></div>
            ) : (
              <Table>
                <THead><TR><TH>Tanggal</TH><TH>Metode</TH><TH>Referensi</TH><TH className="text-right">Jumlah</TH></TR></THead>
                <TBody>
                  {inv.payments.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatTanggal(p.date)}</TD>
                      <TD>{paymentMethodLabel(p.method)}</TD>
                      <TD>{p.reference ?? '-'}</TD>
                      <TD className="text-right font-medium">{formatRupiah(p.amount)}</TD>
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
