'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const PRODUCT_TYPES = ['RAW', 'FG', 'MERCHANDISE', 'SERVICE'] as const;

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  uomId: z.string().min(1),
  type: z.enum(PRODUCT_TYPES),
  sellPrice: z.coerce.number().int().min(0).default(0),
  buyPrice: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

function parse(fd: FormData) {
  return schema.parse({
    name: fd.get('name'),
    description: fd.get('description') || null,
    categoryId: fd.get('categoryId'),
    uomId: fd.get('uomId'),
    type: fd.get('type'),
    sellPrice: fd.get('sellPrice') || 0,
    buyPrice: fd.get('buyPrice') || 0,
    minStock: fd.get('minStock') || 0,
    isActive: fd.get('isActive') === 'on',
  });
}

export async function createProduct(fd: FormData) {
  await requireRole(['ADMIN']);
  const data = parse(fd);
  const code = await nextCode('PRD');
  await db.product.create({ data: { code, ...data } });
  revalidatePath('/master/products');
  redirect('/master/products');
}

export async function updateProduct(id: string, fd: FormData) {
  await requireRole(['ADMIN']);
  const data = parse(fd);
  await db.product.update({ where: { id }, data });
  revalidatePath('/master/products');
  redirect('/master/products');
}

export async function deleteProduct(id: string) {
  await requireRole(['ADMIN']);
  await db.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath('/master/products');
}
