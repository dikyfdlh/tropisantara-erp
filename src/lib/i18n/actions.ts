'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Locale } from './messages';

export async function setLocale(locale: Locale, redirectTo?: string) {
  const c = await cookies();
  c.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 tahun
    httpOnly: false,            // boleh dibaca dari client (cosmetic)
    sameSite: 'lax',
  });
  revalidatePath(redirectTo ?? '/');
}
