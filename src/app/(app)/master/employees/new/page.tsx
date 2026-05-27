import { PageHeader } from '@/components/ui/page-header';
import { EmployeeForm } from '../form';
import { createEmployee } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewEmployeePage() {
  await requireRole(['ADMIN']);
  return (
    <div>
      <PageHeader title="Karyawan Baru" />
      <EmployeeForm action={createEmployee} submitLabel="Simpan" />
    </div>
  );
}
