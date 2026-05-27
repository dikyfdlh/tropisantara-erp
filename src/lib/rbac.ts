import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/roles';

export { canAccess, MODULE_ROLES, MODULE_WRITE_ROLES } from '@/lib/permissions';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as { id?: string; email?: string; name?: string; role?: string };
  if (!u.id || !u.email || !u.role) return null;
  return { id: u.id, email: u.email, name: u.name ?? '', role: u.role as Role };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * SUPER_ADMIN secara otomatis lulus seluruh requireRole.
 */
export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === 'SUPER_ADMIN') return user;
  if (!allowed.includes(user.role)) {
    throw new Error(`Akses ditolak: butuh salah satu role [${allowed.join(', ')}], Anda: ${user.role}`);
  }
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }
  return user;
}
