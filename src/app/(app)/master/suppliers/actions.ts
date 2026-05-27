'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';
import { BUSINESS_TYPES } from '@/lib/roles';

const schema = z.object({
  name: z.string().min(2),
  businessType: z.enum(BUSINESS_TYPES).default('PT'),
  npwp: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  paymentTerm: z.coerce.number().int().min(0).max(365).default(30),
  isActive: z.coerce.boolean().default(true),
});

function parse(fd: FormData) {
  return schema.parse({
    name: fd.get('name'),
    businessType: fd.get('businessType') || 'PT',
    npwp: fd.get('npwp') || null,
    phone: fd.get('phone') || null,
    whatsapp: fd.get('whatsapp') || null,
    email: fd.get('email') || null,
    address: fd.get('address') || null,
    city: fd.get('city') || null,
    province: fd.get('province') || null,
    postalCode: fd.get('postalCode') || null,
    paymentTerm: fd.get('paymentTerm') || 30,
    isActive: fd.get('isActive') === 'on',
  });
}

export async function createSupplier(fd: FormData) {
  await requireRole(['ADMIN', 'PURCHASING']);
  const data = parse(fd);
  const code = await nextCode('SUP');
  await db.supplier.create({ data: { code, ...data, email: data.email || null } });
  revalidatePath('/master/suppliers');
  redirect('/master/suppliers');
}

export async function updateSupplier(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'PURCHASING']);
  const data = parse(fd);
  await db.supplier.update({ where: { id }, data: { ...data, email: data.email || null } });
  revalidatePath('/master/suppliers');
  redirect('/master/suppliers');
}

export async function deleteSupplier(id: string) {
  await requireRole(['ADMIN']);
  await db.supplier.update({ where: { id }, data: { isActive: false } });
  revalidatePath('/master/suppliers');
}
