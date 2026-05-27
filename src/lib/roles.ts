export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PRODUCTION: 'PRODUCTION',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  SALES: 'SALES',
  PURCHASING: 'PURCHASING',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTING: 'ACCOUNTING',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Administrator',
  MANAGER: 'Manajer',
  PRODUCTION: 'Produksi',
  PROJECT_MANAGER: 'Manajer Proyek',
  SALES: 'Penjualan',
  PURCHASING: 'Pembelian',
  WAREHOUSE: 'Gudang',
  ACCOUNTING: 'Akuntansi',
};

// Role yang dapat dipilih lewat UI Admin (SUPER_ADMIN sengaja disembunyikan).
export const ASSIGNABLE_ROLES = Object.values(ROLES).filter(
  (r) => r !== 'SUPER_ADMIN',
) as Role[];

// Semua role termasuk SUPER_ADMIN — hanya untuk konteks /super.
export const ALL_ROLES = Object.values(ROLES) as Role[];

export function isSuperAdmin(role: Role | string | undefined): boolean {
  return role === 'SUPER_ADMIN';
}

export const BUSINESS_TYPES = [
  'Perorangan', 'PT', 'CV', 'UD', 'Firma', 'Yayasan', 'Koperasi', 'Lainnya',
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];
