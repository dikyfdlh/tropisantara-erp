import { requireUser } from '@/lib/rbac';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getT, messages, type MessageKey } from '@/lib/i18n';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { t } = await getT();

  // Sidebar adalah Client Component → tidak bisa pakai server `t()` langsung.
  // Pre-render seluruh key sidebar di server lalu kirim sebagai map.
  const sidebarKeys = Object.keys(messages.id).filter((k) => k.startsWith('sidebar.')) as MessageKey[];
  const translations = Object.fromEntries(sidebarKeys.map((k) => [k, t(k)]));

  return (
    <div className="md:flex md:items-start">
      <Sidebar role={user.role} translations={translations} />
      <div className="min-w-0 flex-1">
        <Topbar user={user} />
        <main className="animate-fade-in p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
