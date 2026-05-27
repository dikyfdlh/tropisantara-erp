import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { BUSINESS_TYPES } from '@/lib/roles';

type Init = {
  name: string; businessType: string; npwp: string | null;
  phone: string | null; whatsapp: string | null; email: string | null;
  address: string | null; city: string | null; province: string | null; postalCode: string | null;
  paymentTerm: number; isActive: boolean;
};

export function CustomerForm({
  action, initial, submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  initial?: Partial<Init>;
  submitLabel: string;
}) {
  return (
    <form action={action}>
      <Card>
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Identitas</h3>
        </div>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="name">Nama Pelanggan *</Label>
            <Input id="name" name="name" required defaultValue={initial?.name ?? ''} />
          </div>
          <div>
            <Label htmlFor="businessType">Jenis Badan Usaha *</Label>
            <Select id="businessType" name="businessType" defaultValue={initial?.businessType ?? 'Perorangan'} required>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" name="npwp" defaultValue={initial?.npwp ?? ''} placeholder="00.000.000.0-000.000" />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Kontak</h3>
        </div>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label>Telepon</Label><Input name="phone" defaultValue={initial?.phone ?? ''} /></div>
          <div><Label>WhatsApp</Label><Input name="whatsapp" defaultValue={initial?.whatsapp ?? ''} placeholder="+62 812 ..." /></div>
          <div className="md:col-span-2"><Label>Email</Label><Input name="email" type="email" defaultValue={initial?.email ?? ''} /></div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Alamat Pengiriman</h3>
        </div>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Alamat Lengkap (Jalan, No, RT/RW)</Label>
            <Textarea name="address" defaultValue={initial?.address ?? ''} rows={2}
              placeholder="Jl. Raya Malingping No. 123, RT 01/RW 02" />
          </div>
          <div><Label>Kota / Kabupaten</Label><Input name="city" defaultValue={initial?.city ?? ''} placeholder="Kabupaten Lebak" /></div>
          <div><Label>Provinsi</Label><Input name="province" defaultValue={initial?.province ?? ''} placeholder="Banten" /></div>
          <div><Label>Kode Pos</Label><Input name="postalCode" defaultValue={initial?.postalCode ?? ''} /></div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Setelan</h3>
        </div>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>Term Pembayaran (hari)</Label>
            <Input name="paymentTerm" type="number" min={0} max={365} defaultValue={initial?.paymentTerm ?? 30} />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300" />
              <span>Aktif</span>
            </label>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Link href="/master/customers"><Button type="button" variant="outline">Batal</Button></Link>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
