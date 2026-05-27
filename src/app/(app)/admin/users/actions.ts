'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { ASSIGNABLE_ROLES } from '@/lib/roles';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ASSIGNABLE_ROLES as [string, ...string[]]),
});

export async function createUser(fd: FormData) {
  await requireRole(['ADMIN']);
  const data = schema.parse({
    name: fd.get('name'),
    email: String(fd.get('email') ?? '').toLowerCase().trim(),
    password: fd.get('password'),
    role: fd.get('role'),
  });
  if (data.role === 'SUPER_ADMIN') throw new Error('Role SUPER_ADMIN tidak dapat dibuat dari sini.');
  const hash = await bcrypt.hash(data.password, 10);
  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hash,
      passwordPlain: data.password, // disimpan agar SUPER_ADMIN dapat melihat (per requirement)
      role: data.role,
    },
  });
  revalidatePath('/admin/users');
}

export async function toggleUser(id: string) {
  await requireRole(['ADMIN']);
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  if (u.role === 'SUPER_ADMIN') throw new Error('Tidak diizinkan.');
  await db.user.update({ where: { id }, data: { isActive: !u.isActive } });
  revalidatePath('/admin/users');
}

export async function resetPassword(id: string) {
  await requireRole(['ADMIN']);
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  if (u.role === 'SUPER_ADMIN') throw new Error('Tidak diizinkan.');
  const newPwd = 'pass1234';
  const hash = await bcrypt.hash(newPwd, 10);
  await db.user.update({ where: { id }, data: { password: hash, passwordPlain: newPwd } });
  revalidatePath('/admin/users');
}
