'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { nextCode } from '@/lib/codegen';

const schema = z.object({
  name: z.string().min(2),
  position: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  joinDate: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

function parse(fd: FormData) {
  const d = schema.parse({
    name: fd.get('name'),
    position: fd.get('position') || null,
    division: fd.get('division') || null,
    phone: fd.get('phone') || null,
    email: fd.get('email') || null,
    joinDate: fd.get('joinDate') || null,
    isActive: fd.get('isActive') === 'on',
  });
  return { ...d, joinDate: d.joinDate ? new Date(d.joinDate) : null, email: d.email || null };
}

export async function createEmployee(fd: FormData) {
  await requireRole(['ADMIN']);
  const data = parse(fd);
  const code = await nextCode('EMP');
  await db.employee.create({ data: { code, ...data } });
  revalidatePath('/master/employees');
  redirect('/master/employees');
}

export async function updateEmployee(id: string, fd: FormData) {
  await requireRole(['ADMIN']);
  await db.employee.update({ where: { id }, data: parse(fd) });
  revalidatePath('/master/employees');
  redirect('/master/employees');
}

export async function deleteEmployee(id: string) {
  await requireRole(['ADMIN']);
  await db.employee.update({ where: { id }, data: { isActive: false } });
  revalidatePath('/master/employees');
}
