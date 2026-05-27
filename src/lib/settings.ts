import { db } from '@/lib/db';

const DEFAULT_ID = 'default';

/**
 * Ambil profil perusahaan + relasi (bank accounts, whatsapp contacts).
 * Akan membuat record default bila belum ada.
 */
export async function getCompanySettings() {
  let s = await db.companySetting.findUnique({
    where: { id: DEFAULT_ID },
    include: {
      bankAccounts: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      whatsappContacts: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (s) return s;
  await db.companySetting.create({ data: { id: DEFAULT_ID } });
  s = await db.companySetting.findUnique({
    where: { id: DEFAULT_ID },
    include: {
      bankAccounts: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      whatsappContacts: { orderBy: { sortOrder: 'asc' } },
    },
  });
  return s!;
}

export type CompanySettings = Awaited<ReturnType<typeof getCompanySettings>>;
