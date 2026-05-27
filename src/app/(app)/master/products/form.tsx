import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Textarea, Select } from '@/components/ui/input';

const TYPE_OPTIONS = [
  { value: 'RAW',         label: 'Bahan Baku' },
  { value: 'FG',          label: 'Barang Jadi (Manufaktur)' },
  { value: 'MERCHANDISE', label: 'Barang Dagangan' },
  { value: 'SERVICE',     label: 'Jasa' },
];

type Cat = { id: string; name: string; code: string };
type U = { id: string; code: string; name: string };
type Init = {
  name: string; description: string | null; categoryId: string; uomId: string;
  type: string; sellPrice: number; buyPrice: number; minStock: number; isActive: boolean;
};

export function ProductForm({
  action, initial, submitLabel, categories, uoms,
}: {
  action: (fd: FormData) => Promise<void>;
  initial?: Partial<Init>;
  submitLabel: string;
  categories: Cat[];
  uoms: U[];
}) {
  return (
    <form action={action}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Nama Produk *</Label>
            <Input name="name" required defaultValue={initial?.name ?? ''} />
          </div>
          <div>
            <Label>Tipe *</Label>
            <Select name="type" required defaultValue={initial?.type ?? 'MERCHANDISE'}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Kategori *</Label>
            <Select name="categoryId" required defaultValue={initial?.categoryId ?? ''}>
              <option value="">- pilih -</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Satuan (UoM) *</Label>
            <Select name="uomId" required defaultValue={initial?.uomId ?? ''}>
              <option value="">- pilih -</option>
              {uoms.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Harga Jual (Rp)</Label>
            <Input name="sellPrice" type="number" min={0} defaultValue={initial?.sellPrice ?? 0} />
          </div>
          <div>
            <Label>Harga Beli (Rp)</Label>
            <Input name="buyPrice" type="number" min={0} defaultValue={initial?.buyPrice ?? 0} />
          </div>
          <div>
            <Label>Stok Minimum</Label>
            <Input name="minStock" type="number" min={0} defaultValue={initial?.minStock ?? 0} />
          </div>
          <div className="md:col-span-2">
            <Label>Deskripsi</Label>
            <Textarea name="description" defaultValue={initial?.description ?? ''} rows={3} />
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300" />
              <span>Aktif</span>
            </label>
          </div>
        </CardBody>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        <Link href="/master/products"><Button type="button" variant="outline">Batal</Button></Link>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
