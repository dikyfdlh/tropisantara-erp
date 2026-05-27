import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { ProductForm } from '../form';
import { updateProduct } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN']);
  const { id } = await params;
  const [p, categories, uoms] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
    db.uom.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
  ]);
  if (!p) notFound();
  return (
    <div>
      <PageHeader title={`Edit ${p.code}`} description={p.name} />
      <ProductForm
        action={updateProduct.bind(null, id)}
        initial={p}
        submitLabel="Update"
        categories={categories}
        uoms={uoms}
      />
    </div>
  );
}
