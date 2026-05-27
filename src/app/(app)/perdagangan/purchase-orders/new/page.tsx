import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { PurchaseOrderForm, type SupplierOption, type ProductOption } from '../form';
import { createPurchaseOrder } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewPOPage() {
  await requireRole(['ADMIN', 'PURCHASING']);
  const [suppliers, products] = await Promise.all([
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.product.findMany({
      where: { isActive: true, type: { in: ['RAW', 'MERCHANDISE'] } },
      include: { uom: true }, orderBy: { code: 'asc' },
    }),
  ]);
  const ss: SupplierOption[] = suppliers.map((s) => ({ id: s.id, code: s.code, name: s.name }));
  const ps: ProductOption[]  = products.map((p) => ({
    id: p.id, code: p.code, name: p.name, buyPrice: p.buyPrice, uom: p.uom.code,
  }));
  return (
    <div>
      <PageHeader title="Purchase Order Baru" />
      <PurchaseOrderForm action={createPurchaseOrder} suppliers={ss} products={ps} />
    </div>
  );
}
