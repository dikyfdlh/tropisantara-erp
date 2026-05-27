import { PageHeader } from '@/components/ui/page-header';
import { SupplierForm } from '../form';
import { createSupplier } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewSupplierPage() {
  await requireRole(['ADMIN', 'PURCHASING']);
  return (
    <div>
      <PageHeader title="Pemasok Baru" />
      <SupplierForm action={createSupplier} submitLabel="Simpan" />
    </div>
  );
}
