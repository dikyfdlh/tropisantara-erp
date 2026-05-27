import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { BudgetCalculator } from './calculator';
import { Info } from 'lucide-react';

export default async function AnggaranPage() {
  await requireRole(['ADMIN', 'PROJECT_MANAGER', 'MANAGER']);

  const [templates, customers] = await Promise.all([
    db.workItemTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    }),
    db.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Kalkulator Anggaran Proyek"
        description="Perhitungan RAB konstruksi berbasis template AHSP / SNI."
      />

      <Card className="mb-4 border-sky-200 bg-sky-50/70">
        <CardBody className="flex items-start gap-3 text-sm text-slate-700">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
          <div className="space-y-1">
            <p>
              Template item pekerjaan mengacu pada <strong>AHSP (Analisis Harga Satuan Pekerjaan)</strong> &amp; <strong>SNI</strong> umum konstruksi Indonesia.
              Komponen biaya: <em>material + tenaga kerja + peralatan</em>, sesuai praktik standar ISO 21500 / SNI 2839.
            </p>
            <p>
              Hasil perhitungan dapat <strong>disimpan langsung sebagai Proyek baru</strong> beserta RAB-nya, lengkap dengan
              overhead, kontingensi (risk reserve), dan PPN.
            </p>
          </div>
        </CardBody>
      </Card>

      <BudgetCalculator
        templates={templates.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          category: t.category,
          unit: t.unit,
          materialCost: t.materialCost,
          laborCost: t.laborCost,
          equipmentCost: t.equipmentCost,
          reference: t.reference ?? '',
        }))}
        customers={customers.map((c) => ({ id: c.id, code: c.code, name: c.name }))}
      />
    </div>
  );
}
