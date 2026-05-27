'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const STATUSES = ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

const createSchema = z.object({
  productId: z.string().min(1),
  bomId: z.string().optional().nullable(),
  targetQty: z.coerce.number().positive(),
  startDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export async function createProductionOrder(fd: FormData) {
  const user = await requireRole(['ADMIN', 'PRODUCTION']);
  const data = createSchema.parse({
    productId: fd.get('productId'),
    bomId: fd.get('bomId') || null,
    targetQty: fd.get('targetQty'),
    startDate: fd.get('startDate'),
    dueDate: fd.get('dueDate'),
    notes: fd.get('notes') || null,
  });
  const code = await nextCode('PRO');
  await db.productionOrder.create({
    data: {
      code,
      productId: data.productId,
      bomId: data.bomId || null,
      targetQty: data.targetQty,
      startDate: new Date(data.startDate),
      dueDate: new Date(data.dueDate),
      notes: data.notes,
      createdById: user.id,
    },
  });
  revalidatePath('/manufaktur/production-orders');
  redirect('/manufaktur/production-orders');
}

export async function updateProductionOrderStatus(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const status = String(fd.get('status') ?? '');
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error('Status tidak valid');
  await db.productionOrder.update({ where: { id }, data: { status } });
  revalidatePath(`/manufaktur/production-orders/${id}`);
  revalidatePath('/manufaktur/production-orders');
}

export async function recordProducedQty(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const qty = z.coerce.number().min(0).parse(fd.get('producedQty'));
  await db.productionOrder.update({ where: { id }, data: { producedQty: qty } });
  revalidatePath(`/manufaktur/production-orders/${id}`);
}
