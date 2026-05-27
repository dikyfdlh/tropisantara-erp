'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';

const TYPES = ['RAW_MATERIAL', 'FINISHED_GOOD', 'MERCHANDISE', 'CONSTRUCTION_MATERIAL', 'SERVICE'] as const;
const schema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Z0-9-]+$/i),
  name: z.string().min(2),
  type: z.enum(TYPES),
});

export async function createCategory(fd: FormData) {
  await requireRole(['ADMIN']);
  const data = schema.parse({
    code: String(fd.get('code') ?? '').toUpperCase(),
    name: fd.get('name'),
    type: fd.get('type'),
  });
  await db.category.create({ data });
  revalidatePath('/master/categories');
}

export async function toggleCategory(id: string) {
  await requireRole(['ADMIN']);
  const c = await db.category.findUnique({ where: { id } });
  if (!c) return;
  await db.category.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidatePath('/master/categories');
}
