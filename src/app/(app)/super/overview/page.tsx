import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/rbac';
import { getT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';

export default async function SuperOverviewPage() {
  await requireSuperAdmin();
  const { t } = await getT();

  const [
    users, customers, suppliers, products, employees, warehouses,
    boms, prodOrders, projects, salesOrders, purchaseOrders, invoices, payments,
  ] = await Promise.all([
    db.user.count(), db.customer.count(), db.supplier.count(), db.product.count(),
    db.employee.count(), db.warehouse.count(),
    db.bom.count(), db.productionOrder.count(),
    db.project.count(),
    db.salesOrder.count(), db.purchaseOrder.count(),
    db.invoice.count(), db.payment.count(),
  ]);

  // Labels: pakai sidebar.* yang sudah bilingual. Entity-entity tertentu pakai literal.
  const items: [string, number][] = [
    [t('sidebar.users'),            users],
    [t('sidebar.customers'),        customers],
    [t('sidebar.suppliers'),        suppliers],
    [t('sidebar.products'),         products],
    [t('sidebar.employees'),        employees],
    [t('sidebar.warehouses'),       warehouses],
    [t('sidebar.bom'),              boms],
    [t('sidebar.productionOrders'), prodOrders],
    [t('sidebar.projects'),         projects],
    [t('sidebar.salesOrders'),      salesOrders],
    [t('sidebar.purchaseOrders'),   purchaseOrders],
    [t('sidebar.invoices'),         invoices],
    ['Payment',                     payments],
  ];

  return (
    <div>
      <PageHeader title={t('page.superOverview.title')} description={t('page.superOverview.desc')} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(([label, count]) => (
          <Card key={label} hoverable>
            <CardBody>
              <div className="text-xs text-slate-500 dark:text-neutral-400">{label}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-neutral-100">{count}</div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
