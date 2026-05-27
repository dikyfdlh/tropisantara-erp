'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';

const schema = z.object({
  code: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/i),
  name: z.string().min(2),
});

export async function createUom(fd: FormData) {
  await requireRole(['ADMIN']);
  const data = schema.parse({
    code: String(fd.get('code') ?? '').toUpperCase(),
    name: fd.get('name'),
  });
  await db.uom.create({ data });
  revalidatePath('/master/uoms');
}

export async function toggleUom(id: string) {
  await requireRole(['ADMIN']);
  const u = await db.uom.findUnique({ where: { id } });
  if (!u) return;
  await db.uom.update({ where: { id }, data: { isActive: !u.isActive } });
  revalidatePath('/master/uoms');
}
