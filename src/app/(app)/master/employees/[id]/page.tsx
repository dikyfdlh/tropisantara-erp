import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { EmployeeForm } from '../form';
import { updateEmployee } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN']);
  const { id } = await params;
  const e = await db.employee.findUnique({ where: { id } });
  if (!e) notFound();
  return (
    <div>
      <PageHeader title={`Edit ${e.code}`} description={e.name} />
      <EmployeeForm action={updateEmployee.bind(null, id)} initial={e} submitLabel="Update" />
    </div>
  );
}
