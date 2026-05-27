import { PageHeader } from '@/components/ui/page-header';
import { requireRole } from '@/lib/rbac';
import { PRODUCT_COLUMNS } from './columns';
import { ImportExportPanel } from './client';
import { Card, CardBody } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default async function ProductsIOPage() {
  await requireRole(['ADMIN']);

  return (
    <div>
      <PageHeader
        title="Import / Export Produk"
        description="Pilih kolom yang ingin disertakan saat ekspor atau diterapkan saat impor."
      />

      <Card className="mb-4 border-sky-200 bg-sky-50/70">
        <CardBody className="flex items-start gap-3 text-sm text-slate-700">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
          <div className="space-y-1">
            <p>Format file: <strong>CSV</strong> (UTF-8). Baris pertama adalah <em>header</em> dengan nama kolom seperti di daftar bawah.</p>
            <p>Saat impor, baris dicocokkan ke produk yang ada berdasarkan kolom <code className="rounded bg-slate-200 px-1">code</code> — bila sudah ada akan di-update, bila belum akan dibuat.</p>
            <p>Kolom <code className="rounded bg-slate-200 px-1">code</code> selalu disertakan otomatis. Centang kolom lain sesuai kebutuhan.</p>
          </div>
        </CardBody>
      </Card>

      <ImportExportPanel columns={PRODUCT_COLUMNS as unknown as { key: string; label: string; required: boolean; hint?: string }[]} />
    </div>
  );
}
