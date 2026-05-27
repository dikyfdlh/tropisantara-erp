# Software Design Document (SDD)
## Sistem Manajemen Enterprise — PT Provisio Permata Tropisantara

| Field      | Value                                  |
| ---------- | -------------------------------------- |
| Versi      | 1.0                                    |
| Tanggal    | 2026-05-24                             |
| Referensi  | SRS.md v1.0                            |
| Audiens    | Tim engineering & teknikal stakeholder |

---

## 1. Tujuan
Menjelaskan **bagaimana** kebutuhan dalam SRS.md akan diimplementasikan: arsitektur sistem, tech stack, struktur data, struktur kode, dan keputusan desain.

---

## 2. Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (Client)                          │
│        React Server Components + Client Components              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                     Next.js 15 (App Router)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pages (RSC) │ Server Actions │ Route Handlers (API)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Auth (NextAuth v5)  │  RBAC Middleware  │  Zod schemas  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Layer (lib/services/*) — business logic         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma Client
┌────────────────────────────▼────────────────────────────────────┐
│          PostgreSQL 14+ (or SQLite for local dev)               │
└─────────────────────────────────────────────────────────────────┘
```

**Pola:** Monolithic full-stack Next.js. Server Actions menjadi mekanisme utama untuk mutasi. Service Layer terpisah dari komponen UI agar logic dapat diuji & dipakai ulang lintas modul.

---

## 3. Tech Stack

| Lapisan          | Pilihan                              | Alasan                                                   |
| ---------------- | ------------------------------------ | -------------------------------------------------------- |
| Framework        | **Next.js 15 (App Router)**          | SSR/RSC, server actions, deploy mudah, 1 codebase        |
| Bahasa           | **TypeScript**                       | Type safety untuk domain bisnis kompleks                 |
| UI Styling       | **Tailwind CSS**                     | Utility-first cepat, tidak butuh design system custom    |
| Komponen UI      | **shadcn/ui-style** (custom inline)  | Dapat dikustom penuh tanpa lock-in                       |
| Form/Validation  | **React Hook Form + Zod**            | Validasi konsisten client & server                       |
| ORM              | **Prisma**                           | Migrasi mudah, type-safe, support PG + SQLite            |
| Database         | **PostgreSQL 14+** (prod) / SQLite (dev) | Standar industri; SQLite untuk onboarding cepat      |
| Auth             | **NextAuth v5 (Auth.js)**            | Mature, session cookie httpOnly, mendukung RBAC custom   |
| PDF              | **pdf-lib** atau **@react-pdf/renderer** | Cetak SO/PO/Invoice                                   |
| Charts           | **Recharts**                         | Dashboard sederhana                                      |
| Tabel            | **TanStack Table v8**                | Sort/filter/paginate ramah data besar                    |
| Format Tanggal   | **date-fns** + locale id             | Lokalisasi Indonesia                                     |
| State Server     | **React Query** *(opsional)*         | Bila perlu cache di client                               |

---

## 4. Struktur Direktori

```
Enterprise Management/
├── SRS.md
├── SDD.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx           // sidebar layout, session check
    │   │   ├── dashboard/page.tsx
    │   │   ├── master/
    │   │   │   ├── customers/...
    │   │   │   ├── suppliers/...
    │   │   │   ├── products/...
    │   │   │   ├── employees/...
    │   │   │   └── warehouses/...
    │   │   ├── manufaktur/
    │   │   │   ├── bom/...
    │   │   │   └── production-orders/...
    │   │   ├── konstruksi/
    │   │   │   ├── projects/...
    │   │   │   ├── rab/...
    │   │   │   └── termin/...
    │   │   ├── perdagangan/
    │   │   │   ├── sales-orders/...
    │   │   │   ├── purchase-orders/...
    │   │   │   └── invoices/...
    │   │   ├── inventaris/
    │   │   │   ├── stock/...
    │   │   │   └── adjustments/...
    │   │   ├── keuangan/
    │   │   │   ├── ar/...
    │   │   │   └── ap/...
    │   │   └── admin/
    │   │       └── users/...
    │   ├── api/
    │   │   └── auth/[...nextauth]/route.ts
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── ui/                      // primitives (Button, Input, Card, Table, ...)
    │   ├── layout/                  // Sidebar, Topbar, Breadcrumb
    │   └── forms/                   // reusable form fields
    ├── lib/
    │   ├── auth.ts                  // NextAuth config
    │   ├── db.ts                    // Prisma singleton
    │   ├── rbac.ts                  // role helpers, permission matrix
    │   ├── format.ts                // formatRupiah, formatTanggal
    │   ├── codegen.ts               // auto-kode dokumen (SO-2026-0001)
    │   └── services/
    │       ├── customer.service.ts
    │       ├── supplier.service.ts
    │       ├── product.service.ts
    │       ├── bom.service.ts
    │       ├── production-order.service.ts
    │       ├── project.service.ts
    │       ├── sales-order.service.ts
    │       ├── purchase-order.service.ts
    │       └── stock.service.ts
    ├── schemas/                     // Zod schemas (validasi)
    │   ├── customer.schema.ts
    │   ├── product.schema.ts
    │   └── ...
    └── types/
        └── index.ts
```

---

## 5. Model Data (ERD Ringkas)

### 5.1 Inti / Master
```
User ──< Role
Customer, Supplier, Employee, Warehouse, Uom, Category
Product ── belongsTo Category, Uom
```

### 5.2 Manufaktur
```
Bom ── hasMany BomItem
BomItem ── belongsTo Product (raw material), belongsTo Bom
ProductionOrder ── belongsTo Product (FG), belongsTo Bom
ProductionOrder ── hasMany MaterialIssue, hasMany ProductionReceipt
```

### 5.3 Konstruksi
```
Project ── belongsTo Customer
Project ── hasMany RabItem, hasMany Termin, hasMany ProjectProgress
Project ── hasMany ProjectMaterial, hasMany ProjectManpower
```

### 5.4 Perdagangan
```
SalesOrder ── belongsTo Customer
SalesOrder ── hasMany SalesOrderItem
SalesOrder ── hasMany DeliveryOrder, hasMany Invoice

PurchaseOrder ── belongsTo Supplier
PurchaseOrder ── hasMany PurchaseOrderItem
PurchaseOrder ── hasMany GoodsReceipt
```

### 5.5 Inventaris
```
StockLevel(product, warehouse) ─ saldo
StockMovement ─ log: IN/OUT/ADJUST + reference (PO/SO/PROD/ADJ)
StockAdjustment ─ form manual
```

### 5.6 Keuangan
```
Invoice ── hasMany Payment
PurchaseBill ── hasMany PaymentOut
```

Skema lengkap ada di `prisma/schema.prisma`.

---

## 6. Aturan Penomoran Dokumen

| Dokumen          | Pola                     | Contoh           |
| ---------------- | ------------------------ | ---------------- |
| Customer         | `CUST-XXXX`              | CUST-0001        |
| Supplier         | `SUP-XXXX`               | SUP-0001         |
| Product          | `PRD-XXXXX`              | PRD-00001        |
| Sales Order      | `SO-YYYY-NNNN`           | SO-2026-0001     |
| Purchase Order   | `PO-YYYY-NNNN`           | PO-2026-0001     |
| Production Order | `PRO-YYYY-NNNN`          | PRO-2026-0001    |
| Project          | `PRJ-YYYY-NNN`           | PRJ-2026-001     |
| Invoice          | `INV-YYYY-MM-NNNN`       | INV-2026-05-0001 |
| Delivery Order   | `DO-YYYY-MM-NNNN`        | DO-2026-05-0001  |
| GRN              | `GRN-YYYY-MM-NNNN`       | GRN-2026-05-0001 |
| Termin           | `TRM-{ProjectCode}-NN`   | TRM-PRJ-2026-001-01 |

Counter direset per tahun (atau per bulan untuk transaksi tinggi).

---

## 7. Autentikasi & RBAC

- **Mekanisme:** NextAuth v5 Credentials Provider, password hashed via `bcryptjs` cost 10.
- **Session:** JWT cookie httpOnly, secure, sameSite=lax.
- **Role:** enum `UserRole` di Prisma (ADMIN, MANAGER, PRODUCTION, PROJECT_MANAGER, SALES, PURCHASING, WAREHOUSE, ACCOUNTING).
- **Otorisasi:**
  - Layer 1: `middleware.ts` cek session untuk semua route `/app/*`.
  - Layer 2: helper `requireRole(['ADMIN','SALES'])` di setiap server action / page agar 403 jika tidak berhak.
  - Layer 3: UI menyembunyikan menu yang tidak dapat diakses (cosmetic; bukan keamanan utama).

---

## 8. Pola Server Action

Setiap mutasi mengikuti pola berikut:
```ts
'use server';

import { z } from 'zod';
import { requireRole } from '@/lib/rbac';
import { db } from '@/lib/db';

const schema = z.object({ /* ... */ });

export async function createCustomer(input: unknown) {
  await requireRole(['ADMIN', 'SALES']);
  const data = schema.parse(input);
  const code = await nextCode('CUST');
  return db.customer.create({ data: { code, ...data } });
}
```

Keuntungan:
- Validasi terpusat (Zod).
- RBAC dicek di server, bukan hanya UI.
- Auto type-safe ke client component.

---

## 9. UI Pattern

- **Layout:** Sidebar kiri (collapsible) + Topbar (user menu, search). Konten utama scrollable.
- **List page:** Header (title + tombol "Tambah") · Filter bar · Tabel · Pagination.
- **Detail page:** Tab atau section (Info, Items, History).
- **Form page:** Single-column responsive; aksi sticky di bawah.
- **Warna utama:** Indigo `#4F46E5` (primary), Emerald untuk sukses, Amber untuk warning, Rose untuk destructive.
- **Tipografi:** Inter (default Next.js) — readable, tidak butuh font kustom.

---

## 10. Strategi Stok Otomatis

Setiap perubahan stok harus menghasilkan satu baris `StockMovement`:
| Sumber                | Direction | Reference Type     |
| --------------------- | :-------: | ------------------ |
| GRN                   |    IN     | PURCHASE_ORDER     |
| Material Issue        |    OUT    | PRODUCTION_ORDER   |
| Production Receipt    |    IN     | PRODUCTION_ORDER   |
| Delivery Order        |    OUT    | SALES_ORDER        |
| Project Material Issue|    OUT    | PROJECT            |
| Stock Adjustment      |  IN/OUT   | ADJUSTMENT         |

`StockLevel` di-update via transaksi DB (Prisma `$transaction`) agar konsisten.

---

## 11. Strategi Testing (Roadmap)

MVP: smoke test manual via UI + skrip seed.
Setelah MVP:
- **Unit:** Vitest untuk service layer & util.
- **Integration:** Playwright untuk flow login → buat SO → DO → Invoice.
- **CI:** GitHub Actions menjalankan `pnpm lint && pnpm typecheck && pnpm test`.

---

## 12. Deployment

| Lingkungan  | Host                         | Database                     |
| ----------- | ---------------------------- | ---------------------------- |
| Local dev   | `pnpm dev` di workstation    | SQLite (`./prisma/dev.db`)   |
| Staging     | Vercel / Railway             | Neon / Supabase (PostgreSQL) |
| Production  | VPS internal / Vercel        | PostgreSQL self-managed/Neon |

Variabel rahasia di `.env` — **tidak pernah** di-commit. Migrasi via `prisma migrate deploy` saat release.

---

## 13. Keputusan Desain Penting

1. **SQLite untuk dev, PostgreSQL untuk prod** — onboarding zero-friction, prod tetap robust.
2. **Server Actions sebagai default mutasi** — kurangi boilerplate API route.
3. **Tidak pakai admin panel generator** (mis. Refine) — kontrol penuh untuk format dokumen Indonesia (NPWP, PPN 11%, dll).
4. **Soft delete via flag `isActive`** — audit-friendly, hindari kehilangan referensi historis.
5. **Audit log minimum** di MVP: simpan `createdById`, `updatedById`, `createdAt`, `updatedAt` pada dokumen transaksi. Audit log penuh menjadi backlog Fase 2.

---

## 14. Risiko & Mitigasi

| Risiko                                         | Mitigasi                                            |
| ---------------------------------------------- | --------------------------------------------------- |
| Scope sangat luas, MVP bisa molor              | Build fitur dasar dulu per modul, perluas iteratif  |
| Konsistensi stok rentan race condition         | Wrap setiap movement dalam `$transaction` Prisma    |
| Format pajak Indonesia berubah                 | Isolasi formula PPN di `lib/tax.ts`                 |
| User non-teknis sulit input data               | UI minimalis, validasi inline, contoh data via seed |

---

*Dokumen ini hidup. Update SDD setiap kali ada perubahan arsitektur, dependency baru, atau pivot teknis.*
