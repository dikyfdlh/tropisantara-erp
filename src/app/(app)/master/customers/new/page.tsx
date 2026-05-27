import { PageHeader } from '@/components/ui/page-header';
import { CustomerForm } from '../form';
import { createCustomer } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewCustomerPage() {
  await requireRole(['ADMIN', 'SALES']);
  return (
    <div>
      <PageHeader title="Pelanggan Baru" description="Tambah data pelanggan." />
      <CustomerForm action={createCustomer} submitLabel="Simpan" />
    </div>
  );
}
