import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { requireRole } from '@/lib/rbac';
import { STOCK_COLUMNS } from './columns';
import { StockIOPanel } from './client';
import { Info } from 'lucide-react';

export default async function StockIOPage() {
  await requireRole(['ADMIN', 'WAREHOUSE']);

  return (
    <div>
      <PageHeader
        title="Import / Export Stok per Gudang"
        description="Kelola saldo stok per (produk × gudang) lewat file CSV."
      />

      <Card className="mb-4 border-sky-200 bg-sky-50/70">
        <CardBody className="flex items-start gap-3 text-sm text-slate-700">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
          <div className="space-y-1">
            <p>
              Setiap baris CSV merepresentasikan saldo stok satu produk pada satu gudang.
              Kunci unik: kombinasi <code className="rounded bg-slate-200 px-1">productCode</code> + <code className="rounded bg-slate-200 px-1">warehouseCode</code>.
            </p>
            <p>
              <strong>Penting:</strong> import ini langsung menimpa saldo (bukan stok masuk/keluar).
              Untuk pencatatan transaksi gudang, gunakan modul GRN / Material Issue / Stock Adjustment.
            </p>
          </div>
        </CardBody>
      </Card>

      <StockIOPanel
        columns={STOCK_COLUMNS as unknown as { key: string; label: string; required: boolean; importable: boolean; hint?: string }[]}
      />
    </div>
  );
}
