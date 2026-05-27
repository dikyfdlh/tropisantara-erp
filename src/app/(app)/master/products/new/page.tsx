import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { ProductForm } from '../form';
import { createProduct } from '../actions';
import { requireRole } from '@/lib/rbac';

export default async function NewProductPage() {
  await requireRole(['ADMIN']);
  const [categories, uoms] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
    db.uom.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
  ]);
  return (
    <div>
      <PageHeader title="Produk Baru" />
      <ProductForm action={createProduct} submitLabel="Simpan" categories={categories} uoms={uoms} />
    </div>
  );
}
