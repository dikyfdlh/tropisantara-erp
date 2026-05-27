'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const TYPES = ['GENERAL', 'RAW_MATERIAL', 'FG', 'CONSTRUCTION', 'MERCHANDISE'] as const;

const schema = z.object({
  name: z.string().min(2),
  address: z.string().optional().nullable(),
  incharge: z.string().optional().nullable(),
  type: z.enum(TYPES).default('GENERAL'),
  isActive: z.coerce.boolean().default(true),
});

function parse(fd: FormData) {
  return schema.parse({
    name: fd.get('name'),
    address: fd.get('address') || null,
    incharge: fd.get('incharge') || null,
    type: fd.get('type') || 'GENERAL',
    isActive: fd.get('isActive') === 'on',
  });
}

export async function createWarehouse(fd: FormData) {
  await requireRole(['ADMIN']);
  const data = parse(fd);
  const code = await nextCode('WH');
  await db.warehouse.create({ data: { code, ...data } });
  revalidatePath('/master/warehouses');
  redirect('/master/warehouses');
}

export async function updateWarehouse(id: string, fd: FormData) {
  await requireRole(['ADMIN']);
  await db.warehouse.update({ where: { id }, data: parse(fd) });
  revalidatePath('/master/warehouses');
  redirect('/master/warehouses');
}

export async function deleteWarehouse(id: string) {
  await requireRole(['ADMIN']);
  await db.warehouse.update({ where: { id }, data: { isActive: false } });
  revalidatePath('/master/warehouses');
}
