'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

export type SupplierOption = { id: string; code: string; name: string };
export type ProductOption  = { id: string; code: string; name: string; buyPrice: number; uom: string };

type Item = { productId: string; qty: number; unitPrice: number };

export function PurchaseOrderForm({
  action, suppliers, products,
}: {
  action: (fd: FormData) => void | Promise<void>;
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const [items, setItems] = useState<Item[]>([{ productId: '', qty: 1, unitPrice: 0 }]);
  // PPN opsional — default 0.
  const [taxRate, setTaxRate] = useState(0);

  const totals = useMemo(() => {
    const rows = items.map((it) => ({ ...it, total: Math.round(it.qty * it.unitPrice) }));
    const subtotal = rows.reduce((s, r) => s + r.total, 0);
    const tax = Math.round((subtotal * taxRate) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  function addRow() { setItems([...items, { productId: '', qty: 1, unitPrice: 0 }]); }
  function removeRow(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function update(i: number, k: keyof Item, v: string | number) {
    setItems(items.map((it, idx) => {
      if (idx !== i) return it;
      const next = { ...it, [k]: v };
      if (k === 'productId') {
        const prod = products.find((p) => p.id === v);
        if (prod && !it.unitPrice) next.unitPrice = prod.buyPrice;
      }
      return next;
    }));
  }

  return (
    <form action={action}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Pemasok *</Label>
            <Select name="supplierId" required defaultValue="">
              <option value="">- pilih -</option>
              {suppliers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </div>
          <div><Label>Tanggal Order *</Label><Input name="orderDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          <div><Label>Tanggal Diharapkan</Label><Input name="expectedDate" type="date" /></div>
          <div>
            <Label>PPN (%) <span className="text-xs text-slate-400">(opsional, default 0)</span></Label>
            <Input name="taxRate" type="number" min={0} max={100} step="0.01" value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value || '0'))} />
          </div>
          <div className="md:col-span-3">
            <Label>Catatan</Label>
            <Textarea name="notes" rows={2} />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Item</h3>
            <Button type="button" size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" />Baris
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Produk</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Harga</th>
                  <th className="px-3 py-2 text-right">Subtotal</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <Select name="itemProductId" value={it.productId}
                        onChange={(e) => update(i, 'productId', e.target.value)} required>
                        <option value="">- pilih produk -</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.code} — {p.name} ({p.uom})</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2 w-24">
                      <Input name="itemQty" type="number" step="0.01" min="0.01" value={it.qty}
                        onChange={(e) => update(i, 'qty', parseFloat(e.target.value || '0'))} required />
                    </td>
                    <td className="px-3 py-2 w-32">
                      <Input name="itemPrice" type="number" min={0} value={it.unitPrice}
                        onChange={(e) => update(i, 'unitPrice', parseInt(e.target.value || '0', 10))} required />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatRupiah(Math.round(it.qty * it.unitPrice))}
                    </td>
                    <td className="px-3 py-2 w-12 text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(i)} disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-sm">
                <tr><td colSpan={3} className="px-3 py-2 text-right">Subtotal</td>
                  <td className="px-3 py-2 text-right font-medium">{formatRupiah(totals.subtotal)}</td><td></td></tr>
                <tr><td colSpan={3} className="px-3 py-2 text-right">PPN ({taxRate}%)</td>
                  <td className="px-3 py-2 text-right font-medium">{formatRupiah(totals.tax)}</td><td></td></tr>
                <tr><td colSpan={3} className="px-3 py-2 text-right text-base font-semibold">Total</td>
                  <td className="px-3 py-2 text-right text-base font-semibold">{formatRupiah(totals.total)}</td><td></td></tr>
              </tfoot>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Link href="/perdagangan/purchase-orders"><Button type="button" variant="outline">Batal</Button></Link>
        <Button type="submit">Simpan PO</Button>
      </div>
    </form>
  );
}
