import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { SalesOrderForm, type CustomerOption, type ProductOption } from '../form';
import { createSalesOrder } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewSOPage() {
  await requireRole(['ADMIN', 'SALES']);
  const [customers, products] = await Promise.all([
    db.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.product.findMany({
      where: { isActive: true, type: { in: ['FG', 'MERCHANDISE', 'SERVICE'] } },
      include: { uom: true }, orderBy: { code: 'asc' },
    }),
  ]);
  const cs: CustomerOption[] = customers.map((c) => ({ id: c.id, code: c.code, name: c.name }));
  const ps: ProductOption[]  = products.map((p) => ({
    id: p.id, code: p.code, name: p.name, sellPrice: p.sellPrice, uom: p.uom.code,
  }));

  return (
    <div>
      <PageHeader title="Sales Order Baru" />
      <SalesOrderForm action={createSalesOrder} customers={cs} products={ps} />
    </div>
  );
}
