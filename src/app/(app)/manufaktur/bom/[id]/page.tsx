import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { BomForm, type ProductOption } from '../form';
import { updateBom } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function EditBomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const { id } = await params;
  const [bom, products] = await Promise.all([
    db.bom.findUnique({ where: { id }, include: { items: true } }),
    db.product.findMany({
      where: { isActive: true, type: { in: ['FG', 'RAW'] } },
      include: { uom: true }, orderBy: { code: 'asc' },
    }),
  ]);
  if (!bom) notFound();
  const opts: ProductOption[] = products.map((p) => ({
    id: p.id, code: p.code, name: p.name, type: p.type, uom: p.uom.code,
  }));

  return (
    <div>
      <PageHeader title={`Edit ${bom.code}`} />
      <BomForm
        action={updateBom.bind(null, id)}
        products={opts}
        submitLabel="Update BOM"
        initial={{
          productId: bom.productId,
          description: bom.description,
          outputQty: bom.outputQty,
          items: bom.items.map((it) => ({ productId: it.productId, qty: it.qty, notes: it.notes ?? '' })),
        }}
      />
    </div>
  );
}
