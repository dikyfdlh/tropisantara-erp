'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';
import { BUSINESS_TYPES } from '@/lib/roles';

const customerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  businessType: z.enum(BUSINESS_TYPES).default('Perorangan'),
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

function parseFD(fd: FormData) {
  return customerSchema.parse({
    name: fd.get('name'),
    businessType: fd.get('businessType') || 'Perorangan',
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

export async function createCustomer(fd: FormData) {
  const user = await requireRole(['ADMIN', 'SALES']);
  const data = parseFD(fd);
  const code = await nextCode('CUST');
  await db.customer.create({
    data: { code, ...data, email: data.email || null, createdById: user.id },
  });
  revalidatePath('/master/customers');
  redirect('/master/customers');
}

export async function updateCustomer(id: string, fd: FormData) {
  await requireRole(['ADMIN', 'SALES']);
  const data = parseFD(fd);
  await db.customer.update({
    where: { id },
    data: { ...data, email: data.email || null },
  });
  revalidatePath('/master/customers');
  redirect('/master/customers');
}

export async function deleteCustomer(id: string) {
  await requireRole(['ADMIN']);
  await db.customer.update({ where: { id }, data: { isActive: false } });
  revalidatePath('/master/customers');
}
