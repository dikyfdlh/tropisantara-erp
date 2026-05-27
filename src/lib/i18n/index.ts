import { cookies } from 'next/headers';
import { messages, type Locale, type MessageKey } from './messages';

export type { Locale, MessageKey };
export { messages };

const LOCALE_COOKIE = 'locale';

/** Ambil locale aktif dari cookie. Default `id`. */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return v === 'en' ? 'en' : 'id';
}

/**
 * Buat fungsi terjemahan untuk locale tertentu.
 * Pakai `{0}`, `{1}`, dst. untuk variabel.
 *
 *     const t = tFor('en');
 *     t('dashboard.activeCustomers', 12)  // → "12 active customers"
 */
export function tFor(locale: Locale) {
  return (key: MessageKey, ...vars: (string | number)[]): string => {
    let s: string = messages[locale][key] ?? messages.id[key] ?? key;
    vars.forEach((v, i) => { s = s.replaceAll(`{${i}}`, String(v)); });
    return s;
  };
}

/** Shortcut server-side: ambil locale + fungsi t sekaligus. */
export async function getT() {
  const locale = await getLocale();
  return { locale, t: tFor(locale) };
}
