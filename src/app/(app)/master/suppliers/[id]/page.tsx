import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SupplierForm } from '../form';
import { updateSupplier } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'PURCHASING']);
  const { id } = await params;
  const s = await db.supplier.findUnique({ where: { id } });
  if (!s) notFound();
  return (
    <div>
      <PageHeader title={`Edit ${s.code}`} description={s.name} />
      <SupplierForm action={updateSupplier.bind(null, id)} initial={s} submitLabel="Update" />
    </div>
  );
}
