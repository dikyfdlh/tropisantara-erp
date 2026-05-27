'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/rbac';
import { ALL_ROLES } from '@/lib/roles';

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
});

export async function superCreateUser(fd: FormData) {
  await requireSuperAdmin();
  const data = createSchema.parse({
    name: fd.get('name'),
    email: String(fd.get('email') ?? '').toLowerCase().trim(),
    password: fd.get('password'),
    role: fd.get('role'),
  });
  const hash = await bcrypt.hash(data.password, 10);
  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hash,
      passwordPlain: data.password,
      role: data.role,
    },
  });
  revalidatePath('/super/users');
}

const updateSchema = z.object({
  name: z.string().min(2),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
  isActive: z.coerce.boolean().default(true),
});

export async function superUpdateUser(id: string, fd: FormData) {
  await requireSuperAdmin();
  const data = updateSchema.parse({
    name: fd.get('name'),
    role: fd.get('role'),
    isActive: fd.get('isActive') === 'on',
  });
  await db.user.update({ where: { id }, data });
  revalidatePath('/super/users');
}

const pwdSchema = z.object({ password: z.string().min(6) });

export async function superSetPassword(id: string, fd: FormData) {
  await requireSuperAdmin();
  const { password } = pwdSchema.parse({ password: fd.get('password') });
  const hash = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { id },
    data: { password: hash, passwordPlain: password },
  });
  revalidatePath('/super/users');
}

export async function superDeleteUser(id: string) {
  const me = await requireSuperAdmin();
  if (id === me.id) throw new Error('Tidak dapat menghapus akun sendiri.');
  // Hard delete sengaja diizinkan untuk SUPER_ADMIN.
  // Catatan: foreign key dari user di transaksi (createdById) bersifat optional/nullable,
  // sehingga relasinya akan tetap valid setelah user dihapus.
  await db.user.delete({ where: { id } }).catch(async () => {
    // Bila gagal karena FK constraint, fallback ke non-aktif.
    await db.user.update({ where: { id }, data: { isActive: false } });
  });
  revalidatePath('/super/users');
}
