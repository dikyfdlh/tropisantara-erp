'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

export type ProductOption = { id: string; code: string; name: string; type: string; uom: string };

type Item = { productId: string; qty: number; notes: string };

export function BomForm({
  action, products, initial, submitLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  products: ProductOption[];
  initial?: { productId: string; description: string | null; outputQty: number; items: Item[] };
  submitLabel: string;
}) {
  const fgs = products.filter((p) => p.type === 'FG');
  const raws = products.filter((p) => p.type === 'RAW');

  const [items, setItems] = useState<Item[]>(
    initial?.items?.length ? initial.items : [{ productId: '', qty: 1, notes: '' }]
  );

  function addRow()        { setItems([...items, { productId: '', qty: 1, notes: '' }]); }
  function removeRow(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, k: keyof Item, v: string | number) {
    setItems(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  }

  return (
    <form action={action}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label>Produk Jadi (FG) *</Label>
            <Select name="productId" required defaultValue={initial?.productId ?? ''}>
              <option value="">- pilih produk jadi -</option>
              {fgs.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </Select>
            {fgs.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">Belum ada produk bertipe FG. Buat dulu di Master Data → Produk.</p>
            )}
          </div>
          <div>
            <Label>Hasil per Batch (qty) *</Label>
            <Input name="outputQty" type="number" step="0.01" min="0.01" required
              defaultValue={initial?.outputQty ?? 1} />
          </div>
          <div className="md:col-span-3">
            <Label>Deskripsi</Label>
            <Textarea name="description" rows={2} defaultValue={initial?.description ?? ''} />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Bahan Baku</h3>
            <Button type="button" size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" />Tambah Baris
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Bahan Baku</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Catatan</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <Select
                        name="itemProductId"
                        value={it.productId}
                        onChange={(e) => updateRow(i, 'productId', e.target.value)}
                        required
                      >
                        <option value="">- pilih bahan -</option>
                        {raws.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name} ({p.uom})</option>)}
                      </Select>
                    </td>
                    <td className="px-3 py-2 w-32">
                      <Input
                        name="itemQty" type="number" step="0.01" min="0.01" required
                        value={it.qty}
                        onChange={(e) => updateRow(i, 'qty', parseFloat(e.target.value || '0'))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        name="itemNotes"
                        value={it.notes}
                        onChange={(e) => updateRow(i, 'notes', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 w-12 text-right">
                      <Button
                        type="button" size="sm" variant="ghost"
                        onClick={() => removeRow(i)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {raws.length === 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Belum ada produk bertipe RAW (bahan baku). Tambah di Master Data → Produk.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Link href="/manufaktur/bom"><Button type="button" variant="outline">Batal</Button></Link>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
