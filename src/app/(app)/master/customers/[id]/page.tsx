import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { CustomerForm } from '../form';
import { updateCustomer } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'SALES']);
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, id);
  return (
    <div>
      <PageHeader title={`Edit ${customer.code}`} description={customer.name} />
      <CustomerForm action={action} initial={customer} submitLabel="Update" />
    </div>
  );
}
