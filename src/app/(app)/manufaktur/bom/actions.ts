'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().positive(),
  notes: z.string().optional().nullable(),
});

const schema = z.object({
  productId: z.string().min(1),
  description: z.string().optional().nullable(),
  outputQty: z.coerce.number().positive().default(1),
  items: z.array(itemSchema).min(1, 'Tambahkan minimal 1 bahan baku'),
});

function parseItems(fd: FormData) {
  const productIds = fd.getAll('itemProductId').map(String);
  const qtys = fd.getAll('itemQty').map(String);
  const notes = fd.getAll('itemNotes').map(String);
  const items: { productId: string; qty: number; notes: string | null }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    if (!productIds[i]) continue;
    items.push({
      productId: productIds[i],
      qty: parseFloat(qtys[i] || '0'),
      notes: notes[i] || null,
    });
  }
  return items;
}

export async function createBom(fd: FormData) {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const data = schema.parse({
    productId: fd.get('productId'),
    description: fd.get('description') || null,
    outputQty: fd.get('outputQty') || 1,
    items: parseItems(fd),
  });
  const code = await nextCode('BOM');
  await db.bom.create({
    data: {
      code,
      productId: data.productId,
      description: data.description,
      outputQty: data.outputQty,
      items: { create: data.items },
    },
  });
  revalidatePath('/manufaktur/bom');
  redirect('/manufaktur/bom');
}

export async function updateBom(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PRODUCTION']);
  const data = schema.parse({
    productId: fd.get('productId'),
    description: fd.get('description') || null,
    outputQty: fd.get('outputQty') || 1,
    items: parseItems(fd),
  });

  await db.$transaction([
    db.bomItem.deleteMany({ where: { bomId: id } }),
    db.bom.update({
      where: { id },
      data: {
        productId: data.productId,
        description: data.description,
        outputQty: data.outputQty,
        items: { create: data.items },
      },
    }),
  ]);
  revalidatePath('/manufaktur/bom');
  redirect('/manufaktur/bom');
}

export async function deleteBom(id: string) {
  await requireRole(['ADMIN', 'PRODUCTION']);
  await db.bom.update({ where: { id }, data: { isActive: false } });
  revalidatePath('/manufaktur/bom');
}
