import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/input';
import { toInputDate } from '@/lib/format';

const DIVISIONS = ['PRODUCTION', 'CONSTRUCTION', 'SALES', 'PURCHASING', 'WAREHOUSE', 'ACCOUNTING', 'ADMIN', 'MANAGEMENT'];

type Init = {
  name: string; position: string | null; division: string | null;
  phone: string | null; email: string | null; joinDate: Date | null; isActive: boolean;
};

export function EmployeeForm({
  action, initial, submitLabel,
}: { action: (fd: FormData) => Promise<void>; initial?: Partial<Init>; submitLabel: string }) {
  return (
    <form action={action}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Nama Lengkap *</Label>
            <Input name="name" required defaultValue={initial?.name ?? ''} />
          </div>
          <div><Label>Jabatan</Label><Input name="position" defaultValue={initial?.position ?? ''} /></div>
          <div>
            <Label>Divisi</Label>
            <Select name="division" defaultValue={initial?.division ?? ''}>
              <option value="">-</option>
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div><Label>Telepon</Label><Input name="phone" defaultValue={initial?.phone ?? ''} /></div>
          <div><Label>Email</Label><Input name="email" type="email" defaultValue={initial?.email ?? ''} /></div>
          <div>
            <Label>Tanggal Bergabung</Label>
            <Input name="joinDate" type="date" defaultValue={toInputDate(initial?.joinDate ?? null)} />
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
        <Link href="/master/employees"><Button type="button" variant="outline">Batal</Button></Link>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
