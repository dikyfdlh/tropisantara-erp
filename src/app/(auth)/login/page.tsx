import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { getT } from '@/lib/i18n';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/dashboard';
  const errorParam = params.error;
  const { locale, t } = await getT();

  async function login(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    try {
      await signIn('credentials', { email, password, redirectTo: callbackUrl });
    } catch (e) {
      if ((e as Error).message?.includes('NEXT_REDIRECT')) throw e;
      redirect(`/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-600 to-brand-900 p-4 dark:from-neutral-800 dark:to-neutral-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-neutral-800">
        <div className="relative mb-6">
          {/* Locale switcher tetap di pojok kanan atas */}
          <div className="absolute right-0 top-0">
            <LocaleSwitcher current={locale} />
          </div>
          {/* Logo center — cache-buster v=20260527 untuk paksa browser fetch ulang */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png?v=20260527"
              alt="Tropisantara"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-neutral-100">{t('login.welcomeBack')}</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-neutral-400">{t('login.subtitle')}</p>

        {errorParam && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
            {t('login.invalidCreds')}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="anda@provisio.co.id" />
          </div>
          <div>
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full">{t('login.submit')}</Button>
        </form>
      </div>
    </div>
  );
}
