// Constants & helpers untuk RBAC yang aman dipakai di client component
// (tanpa import server-only seperti auth/db/redirect).
import type { Role } from './roles';

/**
 * SUPER_ADMIN selalu lolos pengecekan akses.
 * Role lain dicek terhadap whitelist `allowed`.
 */
export function canAccess(role: Role | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  return allowed.includes(role);
}

export const MODULE_ROLES: Record<string, Role[]> = {
  dashboard:   ['ADMIN','MANAGER','PRODUCTION','PROJECT_MANAGER','SALES','PURCHASING','WAREHOUSE','ACCOUNTING'],
  master:      ['ADMIN','MANAGER','PRODUCTION','PROJECT_MANAGER','SALES','PURCHASING','WAREHOUSE','ACCOUNTING'],
  manufaktur:  ['ADMIN','MANAGER','PRODUCTION','WAREHOUSE','ACCOUNTING'],
  konstruksi:  ['ADMIN','MANAGER','PROJECT_MANAGER','WAREHOUSE','ACCOUNTING'],
  perdagangan: ['ADMIN','MANAGER','SALES','PURCHASING','WAREHOUSE','ACCOUNTING'],
  inventaris:  ['ADMIN','MANAGER','PRODUCTION','PROJECT_MANAGER','SALES','PURCHASING','WAREHOUSE','ACCOUNTING'],
  keuangan:    ['ADMIN','MANAGER','ACCOUNTING'],
  admin:       ['ADMIN'],
  // 'super' tidak didaftarkan di sini — SUPER_ADMIN dicek terpisah agar
  // role lain tidak bisa pernah masuk meskipun ada bug.
};

export const MODULE_WRITE_ROLES: Record<string, Role[]> = {
  master:     ['ADMIN'],
  manufaktur: ['ADMIN','PRODUCTION'],
  konstruksi: ['ADMIN','PROJECT_MANAGER'],
  sales:      ['ADMIN','SALES'],
  purchase:   ['ADMIN','PURCHASING'],
  inventaris: ['ADMIN','WAREHOUSE'],
  keuangan:   ['ADMIN','ACCOUNTING'],
  admin:      ['ADMIN'],
};
