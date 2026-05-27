'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/rbac';

// ====================== Profil utama ======================

const mainSchema = z.object({
  companyName: z.string().min(2),
  brandName: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),

  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),

  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  website: z.string().optional().nullable(),

  primaryColor: z.string().optional().default('#1f7a3a'),
  invoiceFooter: z.string().optional().nullable(),
});

function blank(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim();
  return s.length === 0 ? null : s;
}

export async function updateCompanySettings(fd: FormData) {
  await requireSuperAdmin();
  const data = mainSchema.parse({
    companyName: fd.get('companyName'),
    brandName: blank(fd.get('brandName')),
    tagline: blank(fd.get('tagline')),
    npwp: blank(fd.get('npwp')),
    address: blank(fd.get('address')),
    city: blank(fd.get('city')),
    province: blank(fd.get('province')),
    postalCode: blank(fd.get('postalCode')),
    phone: blank(fd.get('phone')),
    email: blank(fd.get('email')),
    website: blank(fd.get('website')),
    primaryColor: fd.get('primaryColor') || '#1f7a3a',
    invoiceFooter: blank(fd.get('invoiceFooter')),
  });

  await db.companySetting.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });
  revalidatePath('/super/settings');
}

// ====================== Logo (upload / hapus) ======================

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
const MAX_LOGO_MB = 5;

export async function uploadLogo(fd: FormData) {
  await requireSuperAdmin();
  const file = fd.get('logo') as File | null;
  if (!file || file.size === 0) throw new Error('Tidak ada file yang dipilih');

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('Tipe file tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.');
  }
  if (file.size > MAX_LOGO_MB * 1024 * 1024) {
    throw new Error(`Ukuran maksimal ${MAX_LOGO_MB} MB.`);
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const filename = `logo-${Date.now()}${ext}`;
  const filepath = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, bytes);

  // Hapus logo lama bila berada di /uploads (best-effort).
  const prev = await db.companySetting.findUnique({ where: { id: 'default' } });
  if (prev?.logoUrl?.startsWith('/uploads/')) {
    const oldPath = path.join(process.cwd(), 'public', prev.logoUrl);
    await unlink(oldPath).catch(() => {});
  }

  const url = `/uploads/${filename}`;
  await db.companySetting.upsert({
    where: { id: 'default' },
    update: { logoUrl: url },
    create: { id: 'default', logoUrl: url },
  });
  revalidatePath('/super/settings');
}

export async function removeLogo() {
  await requireSuperAdmin();
  const prev = await db.companySetting.findUnique({ where: { id: 'default' } });
  if (prev?.logoUrl?.startsWith('/uploads/')) {
    const oldPath = path.join(process.cwd(), 'public', prev.logoUrl);
    await unlink(oldPath).catch(() => {});
  }
  await db.companySetting.update({ where: { id: 'default' }, data: { logoUrl: null } });
  revalidatePath('/super/settings');
}

// ====================== Bank Accounts ======================

const bankSchema = z.object({
  bankName: z.string().min(1),
  accountName: z.string().min(1),
  accountNumber: z.string().min(1),
  isPrimary: z.coerce.boolean().default(false),
});

export async function addBankAccount(fd: FormData) {
  await requireSuperAdmin();
  const data = bankSchema.parse({
    bankName: fd.get('bankName'),
    accountName: fd.get('accountName'),
    accountNumber: fd.get('accountNumber'),
    isPrimary: fd.get('isPrimary') === 'on',
  });

  // Pastikan settings ada
  await db.companySetting.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  // Jika ditandai primary, reset primary lain.
  if (data.isPrimary) {
    await db.bankAccount.updateMany({
      where: { settingId: 'default' },
      data: { isPrimary: false },
    });
  }
  const last = await db.bankAccount.findFirst({
    where: { settingId: 'default' }, orderBy: { sortOrder: 'desc' },
  });
  await db.bankAccount.create({
    data: { ...data, settingId: 'default', sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidatePath('/super/settings');
}

export async function makeBankPrimary(id: string) {
  await requireSuperAdmin();
  await db.$transaction([
    db.bankAccount.updateMany({ where: { settingId: 'default' }, data: { isPrimary: false } }),
    db.bankAccount.update({ where: { id }, data: { isPrimary: true } }),
  ]);
  revalidatePath('/super/settings');
}

export async function deleteBankAccount(id: string) {
  await requireSuperAdmin();
  await db.bankAccount.delete({ where: { id } });
  revalidatePath('/super/settings');
}

// ====================== WhatsApp Contacts ======================

const waSchema = z.object({
  label: z.string().min(1).default('Customer Service'),
  number: z.string().min(4),
});

export async function addWhatsappContact(fd: FormData) {
  await requireSuperAdmin();
  const data = waSchema.parse({
    label: fd.get('label') || 'Customer Service',
    number: fd.get('number'),
  });

  await db.companySetting.upsert({
    where: { id: 'default' }, update: {}, create: { id: 'default' },
  });

  const last = await db.whatsappContact.findFirst({
    where: { settingId: 'default' }, orderBy: { sortOrder: 'desc' },
  });
  await db.whatsappContact.create({
    data: { ...data, settingId: 'default', sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidatePath('/super/settings');
}

export async function deleteWhatsappContact(id: string) {
  await requireSuperAdmin();
  await db.whatsappContact.delete({ where: { id } });
  revalidatePath('/super/settings');
}
