import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table';
import { getCompanySettings } from '@/lib/settings';
import { requireSuperAdmin } from '@/lib/rbac';
import {
  updateCompanySettings, uploadLogo, removeLogo,
  addBankAccount, deleteBankAccount, makeBankPrimary,
  addWhatsappContact, deleteWhatsappContact,
} from './actions';
import { Plus, Upload, Trash2, Star } from 'lucide-react';

export default async function CompanySettingsPage() {
  await requireSuperAdmin();
  const s = await getCompanySettings();

  return (
    <div>
      <PageHeader
        title="Profil Perusahaan"
        description="Data ini dipakai di header / footer dokumen yang dicetak (invoice, surat jalan)."
      />

      {/* ============ Logo ============ */}
      <Card>
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Logo Perusahaan</h3>
          <p className="mt-1 text-xs text-slate-500">PNG / JPG / WEBP / SVG, maks. 5 MB. Bila kosong akan dipakai ikon palem default.</p>
        </div>
        <CardBody className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="grid h-24 w-24 place-items-center rounded-md border border-slate-200 bg-slate-50">
            {s.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.logoUrl} alt="Logo" className="max-h-20 max-w-20 object-contain" />
            ) : (
              <span className="text-xs text-slate-400">Belum ada</span>
            )}
          </div>
          <div className="flex-1">
            <form action={uploadLogo} className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                name="logo"
                accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
                required
                className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:hover:bg-brand-700"
              />
              <Button type="submit" size="sm"><Upload className="h-4 w-4" /> Upload</Button>
            </form>
            {s.logoUrl && (
              <form action={removeLogo} className="mt-2">
                <Button type="submit" size="sm" variant="danger"><Trash2 className="h-3.5 w-3.5" /> Hapus Logo</Button>
              </form>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ============ Identitas ============ */}
      <form action={updateCompanySettings} className="mt-4 space-y-4">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Identitas</h3>
          </div>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label>Nama Perusahaan *</Label>
              <Input name="companyName" required defaultValue={s.companyName} />
            </div>
            <div>
              <Label>Brand di Logo <span className="text-xs text-slate-400">(opsional)</span></Label>
              <Input name="brandName" defaultValue={s.brandName ?? ''} placeholder="TROPISANTARA" />
              <p className="mt-1 text-xs text-slate-500">Kosongkan bila tidak ingin tampil teks brand di samping logo.</p>
            </div>
            <div className="md:col-span-2">
              <Label>Tagline</Label>
              <Input name="tagline" defaultValue={s.tagline ?? ''} />
            </div>
            <div>
              <Label>NPWP</Label>
              <Input name="npwp" defaultValue={s.npwp ?? ''} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Alamat</h3>
          </div>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <Label>Alamat Lengkap</Label>
              <Textarea name="address" rows={2} defaultValue={s.address ?? ''} />
            </div>
            <div><Label>Kota / Kabupaten</Label><Input name="city" defaultValue={s.city ?? ''} /></div>
            <div><Label>Provinsi</Label><Input name="province" defaultValue={s.province ?? ''} /></div>
            <div><Label>Kode Pos</Label><Input name="postalCode" defaultValue={s.postalCode ?? ''} /></div>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Kontak Umum</h3>
            <p className="mt-1 text-xs text-slate-500">Untuk WhatsApp CS / Logistik / Admin, kelola pada bagian terpisah di bawah.</p>
          </div>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div><Label>Telepon Kantor</Label><Input name="phone" defaultValue={s.phone ?? ''} /></div>
            <div><Label>Email</Label><Input name="email" type="email" defaultValue={s.email ?? ''} /></div>
            <div><Label>Website</Label><Input name="website" defaultValue={s.website ?? ''} placeholder="https://provisio.co.id" /></div>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Tampilan Invoice</h3>
          </div>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Warna Aksen (HEX)</Label>
              <Input name="primaryColor" defaultValue={s.primaryColor} placeholder="#1f7a3a" />
            </div>
            <div></div>
            <div className="md:col-span-2">
              <Label>Catatan Footer Invoice</Label>
              <Textarea name="invoiceFooter" rows={3} defaultValue={s.invoiceFooter ?? ''} />
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Simpan Profil</Button>
        </div>
      </form>

      {/* ============ Rekening Bank ============ */}
      <Card className="mt-6">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Rekening Bank</h3>
          <p className="mt-1 text-xs text-slate-500">
            Bisa ditambah lebih dari satu. Yang ditandai <Badge tone="amber">UTAMA</Badge> akan dipakai
            sebagai default pada invoice metode transfer.
          </p>
        </div>
        <CardBody className="!p-0">
          {s.bankAccounts.length === 0 ? (
            <div className="p-4"><Empty>Belum ada rekening.</Empty></div>
          ) : (
            <Table>
              <THead><TR>
                <TH>Bank</TH><TH>Atas Nama</TH><TH>No. Rekening</TH><TH>Utama</TH><TH></TH>
              </TR></THead>
              <TBody>
                {s.bankAccounts.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-medium">{b.bankName}</TD>
                    <TD>{b.accountName}</TD>
                    <TD className="font-mono">{b.accountNumber}</TD>
                    <TD>{b.isPrimary ? <Badge tone="amber">UTAMA</Badge> : <Badge tone="slate">—</Badge>}</TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        {!b.isPrimary && (
                          <form action={makeBankPrimary.bind(null, b.id)}>
                            <Button size="sm" variant="outline" type="submit">
                              <Star className="h-3.5 w-3.5" /> Jadikan Utama
                            </Button>
                          </form>
                        )}
                        <form action={deleteBankAccount.bind(null, b.id)}>
                          <Button size="sm" variant="danger" type="submit"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </form>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
        <div className="border-t border-slate-100 p-4">
          <form action={addBankAccount} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div><Label>Bank *</Label><Input name="bankName" required placeholder="BCA / Mandiri / BRI" /></div>
            <div><Label>Atas Nama *</Label><Input name="accountName" required /></div>
            <div><Label>No. Rekening *</Label><Input name="accountNumber" required /></div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-slate-300" />
                <span>Tandai sebagai utama</span>
              </label>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> Tambah Rekening</Button>
            </div>
          </form>
        </div>
      </Card>

      {/* ============ WhatsApp Contacts ============ */}
      <Card className="mt-6">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Kontak WhatsApp (tampil di invoice)</h3>
          <p className="mt-1 text-xs text-slate-500">
            Bisa ditambah lebih dari satu — misalnya CS Penjualan, CS Logistik, dll.
          </p>
        </div>
        <CardBody className="!p-0">
          {s.whatsappContacts.length === 0 ? (
            <div className="p-4"><Empty>Belum ada nomor WhatsApp.</Empty></div>
          ) : (
            <Table>
              <THead><TR>
                <TH>Label</TH><TH>Nomor</TH><TH></TH>
              </TR></THead>
              <TBody>
                {s.whatsappContacts.map((w) => (
                  <TR key={w.id}>
                    <TD className="font-medium">{w.label}</TD>
                    <TD className="font-mono">{w.number}</TD>
                    <TD className="text-right">
                      <form action={deleteWhatsappContact.bind(null, w.id)}>
                        <Button size="sm" variant="danger" type="submit"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </form>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
        <div className="border-t border-slate-100 p-4">
          <form action={addWhatsappContact} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div><Label>Label *</Label><Input name="label" required defaultValue="Customer Service" /></div>
            <div className="md:col-span-2"><Label>Nomor WhatsApp *</Label><Input name="number" required placeholder="+62 821 1420 2006" /></div>
            <div className="flex items-end">
              <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> Tambah Nomor</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
