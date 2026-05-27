import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { BomForm, type ProductOption } from '../form';
import { createBom } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewBomPage() {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const products = await db.product.findMany({
    where: { isActive: true, type: { in: ['FG', 'RAW'] } },
    include: { uom: true }, orderBy: { code: 'asc' },
  });
  const opts: ProductOption[] = products.map((p) => ({
    id: p.id, code: p.code, name: p.name, type: p.type, uom: p.uom.code,
  }));
  return (
    <div>
      <PageHeader title="BOM Baru" />
      <BomForm action={createBom} products={opts} submitLabel="Simpan BOM" />
    </div>
  );
}
